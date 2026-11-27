-- Version 2: customers can also log in with their email address (a 6-digit code by email).
-- A customer now has a mobile number, a login email, or both; at least one of them.

ALTER TABLE customers ALTER COLUMN phone DROP NOT NULL;

-- the email address the customer proved they own by typing the code we emailed (lower case). It is separate from
-- customers.email, the contact email anyone can type into their profile, so typing someone else's address there can
-- never give access to their account.
ALTER TABLE customers ADD COLUMN login_email text UNIQUE CHECK (login_email = lower(login_email));
ALTER TABLE customers ADD CONSTRAINT customers_have_a_login CHECK (phone IS NOT NULL OR login_email IS NOT NULL);

-- codes and their limits are now for a mobile number or an email address: the "target" the code went to
ALTER TABLE otp_requests RENAME COLUMN phone TO target;
ALTER INDEX otp_requests_by_phone RENAME TO otp_requests_by_target;
ALTER TABLE test_codes RENAME COLUMN phone TO target;
