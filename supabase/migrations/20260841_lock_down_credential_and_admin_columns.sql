-- CRITICAL: profiles has had blanket UPDATE/INSERT policies
-- (USING(true)/WITH CHECK(true)) since 20260826_allow_member_creation.sql,
-- which means every credential system built this session — member
-- password, admin console password, HR incident password+OTP, account
-- setup OTP, admin session tokens — could be bypassed entirely with a
-- single direct client write, e.g.
--   supabase.from('profiles').update({ is_admin: true }).eq('school_id', X)
-- grants full admin access with zero verification (the anon key is public,
-- visible in any deployed frontend bundle), and the same trick works
-- against password_hash / admin_password_hash / security_answer_hash_* to
-- hijack any existing account. Every RPC this session built (set_member_
-- password, set_admin_password, issue_admin_session_token, etc.) only
-- matters if those columns can't ALSO be written directly — until now they
-- could, making the RPCs advisory rather than enforced.
--
-- Column-level REVOKE closes this without touching anything else: it blocks
-- these specific columns from anon/authenticated writes at the database
-- layer, while every SECURITY DEFINER RPC keeps working unchanged (they run
-- as their owner, not the caller, so a REVOKE against anon/authenticated
-- doesn't apply to them).

REVOKE UPDATE (
  password_hash, admin_password_hash, is_admin,
  security_question_1, security_answer_hash_1,
  security_question_2, security_answer_hash_2,
  failed_password_attempts, locked_until,
  admin_failed_attempts, admin_locked_until,
  admin_session_token_hash, admin_session_token_expires_at,
  setup_otp_code_hash, setup_otp_expires_at, setup_otp_attempts
) ON profiles FROM anon, authenticated;

-- New member rows are now always inserted with is_admin defaulting to
-- false — AdminMembers.tsx elevates a member to admin afterward through
-- admin_set_is_admin below instead of setting the column directly at INSERT.
REVOKE INSERT (is_admin) ON profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION admin_set_is_admin(p_admin_token text, p_school_id bigint, p_value boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ok boolean;
BEGIN
  SELECT verify_admin_session_token(p_admin_token) INTO v_ok;
  IF NOT v_ok THEN RAISE EXCEPTION 'Invalid or expired admin session — please sign in to the admin console again.'; END IF;
  UPDATE profiles SET is_admin = p_value WHERE school_id = p_school_id;
END;
$$;

-- ── fee_records: a member could otherwise mark their own fee "paid" or
-- tamper with paid_at/rejection_reason directly. Approving/rejecting a
-- payment now requires the same admin session token used for payment-proof
-- signed URLs (20260839_admin_session_token.sql) — members keep the ability
-- to submit their own payment info (status -> 'pending' is still open),
-- just never 'paid' directly.
REVOKE UPDATE (paid_at, rejection_reason) ON fee_records FROM anon, authenticated;

DROP POLICY IF EXISTS fee_records_update_all ON fee_records;
CREATE POLICY fee_records_update_all ON fee_records
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (status <> 'paid');

CREATE OR REPLACE FUNCTION admin_approve_payment(p_admin_token text, p_fee_id bigint, p_paid_at date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ok boolean;
BEGIN
  SELECT verify_admin_session_token(p_admin_token) INTO v_ok;
  IF NOT v_ok THEN RAISE EXCEPTION 'Invalid or expired admin session — please sign in to the admin console again.'; END IF;
  UPDATE fee_records SET status = 'paid', paid_at = p_paid_at WHERE id = p_fee_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_reject_payment(p_admin_token text, p_fee_id bigint, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ok boolean;
BEGIN
  SELECT verify_admin_session_token(p_admin_token) INTO v_ok;
  IF NOT v_ok THEN RAISE EXCEPTION 'Invalid or expired admin session — please sign in to the admin console again.'; END IF;
  UPDATE fee_records SET status = 'unpaid', rejection_reason = p_reason WHERE id = p_fee_id;
END;
$$;

-- ── excuse_requests: a member could otherwise self-approve/decline their
-- own pending request directly. Members keep editing their own request's
-- content (date/type/reason/etc, MemberExcuses.tsx's edit-while-pending
-- flow) — only the decision fields are locked to the admin RPC.
REVOKE UPDATE (status, approved_by, admin_response) ON excuse_requests FROM anon, authenticated;

CREATE OR REPLACE FUNCTION admin_decide_excuse(
  p_admin_token text, p_request_id bigint, p_status text, p_admin_response text, p_approved_by text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ok boolean;
BEGIN
  SELECT verify_admin_session_token(p_admin_token) INTO v_ok;
  IF NOT v_ok THEN RAISE EXCEPTION 'Invalid or expired admin session — please sign in to the admin console again.'; END IF;
  UPDATE excuse_requests
  SET status = p_status, admin_response = p_admin_response, approved_by = p_approved_by
  WHERE request_id = p_request_id;
END;
$$;
