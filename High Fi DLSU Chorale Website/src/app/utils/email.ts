// Email notification utility — calls Resend API
// NOTE: Calling Resend from the browser exposes VITE_RESEND_API_KEY in the client bundle.
// For production, move this behind a Supabase Edge Function or server route.

const API_KEY = import.meta.env.VITE_RESEND_API_KEY as string | undefined;
const FROM = import.meta.env.VITE_EMAIL_FROM as string | undefined
  ?? 'onboarding@resend.dev';

const G = '#09331f';
const GOLD = '#c9a84c';

async function send(to: string, subject: string, html: string) {
  if (!API_KEY || !to) return;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    if (!res.ok) console.warn('[Email] Resend responded', res.status, await res.text().catch(() => ''));
  } catch (e) {
    // CORS or network — acceptable failure in browser prototype
    console.warn('[Email] Could not reach Resend:', e);
  }
}

function wrap(body: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f7f8f6;font-family:system-ui,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
  <div style="background:${G};padding:22px 32px">
    <p style="margin:0;color:${GOLD};font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:600">DLSU Chorale</p>
  </div>
  <div style="padding:32px 32px 24px">${body}</div>
  <div style="padding:14px 32px;background:#f7f8f6;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">
    De La Salle University Chorale · Member Portal · Do not reply to this email
  </div>
</div></body></html>`;
}

function h2(text: string) {
  return `<h2 style="margin:0 0 6px;font-size:21px;color:#111827;font-weight:600">${text}</h2>`;
}
function muted(text: string) {
  return `<p style="margin:0 0 22px;font-size:14px;color:#6b7280">${text}</p>`;
}
function table(rows: [string, string][]) {
  const cells = rows.map(([k, v]) =>
    `<tr><td style="padding:8px 12px;font-size:13px;color:#6b7280;white-space:nowrap">${k}</td>
         <td style="padding:8px 12px;font-size:13px;color:#111827;font-weight:500">${v}</td></tr>`
  ).join('');
  return `<table style="width:100%;border-collapse:collapse;background:#f7f8f6;border-radius:8px;overflow:hidden;margin-bottom:20px">${cells}</table>`;
}
function badge(text: string, color: string) {
  return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;background:${color}20;color:${color}">${text}</span>`;
}
function cta(text: string) {
  return `<a style="display:inline-block;margin-top:20px;padding:10px 22px;background:${G};color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500">${text}</a>`;
}

// ── Notification types ────────────────────────────────────────────────────────

export function notifyExcuseDecision(opts: {
  email: string;
  name: string;
  excuseType: string;
  date: string;
  status: 'Approved' | 'Declined';
  notes?: string;
}) {
  const approved = opts.status === 'Approved';
  const icon = approved ? '✅' : '❌';
  const statusColor = approved ? '#16a34a' : '#dc2626';
  const html = wrap(
    h2(`${icon} Your Excuse Request was ${opts.status}`) +
    muted(`Hello ${opts.name}, here's the update on your recent excuse request.`) +
    table([
      ['Type', opts.excuseType],
      ['Date', opts.date],
      ['Status', badge(opts.status, statusColor)],
      ...(opts.notes ? [['Notes', opts.notes] as [string, string]] : []),
    ]) +
    `<p style="font-size:13px;color:#6b7280">Log in to the member portal to view your full attendance record.</p>`
  );
  return send(opts.email, `${icon} Excuse Request ${opts.status}`, html);
}

export function notifyExcuseFiled(opts: {
  adminEmail: string;
  memberName: string;
  section: string;
  excuseType: string;
  date: string;
  reason: string;
}) {
  const html = wrap(
    h2('📋 New Excuse Request Filed') +
    muted('A member has submitted a new excuse request that needs your review.') +
    table([
      ['Member', `${opts.memberName} · ${opts.section}`],
      ['Type', opts.excuseType],
      ['Date', opts.date],
      ['Reason', opts.reason.slice(0, 120) + (opts.reason.length > 120 ? '…' : '')],
    ]) +
    cta('Review in Admin Console')
  );
  return send(opts.adminEmail, `New Excuse — ${opts.memberName}`, html);
}

export function notifyEventSignup(opts: {
  adminEmail: string;
  memberName: string;
  section: string;
  eventName: string;
  eventDate: string;
  withdrew?: boolean;
}) {
  const action = opts.withdrew ? 'withdrew from' : 'signed up for';
  const icon = opts.withdrew ? '↩️' : '🎶';
  const html = wrap(
    h2(`${icon} Member ${opts.withdrew ? 'Withdrew' : 'Signed Up'}`) +
    muted(`${opts.memberName} has ${action} an upcoming event.`) +
    table([
      ['Member', `${opts.memberName} · ${opts.section}`],
      ['Event', opts.eventName],
      ['Date', opts.eventDate],
      ['Action', badge(opts.withdrew ? 'Withdrew' : 'Signed up', opts.withdrew ? '#d97706' : '#16a34a')],
    ]) +
    cta('View Event Roster')
  );
  return send(opts.adminEmail, `${icon} ${opts.memberName} ${opts.withdrew ? 'withdrew from' : 'signed up for'} ${opts.eventName}`, html);
}

export function notifyRehearsalReminder(opts: {
  email: string;
  name: string;
  venue: string;
  time: string;
  date: string;
}) {
  const html = wrap(
    h2('⏰ Rehearsal Starts in 1 Hour') +
    muted(`Hello ${opts.name}, don't forget — rehearsal is coming up soon!`) +
    `<div style="background:${G};border-radius:10px;padding:20px 24px;color:#fff;margin-bottom:20px">
       <p style="margin:0 0 4px;font-size:24px;font-weight:700">${opts.time}</p>
       <p style="margin:0;font-size:14px;opacity:0.75">${opts.date} · ${opts.venue}</p>
     </div>
     <p style="font-size:13px;color:#6b7280">Please be on time. If you can no longer attend, file an excuse request in the member portal as soon as possible.</p>`
  );
  return send(opts.email, '⏰ Rehearsal in 1 hour — ' + opts.date, html);
}
