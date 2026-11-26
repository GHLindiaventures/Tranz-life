-- TranzLife database, version 1: customers, their addresses and logins, orders, payments and order history.
-- Money is in whole rupees (integer), the same as the product catalogue. Times are timestamptz (stored in UTC).

-- ---------- customers ----------
-- A customer is a mobile number. They log in with a one-time code by SMS, so there is no password to store.
CREATE TABLE customers (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone          text        NOT NULL UNIQUE CHECK (phone ~ '^[6-9][0-9]{9}$'),   -- 10 digits, without +91
  name           text        NOT NULL DEFAULT '',
  email          text        NOT NULL DEFAULT '',
  gender         text        NOT NULL DEFAULT '' CHECK (gender IN ('', 'female', 'male')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_login_at  timestamptz
);

-- The customer's address book. At most one address per customer is the default (the partial unique index).
CREATE TABLE addresses (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid        NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  name         text        NOT NULL,
  phone        text        NOT NULL,
  address      text        NOT NULL,                     -- house number, street, area
  landmark     text        NOT NULL DEFAULT '',
  city         text        NOT NULL,
  state        text        NOT NULL,
  pincode      text        NOT NULL CHECK (pincode ~ '^[1-9][0-9]{5}$'),
  label        text        NOT NULL DEFAULT 'home' CHECK (label IN ('home', 'work')),
  is_default   boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX addresses_by_customer ON addresses (customer_id);
CREATE UNIQUE INDEX addresses_one_default ON addresses (customer_id) WHERE is_default;

-- ---------- logins ----------
-- One row per logged-in browser. The browser holds a random token in an HttpOnly cookie; only its SHA-256 hash is
-- stored here, so someone reading the database still cannot log in as anybody.
CREATE TABLE sessions (
  token_hash   text        PRIMARY KEY,
  kind         text        NOT NULL CHECK (kind IN ('customer', 'admin')),
  customer_id  uuid        REFERENCES customers (id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  CHECK ((kind = 'customer') = (customer_id IS NOT NULL))
);
CREATE INDEX sessions_by_expiry ON sessions (expires_at);

-- Every login code sent, so one number or one visitor cannot ask for codes again and again (it costs an SMS each).
CREATE TABLE otp_requests (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  phone       text        NOT NULL,
  ip          text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_requests_by_phone ON otp_requests (phone, created_at);
CREATE INDEX otp_requests_by_ip ON otp_requests (ip, created_at);

-- Test mode only (OTP_TEST_MODE=true): the code we made, hashed. With Twilio, Twilio keeps the codes instead.
CREATE TABLE test_codes (
  phone       text        PRIMARY KEY,
  code_hash   text        NOT NULL,
  attempts    integer     NOT NULL DEFAULT 0,
  expires_at  timestamptz NOT NULL
);

-- ---------- orders ----------
-- One row per order. The delivery details are copied in as typed at checkout, so the order stays the same even if the
-- customer later edits their address book. customer_id is empty for a guest order (placed without logging in).
CREATE TABLE orders (
  ref                text        PRIMARY KEY CHECK (ref ~ '^TL-[0-9]{6}-[2-9A-HJ-NP-Z]{8}$'),   -- TL-261126-7K3QXM2A
  customer_id        uuid        REFERENCES customers (id) ON DELETE SET NULL,
  status             text        NOT NULL DEFAULT 'awaiting_payment'
                                 CHECK (status IN ('awaiting_payment', 'verifying', 'paid', 'rejected')),
  delivery_step      text        CHECK (delivery_step IN ('packed', 'shipped', 'out_for_delivery', 'delivered')),
  ship_name          text        NOT NULL,
  ship_phone         text        NOT NULL,
  ship_email         text        NOT NULL,
  ship_address       text        NOT NULL,
  ship_city          text        NOT NULL,
  ship_state         text        NOT NULL,
  ship_pincode       text        NOT NULL,
  subtotal           integer     NOT NULL CHECK (subtotal >= 0),
  shipping           integer     NOT NULL CHECK (shipping >= 0),
  total              integer     NOT NULL CHECK (total = subtotal + shipping),
  currency           text        NOT NULL DEFAULT 'INR',
  upi_id             text,                    -- TranzLife's own UPI ID, when its QR code was offered
  razorpay_order_id  text        UNIQUE,      -- order_…, when the order can be paid through Razorpay
  utr                text,                    -- UPI reference the customer sent (own-QR payments)
  utr_submitted_at   timestamptz,
  rejected_reason    text,                    -- shown to the customer when their UTR was not found
  reviewed_at        timestamptz,
  paid_at            timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_by_customer ON orders (customer_id, created_at DESC);
CREATE INDEX orders_by_status ON orders (status, created_at DESC);
-- a UTR can pay for only one order (among orders being checked or paid)
CREATE UNIQUE INDEX orders_one_order_per_utr ON orders (utr) WHERE status IN ('verifying', 'paid');

-- The products in an order, with the price they were sold at.
CREATE TABLE order_items (
  order_ref   text    NOT NULL REFERENCES orders (ref) ON DELETE CASCADE,
  product_id  text    NOT NULL,
  name        text    NOT NULL,
  price       integer NOT NULL CHECK (price >= 0),
  qty         integer NOT NULL CHECK (qty BETWEEN 1 AND 99),
  PRIMARY KEY (order_ref, product_id)
);

-- Payments Razorpay reported for an order. The first one paid it; any later one means the customer paid twice and
-- should get a refund.
CREATE TABLE payments (
  id          text        PRIMARY KEY,                -- Razorpay payment ID, pay_…
  order_ref   text        NOT NULL REFERENCES orders (ref) ON DELETE CASCADE,
  method      text        NOT NULL,                   -- upi, card, …
  vpa         text,                                   -- the payer's UPI ID
  rrn         text,                                   -- the bank's UPI reference (UTR)
  amount      integer     NOT NULL,                   -- paise, as Razorpay reports it
  source      text        NOT NULL CHECK (source IN ('checkout', 'webhook', 'check')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_by_order ON payments (order_ref, created_at);

-- Everything that happened to an order, in order: placed, utr_submitted, utr_confirmed, utr_rejected, paid, packed,
-- shipped, out_for_delivery, delivered. Customers see it as the tracking timeline; the admin page shows the UTR history.
CREATE TABLE order_events (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_ref   text        NOT NULL REFERENCES orders (ref) ON DELETE CASCADE,
  type        text        NOT NULL,
  detail      jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_events_by_order ON order_events (order_ref, id);
