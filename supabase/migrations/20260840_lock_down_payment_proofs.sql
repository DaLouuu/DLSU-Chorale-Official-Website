-- payment-proofs held members' financial proof-of-payment images on a
-- public bucket with an open read policy — anyone with the anon key, or
-- just a leaked/guessed URL, could view someone else's payment proof.
-- Now that there's a real server-verified admin session (see
-- 20260839_admin_session_token.sql, issued right after verify_admin_password
-- succeeds), reads can go through a signed URL gated by that token instead.
UPDATE storage.buckets SET public = false WHERE id = 'payment-proofs';

DROP POLICY IF EXISTS payment_proofs_select ON storage.objects;
-- Insert policy is untouched — members still need to upload their own
-- proof directly from the fee submission form.
