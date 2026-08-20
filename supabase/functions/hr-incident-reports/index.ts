// Supabase Edge Function — the only path to incident_reports data for HR.
//
// incident_reports/incident_report_comments have no client-readable RLS
// policy at all (see 20260832_lock_down_incident_reports.sql) — this
// function uses the service role key to legitimately bypass that, but only
// after verifying the caller's token against verify_hr_session_token,
// which is only ever issued (issue_hr_session_token) right after a
// successful password + emailed-OTP unlock in AdminIncidents.tsx. Without
// this, anyone with the public anon key could otherwise read every
// confidential testimony directly via the REST API, skipping the HR
// password screen in the UI entirely.
//
// Deploy: supabase functions deploy hr-incident-reports
// No extra secrets needed — reuses SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY,
// which Supabase provides to every Edge Function automatically.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { token, action, payload } = body ?? {};
  if (!token || !action) return json({ error: 'Missing token or action' }, 400);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: validToken } = await supabase.rpc('verify_hr_session_token', { p_token: token });
  if (!validToken) return json({ error: 'Session expired or invalid — please unlock again.' }, 401);

  try {
    if (action === 'list') {
      const [{ data: reports, error: repErr }, { data: comments, error: comErr }] = await Promise.all([
        supabase.from('incident_reports').select('*').order('created_at', { ascending: false }),
        supabase.from('incident_report_comments').select('*').order('created_at', { ascending: true }),
      ]);
      if (repErr) return json({ error: repErr.message }, 500);
      if (comErr) return json({ error: comErr.message }, 500);
      return json({ reports, comments });
    }

    if (action === 'update_status') {
      const { report_id, status } = payload ?? {};
      if (!report_id || !status) return json({ error: 'Missing report_id or status' }, 400);
      const { error } = await supabase.from('incident_reports').update({ status }).eq('id', report_id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === 'update_verdict') {
      const { report_id, verdict } = payload ?? {};
      if (!report_id) return json({ error: 'Missing report_id' }, 400);
      const { error } = await supabase.from('incident_reports').update({ verdict: verdict || null }).eq('id', report_id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === 'add_comment') {
      const { report_id, author_name, comment_body, is_feedback } = payload ?? {};
      if (!report_id || !comment_body) return json({ error: 'Missing report_id or comment_body' }, 400);
      const { data, error } = await supabase
        .from('incident_report_comments')
        .insert({ report_id, author_name: author_name || 'HR', body: comment_body, is_feedback: !!is_feedback })
        .select('*')
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ comment: data });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
