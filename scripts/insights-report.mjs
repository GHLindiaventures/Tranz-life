// Report from the anonymous Tulsi insights (server/insights.js). No message text is ever stored, so none is shown.
//   npm run insights                     everything saved so far
//   npm run insights -- --days 30        the last 30 days
//   npm run insights -- --from 2026-11-01 --to 2026-11-30
//   npm run insights -- --json           machine-readable output
import { createInsights, summarise } from '../server/insights.js';

const arg = name => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : null; };
const days = Number(arg('days'));
const from = arg('from') || (days ? new Date(Date.now() - (days - 1) * 864e5).toISOString().slice(0, 10) : '');
const to = arg('to') || '9999';

const store = createInsights(process.env);
const s = summarise(await store.read(), { from, to });
if (process.argv.includes('--json')){ console.log(JSON.stringify(s, null, 2)); process.exit(0); }

const pct = n => s.messages ? `${Math.round(100 * n / s.messages)}%` : '';
const table = (rows, cols) => rows.length ? rows.map(r => '  ' + cols.map(([k, w]) => String(r[k] ?? '').padEnd(w)).join('  ')).join('\n') : '  (none yet)';

console.log(`Tulsi insights  (${store.file})`);
if (!s.messages){ console.log('\nNothing saved yet for this period. Insights are saved as visitors use the chat.'); process.exit(0); }
console.log(`Period: ${s.from} to ${s.to}   Conversations: ${s.conversations}   Messages: ${s.messages}   Emergency replies: ${s.emergencies}`);

console.log('\nWHAT CUSTOMERS ASK ABOUT (top topics)');
console.log(table(s.topics.slice(0, 15).map(t => ({ ...t, share:pct(t.n), product:t.hasProduct ? 'we have a product' : 'NO PRODUCT' })), [['name', 26], ['n', 5], ['share', 5], ['product', 18]]));

console.log('\nPRODUCT GAPS (ideas for new products)');
console.log(' Topics we give tips for but have no product:');
console.log(table(s.gaps.topics, [['name', 26], ['n', 5]]));
console.log(' Issues Tulsi could not match to any topic (short anonymous labels):');
console.log(table(s.gaps.unmatched.slice(0, 20), [['name', 26], ['n', 5]]));
console.log(' Medical conditions mentioned (no product advice given):');
console.log(table(s.gaps.conditions, [['name', 26], ['n', 5]]));

console.log('\nPRODUCT INTEREST');
console.log(table(s.products.map(p => ({ ...p, rate:p.shown ? `${Math.round(100 * p.enquiries / p.shown)}%` : '' })), [['name', 40], ['shown', 6], ['enquiries', 10], ['rate', 5]]));
console.log('  (shown = times the product card was suggested; enquiries = Enquire clicks)');

console.log('\nWARNING SIGNS SEEN (sent to a doctor)');
console.log(table(s.warnings, [['id', 26], ['n', 5]]));
console.log('\nLANGUAGES');
console.log(table(s.languages, [['lang', 12], ['n', 5]]));
