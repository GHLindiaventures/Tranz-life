# Tulsi chatbot: fix brief

Read this whole file first. Do the work in the phases below, in order. After each phase run `npm test` and `npm run test:chat`, and show me the result before starting the next phase.

## 0. Context (do not break this)

Tulsi is the wellness chat on the TranzLife site. Pipeline (server/chat-api.js `respond()`):

1. `emergencyReply()` (advisor-prompt.js): fixed 112 / 14416 replies.
2. `analyse(msgs)` (advisor-rules.js): **regex rules** decide mode, topic ("concerns"), who the message is about, facts about the person, red flags, and which products are allowed.
3. `fixedReply()` for modes that never reach the model (product, shop, medical, none...).
4. Otherwise gemma2:9b (Ollama) only rewords approved tips (wellness-tips.js). `problems()` (reply-check.js) rejects unapproved remedies, claims, products. Products are appended by code, never chosen by the model.

This safety design is deliberate (health + advertising rules). **Keep it.** The model must never invent remedies, products, doses or claims. The only thing that is broken is the *understanding* layer (step 2): it is keyword/regex matching, so it fails on typos, Tamil/Tanglish verb forms, paraphrases, and it mixes up who a fact is about.

## 1. Reproduced bugs (run against the current code with `analyse()`)

| # | Visitor says | Actual | Should be |
|---|---|---|---|
| A | (earlier) "my friend has bp and takes tablets", then "i am a drinker which product should i need to use" | Liver Booster **held back**, generic footer "If you are pregnant or breastfeeding, it is for a child, or you have a long-term condition…" (same footer and missing product as the client's screenshot; the earlier messages in that chat were not visible, so the friend's condition is inferred) | The friend's BP must not affect the visitor. Show Liver Booster with its honest note. |
| B | "my friend has diabetes", then "i smoke a lot, which product should i use" | PulmoClear gummies + Craving Control gummies **held back**, only 1 product shown, generic disclaimer | All 3 smoking products. Friend's diabetes is irrelevant. |
| C | "i drink a lot", then "which product should i use" | `shop` mode: dumps the full product list, context lost | Liver Booster (continue the previous topic) |
| D | "i smoke", then "which product is best" | `shop` mode, full list | Craving Control / PulmoClear |
| E | "i smoke a lot", then "what else" | tips, **no product** | tips + products |
| F | "i smoke and drink daily" | Liver Booster first; PulmoClear cut off by `.slice(0,3)` | Smoking is the main topic: smoking products first, liver as secondary |
| G | "nan kudikiren", "weekend la kudipen", "en husband romba kudikiraru", "daily kudikira pazhakkam iruku" | `none` → "I don't have trusted tips for that one yet…" | alcohol topic |
| H | "alchohol adikren", "cigerette pidikiren", "ciggarette quit panna help pannunga", "he puffs 20 a day" | `none` | alcohol / smoking |
| I | "lung problem iruku enna product", "my lungs feel heavy", "lung health improve panna enna pannalam", "I have a weak lungs" | `none` (or wrongly `tired` → Energy Booster) | PulmoClear (no disease claims; keep wording rules in catalog.js) |
| J | "what products do you have for lungs" | `shop`: names only, no one-line description | recommend by use-case with the catalogue `pitch` |
| K | "en friend drinks daily", then "en frnd ku enna product use pannalam" | `none` (generic text) | alcohol topic, about the friend, Liver Booster |
| L | "stomach pain after eating outside food", "i feel dizzy and no appetite", "i cant concentrate and feel low" | `none` | Either the closest approved topic (acidity / tired / stress) or a clarifying question. Never the dead-end "I don't have trusted tips" text for an ordinary message. |
| M | Friend topic, then own topic | the model keeps talking about the friend (the whole history, including the friend-addressed assistant reply, is sent to gemma2) | Reply is only about the visitor |

Probe script used (keep it as a test): call `analyse()` with `[{role:'user',content:'...'},{role:'assistant',content:'ok'},...]` and print `mode, concerns, products, heldBack, about`.

## 2. Root causes (file:line)

1. **Facts are not attached to a person.** advisor-rules.js:124 builds `about` from the last 4 user messages with no regard to who each message was about; only `about.other` is overwritten from the latest message (:126). So a friend's diabetes/BP/medicine/pregnancy/child is treated as the visitor's, which holds back swallowed products (:187) and appends the generic disclaimer (:211-212).
2. **Whole history goes to the model.** chat-api.js:54 sends `msgs.slice(0,-1)`, including assistant replies written about the friend. Gemma very likely follows the earlier pattern even though the routing note says "talk to the visitor" (inferred from the code and the client's report; the model itself was not run in my test, so confirm this one with a real chat).
3. **Topic carry-over only works for a tiny set of phrases.** `FOLLOW_UP_START`/`isFollowUp` (:84-85) misses "which product should i use / which is best / enna product"; `SHOP` (:88) then wins and prints the whole list. And follow-ups never carry `products` (:148 sets `concerns` but `fresh=false`, so :184 adds no products).
4. **Mixed topics are ordered by array order**, not by what the visitor is mainly asking about (`ranked()` :146, `.slice(0,3)` :184). `alcohol` comes before `smoking` in CONCERNS, so liver products win.
5. **Keyword vocabulary is incomplete.** wellness-tips.js `match` regexes (alcohol :110, smoking :302) have no Tamil verb forms (kudikiren, kudipen, kudikaran...), no common misspellings, no slang. There is no lung/breathing topic at all, so lung questions cannot reach PulmoClear except through "cough" or the product name.
6. **Dead ends.** `mode='none'` returns a fixed "I don't have trusted tips" text for anything the regexes miss (reply-check.js:134). This is the "generalised text" the client sees.
7. **No product knowledge for matching.** catalog.js has `about`/`use`/`caution`/`pitch`, but nothing that says *which visitor problems a product is for*. Product recommendation only happens through the CONCERNS `products` lists, never from the product's own description.

## 3. Fix plan

### Phase 1: surgical fixes (no new model, small diffs)

Edit only what is needed; keep the diffs small and explain each one.

1. **Per-message subject and facts.** In `analyse()`, compute `subject` (self | other) for each user message using the existing `ABOUT.other` regex (extend it: "en frnd", "frnd", "my bro", "ennoda appa"...). Build `about` only from user messages whose subject is `self` (or that have no subject marker and come *after* the latest self statement). Facts from an `other` message may be used **only** while the latest message is also about that same person. Keep the conservative behaviour for pregnancy/child/medicine *of the visitor*.
2. **History sent to the model.** In chat-api.js, when the latest message starts a new topic or has a different subject than the previous turn, send only the system prompt, the routing note and the latest user message (no earlier turns). Keep history only for genuine short follow-ups.
3. **Follow-ups.** Treat as follow-up of the previous topic (and keep products): "which product", "which one", "what should I use", "enna product", "anything for this", "recommend something", "what else", "innum", "vera enna". Mode becomes `tips`-with-products (or a new `recommend` mode) using the previous concern(s); it must not fall into `shop`. `shop` is only for explicit catalogue/price/delivery questions with no health topic in the recent turns.
4. **Topic ranking.** Rank concerns by position of the first match in the *latest message* (earlier mention = main topic), then product ids in that order. Raise the product cap to 4 or guarantee at least one product per concern.
5. **Vocabulary stop-gap.** Add Tamil/Tanglish verb forms and common misspellings to alcohol, smoking, stress, tired, cold; add a new `lungs` topic (breathing heaviness, weak lungs, dust, lung health; `products:['pulmoclear']`; doctor line: breathlessness, wheeze, chest tightness → see a doctor; follows the existing "no product for asthma/COPD" rule). Every new tip must come from public guidance with a source and a test, per the rules at the top of wellness-tips.js.
6. **Remove the dead end.** Replace the `none` text with a short, warm clarifying question plus 3-4 quick-reply topics, and log the unmatched text length only (no message text) so the team can see how often it happens. Note: the chat widget has chips (`CHIPS` in chat-widget.js); the server can return suggested chips via a header like `X-Suggest`.
7. **Tests.** Add every bug above (A to M) as a test in tests/server/advisor-rules.test.js and as cases in scripts/tulsi-eval.mjs.

### Phase 2: semantic understanding layer (the real fix)

Add `server/understand.js` and call it from `analyse()` **in addition to** the regexes. Output shape must feed the existing `analyse()` result so routingNote(), problems(), fixedReply() and the widget do not change.

Design:
- **Closed set only.** The understanding layer can only return ids that already exist: concern ids (wellness-tips.js), product ids (catalog.js), subject (self | other), intent (`health_problem | product_question | recommend | shop | smalltalk | other`). It never produces advice text.
- **Step A: embeddings (fast, ~50-100 ms).** Use Ollama `/api/embed` with a multilingual model (`ollama pull bge-m3`; if too heavy, `nomic-embed-text` plus the LLM step below). At server start, embed for every concern and every product a list of 15-30 short example utterances in English, Tamil script, Tanglish and with typos ("alchohol adikren", "nan kudikiren", "moochu vida kastama iruku"...). Put these in a new data file (e.g. `server/intents.js`), not in code. At request time embed the latest message, cosine-match, keep a topic if score ≥ threshold and margin over the next one ≥ margin. Tune threshold/margin on the eval set, do not guess.
- **Step B: LLM classifier (only when A is ambiguous).** Call gemma2:9b at temperature 0 with `format:"json"`, the closed lists, and 6-8 few-shot examples; validate the JSON against the closed lists and drop anything unknown. Budget: one extra call only on ambiguous messages.
- **Step C: if still unsure,** ask the clarifying question from Phase 1.6. Never guess a product.
- **Safety is a union, not a replacement.** `emergencyReply`, `RED_FLAGS`, `STOP_MEDS`, diagnose/dose/cure checks stay regex-based and run first, and they run on the original text. The semantic layer may only *add* a red flag (e.g. Step B says "possible emergency"), never remove one.
- **Subject and facts** come from the same layer (self vs other per message), replacing the regex-only guess from Phase 1.1 when confident.
- **Product retrieval by use-case.** Add to each catalogue entry: `forProblems` (plain phrases), `aliases` (Tamil/Tanglish names, "rollon", "lung booster", "liver tonic"), and 3-5 `questions`. Embed these too. "What do you have for lungs / smokers / periods / diabetic foot" then returns the matching products with their `pitch`, not just a name list. Keep catalog wording rules (support language only, Reviva never compared with medicine, coming-soon products never recommended).
- **Latency.** Warm up the embedding model in `warmUp()`; cache document embeddings in memory; if the embed call fails or times out (2 s), fall back to the regex-only path so the chat never breaks.

### Phase 3: evaluation set

- New `tests/server/understand.test.js` plus a data file of at least 80 labelled utterances (English, Tamil script, Tanglish, typos, friend/self, follow-ups) with expected `{subject, concerns, products}`. It must run **without** generating a reply, so it is fast and deterministic enough for CI (embedding call may be mocked with a stored vector fixture).
- Report accuracy per group, and list every miss. Target: ≥ 90% on concerns, 0 wrong-product recommendations in the set, 0 regressions in the existing 101 cases of `npm run test:chat`.
- Keep all existing safety tests passing unchanged.

## 4. Acceptance criteria (must all be true)

1. Bug table rows A to M behave as the "Should be" column. Test each one.
2. A friend's/relative's illness, medicine, pregnancy or child never changes the visitor's products or disclaimers, and the reply never mentions the friend once the visitor talks about themselves.
3. "Which product should I use / enna product use pannalam" right after a health message returns that topic's products, not the full catalogue.
4. A smoking question never returns Liver Booster as the first product; a drinking question returns Liver Booster with its honest note.
5. No ordinary message gets the "I don't have trusted tips" dead end; unknown topics get a clarifying question with chips.
6. All 101 existing eval cases and `npm test` still pass. No new remedy, claim, dose or product text is produced by the model.
7. If Ollama or the embedding model is unavailable, the chat still answers through the regex path.

## 5. How to work

- Make surgical edits and explain each one briefly; do not rewrite files wholesale.
- Do not touch the shop/3D/marketing code, only `server/`, `src/features/chat/chat-widget.js` (only if needed for chips), `src/data/catalog.js`, `tests/`, `scripts/tulsi-eval.mjs`.
- I run Ollama locally with `gemma2:9b`. Run the eval yourself with `npm run test:chat` and paste a short summary (pass/fail counts and any new failures).
- At the end, list only the files you changed.
