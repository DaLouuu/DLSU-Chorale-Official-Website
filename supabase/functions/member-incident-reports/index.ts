// Supabase Edge Function — lets a member read their own past incident
// reports now that incident_reports has no client-readable SELECT policy
// at all (see 20260832_lock_down_incident_reports.sql).
//
// Honest limitation: this app's custom auth has no per-request identity
// proof (no Supabase Auth JWT), so this endpoint necessarily trusts
// whatever account_id_fk the client sends — the same trust level
// MemberIncidents.tsx had before when it read the table directly. What
// this DOES fix is the worse case: a random person can no longer dump the
// entire incident_reports table (every member's confidential testimony)
// via the anon key — the most this endpoint can leak is one specific
// member's own reports, and only if you already know their profile id.
//
// Deploy: supabase functions deploy member-incident-reports

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

  const accountId = body?.account_id_fk;
  if (!accountId) return json({ error: 'Missing account_id_fk' }, 400);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: reports, error: repErr } = await supabase
    .from('incident_reports')
    .select('id, status, verdict, created_at, person_complained, what_happened')
    .eq('account_id_fk', accountId)
    .order('created_at', { ascending: false });

  if (repErr) return json({ error: repErr.message }, 500);
  if (!reports || reports.length === 0) return json({ reports: [], comments: [] });

  const ids = reports.map((r: any) => r.id);
  const { data: comments, error: comErr } = await supabase
    .from('incident_report_comments')
    .select('id, report_id, body, created_at')
    .in('report_id', ids)
    .eq('is_feedback', true)
    .order('created_at', { ascending: true });

  if (comErr) return json({ error: comErr.message }, 500);

  return json({ reports, comments: comments ?? [] });
});
