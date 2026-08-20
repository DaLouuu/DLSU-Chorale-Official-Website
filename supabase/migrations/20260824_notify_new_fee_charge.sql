-- Emails a member the moment ANY fee_records row is inserted for them — auto
-- charges from attendance_logs (20260824_auto_charge_attendance_fees.sql) and
-- manual charges from the admin's Charge Fee modal both land here, so this is
-- the single place that guarantees "any new fee gets emailed", not just
-- announced in-app.
--
-- Calls Resend directly (not through the send-email Edge Function) since this
-- runs inside the database, same pattern as the weekly-digest/event-reminders
-- Edge Functions but one layer lower — needs its own Vault secrets:
--   - resend_api_key : same Resend API key already used by send-email /
--                      weekly-digest / event-reminders (Edge Function secrets
--                      and Vault are separate stores, so it has to be added
--                      to Vault too, under this exact name).
--   - email_from     : optional. The same "from" address configured as
--                      EMAIL_FROM for the Edge Functions, e.g.
--                      "DLSU Chorale <noreply@yourdomain.com>". Falls back to
--                      onboarding@resend.dev if not set.
-- Add both in Dashboard -> Settings -> Integrations -> Vault -> New secret.

CREATE OR REPLACE FUNCTION notify_new_fee_charge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email      text;
  v_name       text;
  v_resend_key text;
  v_from       text;
  v_html       text;
BEGIN
  IF NEW.account_id_fk IS NULL THEN RETURN NEW; END IF;

  SELECT email, trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
    INTO v_email, v_name
    FROM profiles WHERE id = NEW.account_id_fk;

  IF v_email IS NULL OR v_email = '' THEN RETURN NEW; END IF;

  SELECT decrypted_secret INTO v_resend_key FROM vault.decrypted_secrets WHERE name = 'resend_api_key' LIMIT 1;
  IF v_resend_key IS NULL THEN RETURN NEW; END IF; -- secret not set yet — skip rather than error

  SELECT decrypted_secret INTO v_from FROM vault.decrypted_secrets WHERE name = 'email_from' LIMIT 1;
  v_from := coalesce(v_from, 'onboarding@resend.dev');

  v_html := '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f7f8f6;font-family:system-ui,sans-serif">'
    || '<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 2px 12px rgba(0,0,0,0.06)">'
    || '<div style="background:#09331f;padding:22px 32px"><p style="margin:0;color:#1e7f76;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:600">DLSU Chorale</p></div>'
    || '<div style="padding:32px 32px 24px">'
    || '<h2 style="margin:0 0 4px;font-size:21px;color:#111827;font-weight:600">A fee was charged to your account</h2>'
    || '<p style="margin:0 0 20px;font-size:13px;color:#6b7280">Hello ' || coalesce(nullif(v_name, ''), 'Chorister') || '</p>'
    || '<table style="width:100%;border-collapse:collapse;background:#f7f8f6;border-radius:8px;overflow:hidden;margin-bottom:20px">'
    || '<tr><td style="padding:8px 12px;font-size:13px;color:#6b7280;white-space:nowrap">Fee type</td><td style="padding:8px 12px;font-size:13px;color:#111827;font-weight:500">' || NEW.type || '</td></tr>'
    || '<tr><td style="padding:8px 12px;font-size:13px;color:#6b7280;white-space:nowrap">Amount</td><td style="padding:8px 12px;font-size:13px;color:#111827;font-weight:500">₱' || NEW.amount::text || '</td></tr>'
    || '<tr><td style="padding:8px 12px;font-size:13px;color:#6b7280;white-space:nowrap">Date</td><td style="padding:8px 12px;font-size:13px;color:#111827;font-weight:500">' || to_char(NEW.fee_date, 'FMMonth FMDD, YYYY') || '</td></tr>'
    || coalesce('<tr><td style="padding:8px 12px;font-size:13px;color:#6b7280;white-space:nowrap">Reference</td><td style="padding:8px 12px;font-size:13px;color:#111827;font-weight:500">' || NEW.reference || '</td></tr>', '')
    || '</table>'
    || '<p style="font-size:13px;color:#6b7280">Log in to the member portal to view your full balance and submit payment.</p>'
    || '</div>'
    || '<div style="padding:14px 32px;background:#f7f8f6;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">De La Salle University Chorale · Member Portal</div>'
    || '</div></body></html>';

  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_resend_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', v_from,
      'to', jsonb_build_array(v_email),
      'subject', 'New fee charged: ' || NEW.type,
      'html', v_html
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_fee_charge ON fee_records;
CREATE TRIGGER trg_notify_new_fee_charge
  AFTER INSERT ON fee_records
  FOR EACH ROW EXECUTE FUNCTION notify_new_fee_charge();
