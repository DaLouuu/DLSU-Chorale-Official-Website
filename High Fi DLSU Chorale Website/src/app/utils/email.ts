// Email notification utility — routes through the send-email Supabase Edge
// Function instead of calling Resend directly. Resend blocks cross-origin
// browser requests (no CORS), and the Resend key must stay server-side —
// see supabase/functions/send-email/index.ts for the proxy and deploy steps.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const SEND_EMAIL_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/send-email` : undefined;

const G = '#09331f';
const TEAL = '#1e7f76';

async function send(to: string, subject: string, html: string) {
  if (!SEND_EMAIL_URL || !to) return;
  try {
    const res = await fetch(SEND_EMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SUPABASE_ANON_KEY ? { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY } : {}),
      },
      body: JSON.stringify({ to, subject, html }),
    });
    if (!res.ok) console.warn('[Email] send-email function responded', res.status, await res.text().catch(() => ''));
  } catch (e) {
    console.warn('[Email] Could not reach send-email function:', e);
  }
}

function wrap(body: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f7f8f6;font-family:system-ui,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
  <div style="background:${G};padding:22px 32px">
    <p style="margin:0;color:${TEAL};font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:600">DLSU Chorale</p>
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
// This app has no server-side URL routing (a single-page app driven by
// in-memory state, not browser history) — every link goes to the site root.
// The existing "keep me logged in" session restore already lands the
// visitor on their correct admin/member dashboard automatically if a
// valid session exists; otherwise it falls through to the login screen.
// window.location.origin is safe here because this file only ever runs
// client-side, triggered from someone's own browser session.
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : '';

function cta(text: string) {
  return `<a href="${SITE_URL}" style="display:inline-block;margin-top:20px;padding:10px 22px;background:${G};color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500">${text}</a>`;
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

export function notifyAnnouncement(opts: {
  email: string;
  title: string;
  body: string;
  pinned: boolean;
  author: string;
}) {
  const html = wrap(
    (opts.pinned ? badge('Pinned', TEAL) + '<br/><br/>' : '') +
    h2(`📣 ${opts.title}`) +
    `<p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px">${opts.body}</p>
     <p style="font-size:12px;color:#9ca3af;margin:0">— ${opts.author}</p>` +
    cta('View in Member Portal')
  );
  return send(opts.email, `📣 ${opts.title}`, html);
}

export function notifyPaymentDecision(opts: {
  email: string;
  name: string;
  type: string;
  amount: number;
  status: 'Approved' | 'Rejected';
  reason?: string;
}) {
  const approved = opts.status === 'Approved';
  const icon = approved ? '✅' : '❌';
  const statusColor = approved ? '#16a34a' : '#dc2626';
  const html = wrap(
    h2(`${icon} Your Payment was ${approved ? 'Approved' : 'Rejected'}`) +
    muted(`Hello ${opts.name}, here's the update on your recent payment submission.`) +
    table([
      ['Fee', opts.type],
      ['Amount', `₱${opts.amount}`],
      ['Status', badge(opts.status, statusColor)],
      ...(opts.reason ? [['Reason', opts.reason] as [string, string]] : []),
    ]) +
    `<p style="font-size:13px;color:#6b7280">${approved ? 'This fee is now marked as paid on your account.' : 'This fee is still outstanding — please resubmit with a valid proof of payment.'}</p>`
  );
  return send(opts.email, `${icon} Payment ${opts.status} — ${opts.type}`, html);
}

export function notifyRoleSlotDecision(opts: {
  email: string;
  name: string;
  eventName: string;
  roleName: string;
  committee: string;
  status: 'Approved' | 'Rejected';
}) {
  const approved = opts.status === 'Approved';
  const icon = approved ? '✅' : '❌';
  const statusColor = approved ? '#16a34a' : '#dc2626';
  const html = wrap(
    h2(`${icon} Your Role Request was ${opts.status}`) +
    muted(`Hello ${opts.name}, here's the update on your cross-committee role request.`) +
    table([
      ['Event', opts.eventName],
      ['Role', opts.roleName],
      ['Committee', opts.committee],
      ['Status', badge(opts.status, statusColor)],
    ]) +
    `<p style="font-size:13px;color:#6b7280">Log in to the member portal to view this event's details.</p>`
  );
  return send(opts.email, `${icon} Role Request ${opts.status} — ${opts.eventName}`, html);
}

export function notifyScheduleChange(opts: {
  email: string;
  name: string;
  title: string;
  date: string;
  time?: string;
  venue?: string;
  action: 'Scheduled' | 'Updated' | 'Cancelled';
}) {
  const cancelled = opts.action === 'Cancelled';
  const icon = cancelled ? '🚫' : opts.action === 'Updated' ? '🔄' : '🗓️';
  const statusColor = cancelled ? '#dc2626' : '#16a34a';
  const html = wrap(
    h2(`${icon} ${opts.title} ${opts.action}`) +
    muted(`Hello ${opts.name}.`) +
    table([
      ['Date', opts.date],
      ...(opts.time ? [['Time', opts.time] as [string, string]] : []),
      ...(opts.venue ? [['Venue', opts.venue] as [string, string]] : []),
      ['Status', badge(opts.action, statusColor)],
    ]) +
    `<p style="font-size:13px;color:#6b7280">${cancelled ? 'This has been removed from the schedule.' : 'Log in to the member portal for full details.'}</p>`
  );
  return send(opts.email, `${icon} ${opts.title} ${opts.action.toLowerCase()}`, html);
}

export function notifyIncidentSubmitted(opts: { email: string; name: string }) {
  const html = wrap(
    h2('📝 Your Report Has Been Received') +
    muted(`Hello ${opts.name}, thank you for coming forward.`) +
    `<p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px">
       Your incident report has been submitted and will be reviewed confidentially by HR.
       You'll receive another email whenever there's an update or feedback on your report.
     </p>
     <p style="font-size:13px;color:#6b7280">If you feel unsafe right now, please reach out to a trusted officer directly rather than waiting for a response here.</p>`
  );
  return send(opts.email, '📝 Your incident report has been received', html);
}

export function notifyIncidentUpdate(opts: {
  email: string;
  name: string;
  message: string;
  status?: string;
}) {
  const html = wrap(
    h2('📋 Update on Your Incident Report') +
    muted(`Hello ${opts.name}, there's an update on the report you filed.`) +
    (opts.status ? table([['Status', badge(opts.status, TEAL)]]) : '') +
    `<p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px;white-space:pre-wrap">${opts.message}</p>
     <p style="font-size:13px;color:#6b7280">Log in to the member portal to view the full status of your report.</p>`
  );
  return send(opts.email, '📋 Update on your incident report', html);
}

export function notifyIncidentNewReport(opts: { adminEmail: string }) {
  const html = wrap(
    h2('🔔 New Incident Report Filed') +
    muted('A new incident report has been submitted and needs HR review.') +
    `<p style="font-size:13px;color:#6b7280">Open the Incident Reports tab in the admin console to review it. Details are only visible after unlocking with the HR password.</p>`
  );
  return send(opts.adminEmail, '🔔 New incident report filed', html);
}

export function notifyHrIncidentOtp(opts: { email: string; code: string }) {
  const html = wrap(
    h2('🔐 Incident Reports Access Code') +
    muted('Use this code to finish unlocking the Incident Reports tab. It expires in 10 minutes.') +
    `<div style="background:${G};border-radius:10px;padding:20px 24px;color:#fff;margin-bottom:20px;text-align:center">
       <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:8px">${opts.code}</p>
     </div>
     <p style="font-size:13px;color:#6b7280">If you did not request this, someone may be trying to access confidential incident reports — consider changing the HR password.</p>`
  );
  return send(opts.email, '🔐 Your Incident Reports access code', html);
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
