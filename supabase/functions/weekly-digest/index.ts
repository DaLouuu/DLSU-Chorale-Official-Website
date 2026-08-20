// Supabase Edge Function — sends the weekly attendance digest email.
//
// Unlike send-email (invoked by the client on demand), this is meant to run
// on a recurring schedule via pg_cron + pg_net — see
// supabase/migrations/20260822_schedule_weekly_digest.sql. It has no client
// entry point at all; the client only ever sets profiles.weekly_digest_opt_in
// (in MemberProfile.tsx), and this function reads that column to decide who
// to email.
//
// Deploy: same as send-email — create/update the function in the Supabase
// Dashboard (Edge Functions), or `supabase functions deploy weekly-digest`.
// Uses the same RESEND_API_KEY / EMAIL_FROM secrets already set for send-email
// (Edge Function secrets are shared project-wide, not per-function).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'onboarding@resend.dev';

const G = '#09331f';
const GOLD = '#c9a84c';

function wrap(body: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f7f8f6;font-family:system-ui,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
  <div style="background:${G};padding:22px 32px">
    <p style="margin:0;color:${GOLD};font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:600">DLSU Chorale</p>
  </div>
  <div style="padding:32px 32px 24px">${body}</div>
  <div style="padding:14px 32px;background:#f7f8f6;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">
    De La Salle University Chorale · Member Portal · Manage this in your profile's Notifications settings
  </div>
</div></body></html>`;
}

function statBox(label: string, value: number, color: string) {
  return `<td style="padding:14px;text-align:center;background:#f7f8f6;border-radius:8px">
    <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#6b7280;margin-bottom:4px">${label}</div>
    <div style="font-size:28px;font-weight:600;color:${color}">${value}</div>
  </td>`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: members, error: membersErr } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .eq('weekly_digest_opt_in', true);

  if (membersErr) {
    return new Response(JSON.stringify({ error: membersErr.message }), { status: 500 });
  }
  if (!members || members.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No members opted in.' }), { status: 200 });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const until = new Date().toISOString();
  const rangeLabel = `${since.slice(0, 10)} to ${until.slice(0, 10)}`;

  let sent = 0;
  const errors: string[] = [];

  for (const member of members) {
    if (!member.email) continue;

    const { data: logs } = await supabase
      .from('attendance_logs')
      .select('log_status')
      .eq('account_id_fk', member.id)
      .gte('created_at', since)
      .lte('created_at', until);

    const rows = logs ?? [];
    const present = rows.filter(r => (r.log_status ?? '').toLowerCase() === 'present').length;
    const late = rows.filter(r => (r.log_status ?? '').toLowerCase() === 'late').length;
    const absent = rows.filter(r => (r.log_status ?? '').toLowerCase() === 'absent').length;
    const excused = rows.filter(r => (r.log_status ?? '').toLowerCase() === 'excused').length;

    if (rows.length === 0) continue; // nothing to report — skip rather than send an empty digest

    const name = [member.first_name, member.last_name].filter(Boolean).join(' ') || 'Chorister';
    const html = wrap(
      `<h2 style="margin:0 0 4px;font-size:21px;color:#111827;font-weight:600">📊 Your Weekly Attendance Digest</h2>
       <p style="margin:0 0 20px;font-size:13px;color:#6b7280">${rangeLabel} · Hello ${name}</p>
       <table style="width:100%;border-collapse:separate;border-spacing:8px 0;margin-bottom:20px"><tr>
         ${statBox('Present', present, '#16a34a')}
         ${statBox('Late', late, '#d97706')}
         ${statBox('Absent', absent, '#dc2626')}
         ${statBox('Excused', excused, '#2563eb')}
       </tr></table>
       <p style="font-size:13px;color:#6b7280">Log in to the member portal for your full attendance record and any outstanding fees.</p>`
    );

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: EMAIL_FROM, to: [member.email], subject: '📊 Your Weekly Attendance Digest', html }),
      });
      if (res.ok) sent++;
      else errors.push(`${member.email}: ${res.status} ${await res.text().catch(() => '')}`);
    } catch (e) {
      errors.push(`${member.email}: ${String(e)}`);
    }
  }

  return new Response(JSON.stringify({ sent, totalOptedIn: members.length, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
