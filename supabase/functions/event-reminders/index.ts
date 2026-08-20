// Supabase Edge Function — emails members who haven't signed up yet for an
// upcoming event, when that event has a reminder configured.
//
// Runs on a daily schedule via pg_cron + pg_net — see
// supabase/migrations/20260823_schedule_event_reminders.sql. Reuses the same
// Vault `service_role_key` secret already set up for weekly-digest, so no new
// manual Vault step is needed.
//
// The client only ever sets events.reminder_enabled / reminder_days_before
// (AdminEvents.tsx); this function reads those columns to decide what to
// send, and stamps reminder_sent_at so each event is only reminded once per
// configuration (AdminEvents.tsx clears reminder_sent_at again if the admin
// re-enables the reminder or changes the lead time).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'onboarding@resend.dev';

const G = '#09331f';
const TEAL = '#1e7f76';

function wrap(body: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f7f8f6;font-family:system-ui,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
  <div style="background:${G};padding:22px 32px">
    <p style="margin:0;color:${TEAL};font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:600">DLSU Chorale</p>
  </div>
  <div style="padding:32px 32px 24px">${body}</div>
  <div style="padding:14px 32px;background:#f7f8f6;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">
    De La Salle University Chorale · Member Portal
  </div>
</div></body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: events, error: eventsErr } = await supabase
    .from('events')
    .select('event_id, name, notes, event_date, venue, call_time, start_time, reminder_days_before')
    .eq('reminder_enabled', true)
    .is('reminder_sent_at', null)
    .gte('event_date', todayStr);

  if (eventsErr) {
    return new Response(JSON.stringify({ error: eventsErr.message }), { status: 500 });
  }
  if (!events || events.length === 0) {
    return new Response(JSON.stringify({ processed: 0, message: 'No events due for a reminder.' }), { status: 200 });
  }

  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('school_id, email, first_name, last_name');
  if (profilesErr) {
    return new Response(JSON.stringify({ error: profilesErr.message }), { status: 500 });
  }

  let processed = 0;
  let totalSent = 0;
  const errors: string[] = [];

  for (const ev of events) {
    const daysBefore = ev.reminder_days_before ?? 3;
    const daysUntil = Math.round(
      (new Date(ev.event_date + 'T00:00:00Z').getTime() - new Date(todayStr + 'T00:00:00Z').getTime()) / 86400000
    );
    if (daysUntil > daysBefore || daysUntil < 0) continue; // not due yet

    const { data: signups } = await supabase
      .from('event_signups')
      .select('member_id')
      .eq('event_id', ev.event_id);
    const signedUpIds = new Set((signups ?? []).map((s: { member_id: number }) => s.member_id));

    const notRegistered = (profiles ?? []).filter(
      (p: { school_id: number; email: string | null }) => p.email && !signedUpIds.has(p.school_id)
    );

    const name = ev.name ?? ev.notes ?? 'an upcoming event';
    const callTime = (ev.call_time ?? ev.start_time ?? '').replace(/\+.*$/, '').slice(0, 5);
    const dateLabel = new Date(ev.event_date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });

    for (const member of notRegistered) {
      const memberName = [member.first_name, member.last_name].filter(Boolean).join(' ') || 'Chorister';
      const html = wrap(
        `<h2 style="margin:0 0 4px;font-size:21px;color:#111827;font-weight:600">⏰ Sign-up Reminder: ${name}</h2>
         <p style="margin:0 0 16px;font-size:13px;color:#6b7280">Hello ${memberName}, you haven't signed up yet.</p>
         <table style="width:100%;font-size:13px;color:#111827;margin-bottom:16px">
           <tr><td style="padding:4px 0;color:#6b7280;width:110px">Date</td><td style="padding:4px 0">${dateLabel}</td></tr>
           ${ev.venue ? `<tr><td style="padding:4px 0;color:#6b7280">Venue</td><td style="padding:4px 0">${ev.venue}</td></tr>` : ''}
           ${callTime ? `<tr><td style="padding:4px 0;color:#6b7280">Call time</td><td style="padding:4px 0">${callTime}</td></tr>` : ''}
         </table>
         <p style="font-size:13px;color:#6b7280">Log in to the member portal to sign up before slots close.</p>`
      );

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: EMAIL_FROM, to: [member.email], subject: `⏰ Sign-up reminder: ${name}`, html }),
        });
        if (res.ok) totalSent++;
        else errors.push(`${member.email}: ${res.status} ${await res.text().catch(() => '')}`);
      } catch (e) {
        errors.push(`${member.email}: ${String(e)}`);
      }
    }

    await supabase.from('events').update({ reminder_sent_at: new Date().toISOString() }).eq('event_id', ev.event_id);
    processed++;
  }

  return new Response(JSON.stringify({ processed, totalSent, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
