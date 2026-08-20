import { useState, useEffect } from 'react';
import { useRouter, useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Chip, StatusPill } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { supabase } from '../../supabase';
import { notifyHrIncidentOtp, notifyIncidentUpdate } from '../../utils/email';

// incident_reports has no client-readable RLS policy at all (see
// 20260832_lock_down_incident_reports.sql) — every read/write goes through
// this Edge Function, which only proceeds once it verifies the session
// token issued right after a successful password + OTP unlock.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const HR_API_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/hr-incident-reports` : undefined;

async function callHrApi(token: string, action: string, payload?: any) {
  if (!HR_API_URL) throw new Error('Supabase URL is not configured.');
  const res = await fetch(HR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(SUPABASE_ANON_KEY ? { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY } : {}),
    },
    body: JSON.stringify({ token, action, payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

// incident-evidence is a private bucket now (20260838_lock_down_incident_evidence.sql)
// — a stored evidence URL only still resolves to a storage object path, not
// a working link, so it needs turning into a fresh signed URL through the
// same HR-gated Edge Function. Evidence can also just be a plain link a
// member pasted in instead of uploading a file (see MemberIncidents.tsx) —
// those aren't in our bucket at all and should open exactly as typed.
const EVIDENCE_PREFIX = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/incident-evidence/` : undefined;

function evidenceStoragePath(url: string): string | null {
  if (!EVIDENCE_PREFIX || !url.startsWith(EVIDENCE_PREFIX)) return null;
  return url.slice(EVIDENCE_PREFIX.length);
}

const STATUSES = [
  'Pending', 'DM Review', 'HR Investigation', 'CM/ACM Investigation',
  'Conductor Investigation', 'CAO Investigation', 'Resolved',
];

const SECURITY_QUESTION_OPTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the name of your first school?",
  "What is your favorite book?",
];

type Report = {
  id: number;
  is_anonymous: boolean;
  witness_name: string | null;
  school_id: number | null;
  batch_year: string | null;
  position_role: string | null;
  person_complained: string;
  incident_when: string | null;
  incident_where: string | null;
  people_involved: string | null;
  what_happened: string;
  impact: string | null;
  feels_safe: boolean | null;
  safety_explanation: string | null;
  additional_notes: string | null;
  evidence: { label: string; url: string }[];
  consent_signature: string;
  consent_date: string;
  reporter_email: string | null;
  status: string;
  verdict: string | null;
  created_at: string;
};

type Comment = { id: number; report_id: number; author_name: string; body: string; is_feedback: boolean; created_at: string };

function inputStyle(theme: any) {
  return {
    width: '100%', padding: '11px 14px', border: `1px solid ${theme.lineDark}`,
    borderRadius: 10, fontSize: 14, fontFamily: FONTS.sans, background: theme.paper,
    color: theme.ink, outline: 'none', boxSizing: 'border-box' as const,
  };
}

// ── Lock screen ──────────────────────────────────────────────────────────────

function LockScreen({ onUnlocked }: { onUnlocked: (token: string) => void }) {
  const { theme } = useTheme();
  const { user } = useRouter();
  const app = useApp();

  type Stage = 'loading' | 'setup-password' | 'setup-security' | 'enter-password' | 'enter-otp' | 'forgot-password';
  const [stage, setStage] = useState<Stage>('loading');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [q1, setQ1] = useState(SECURITY_QUESTION_OPTIONS[0]);
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState(SECURITY_QUESTION_OPTIONS[1]);
  const [a2, setA2] = useState('');
  const [otp, setOtp] = useState('');
  const [questions, setQuestions] = useState<{ question_1: string; question_2: string } | null>(null);
  const [forgotAnswer1, setForgotAnswer1] = useState('');
  const [forgotAnswer2, setForgotAnswer2] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showSetupPw, setShowSetupPw] = useState(false);
  const [showSetupConfirmPw, setShowSetupConfirmPw] = useState(false);
  const [showEnterPw, setShowEnterPw] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);

  const showHideBtn = (show: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: theme.dim, fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 0.5, padding: 4,
      }}
    >
      {show ? 'HIDE' : 'SHOW'}
    </button>
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('hr_incident_password_is_set');
      setStage(data ? 'enter-password' : 'setup-password');
    })();
  }, []);

  const sendOtp = async () => {
    setBusy(true);
    const { data: code, error: err } = await supabase.rpc('request_hr_incident_otp');
    setBusy(false);
    if (err || !code) { setError('Could not generate a code. Try again.'); return; }
    // TODO: route to the actual HR head's email once that's modeled — for
    // now this goes to whichever admin is currently logged in, per explicit
    // instruction while that role doesn't exist yet.
    if (user?.email) notifyHrIncidentOtp({ email: user.email, code });
    setStage('enter-otp');
    setError('');
  };

  const handleSetupPassword = async () => {
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);
    const { error: err } = await supabase.rpc('set_hr_incident_password', { p_password: password });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setError('');
    setStage('setup-security');
  };

  const handleSetupSecurity = async () => {
    if (!a1.trim() || !a2.trim()) { setError('Answer both security questions.'); return; }
    if (q1 === q2) { setError('Choose two different questions.'); return; }
    setBusy(true);
    const { error: err } = await supabase.rpc('set_hr_incident_security_questions', {
      p_question_1: q1, p_answer_1: a1, p_question_2: q2, p_answer_2: a2,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setError('');
    await sendOtp();
  };

  const handleEnterPassword = async () => {
    setBusy(true);
    const { data, error: err } = await supabase.rpc('verify_hr_incident_password', { p_password: password });
    setBusy(false);
    // A lockout (too many failed attempts) comes back as an RPC error with a
    // specific message; anything else is a generic failure to verify.
    if (err) { setError(err.message?.includes('Too many failed attempts') ? err.message : 'Could not verify password. Try again.'); return; }
    if (!data) { setError('Incorrect password.'); return; }
    setError('');
    await sendOtp();
  };

  const handleEnterOtp = async () => {
    setBusy(true);
    const { data, error: err } = await supabase.rpc('verify_hr_incident_otp', { p_code: otp.trim() });
    if (err || !data) {
      setBusy(false);
      setError('Incorrect or expired code.');
      return;
    }
    const { data: sessionToken, error: tokenErr } = await supabase.rpc('issue_hr_session_token');
    setBusy(false);
    if (tokenErr || !sessionToken) { setError('Could not start a session. Try again.'); return; }
    onUnlocked(sessionToken);
  };

  const openForgotPassword = async () => {
    setError('');
    const { data } = await supabase.rpc('get_hr_incident_security_questions');
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.question_1) { setError('No security questions have been set yet — contact another admin.'); return; }
    setQuestions(row);
    setStage('forgot-password');
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    setBusy(true);
    const { data, error: err } = await supabase.rpc('reset_hr_incident_password', {
      p_answer_1: forgotAnswer1, p_answer_2: forgotAnswer2, p_new_password: newPassword,
    });
    setBusy(false);
    if (err || !data) { setError('Answers did not match our records.'); return; }
    app.showToast('Password reset — log in with your new password.');
    setPassword('');
    setError('');
    setStage('enter-password');
  };

  const shell = (title: string, subtitle: string, children: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
      <Card pad={32} style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Icon name="shield" size={20} stroke={theme.green} />
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>HR Access</div>
        </div>
        <h2 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '4px 0 6px', fontWeight: 500 }}>{title}</h2>
        <p style={{ fontSize: 13, color: theme.dim, marginBottom: 20 }}>{subtitle}</p>
        {children}
        {error && <div style={{ marginTop: 14, fontSize: 12.5, color: theme.red }}>{error}</div>}
      </Card>
    </div>
  );

  if (stage === 'loading') return null;

  if (stage === 'setup-password') {
    return shell('Set up HR access', 'First time opening Incident Reports — set a password only you (HR) will know.', (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <input
            type={showSetupPw ? 'text' : 'password'} placeholder="New password" value={password}
            onChange={e => setPassword(e.target.value)} style={{ ...inputStyle(theme), paddingRight: 56 }}
          />
          {showHideBtn(showSetupPw, () => setShowSetupPw(s => !s))}
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type={showSetupConfirmPw ? 'text' : 'password'} placeholder="Confirm password" value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)} style={{ ...inputStyle(theme), paddingRight: 56 }}
          />
          {showHideBtn(showSetupConfirmPw, () => setShowSetupConfirmPw(s => !s))}
        </div>
        <Button onClick={handleSetupPassword} disabled={busy}>{busy ? 'Saving…' : 'Continue'}</Button>
      </div>
    ));
  }

  if (stage === 'setup-security') {
    return shell('Set security questions', "You'll use these to reset your password if you forget it.", (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <select value={q1} onChange={e => setQ1(e.target.value)} style={inputStyle(theme)}>
          {SECURITY_QUESTION_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
        </select>
        <input placeholder="Answer" value={a1} onChange={e => setA1(e.target.value)} style={inputStyle(theme)} />
        <select value={q2} onChange={e => setQ2(e.target.value)} style={inputStyle(theme)}>
          {SECURITY_QUESTION_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
        </select>
        <input placeholder="Answer" value={a2} onChange={e => setA2(e.target.value)} style={inputStyle(theme)} />
        <Button onClick={handleSetupSecurity} disabled={busy}>{busy ? 'Saving…' : 'Continue'}</Button>
      </div>
    ));
  }

  if (stage === 'enter-password') {
    return shell('Enter HR password', 'Access to Incident Reports is restricted. A code will be emailed to confirm it’s you.', (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <input
            type={showEnterPw ? 'text' : 'password'} placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEnterPassword()}
            style={{ ...inputStyle(theme), paddingRight: 56 }}
          />
          {showHideBtn(showEnterPw, () => setShowEnterPw(s => !s))}
        </div>
        <Button onClick={handleEnterPassword} disabled={busy}>{busy ? 'Checking…' : 'Continue'}</Button>
        <button onClick={openForgotPassword} style={{ background: 'transparent', border: 'none', color: theme.green, fontSize: 12.5, cursor: 'pointer', padding: 0, textAlign: 'left' }}>
          Forgot password?
        </button>
      </div>
    ));
  }

  if (stage === 'enter-otp') {
    return shell('Enter the code', `A 6-digit code was emailed to ${user?.email ?? 'your inbox'}. It expires in 10 minutes.`, (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="000000" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6}
          onKeyDown={e => e.key === 'Enter' && handleEnterOtp()}
          style={{ ...inputStyle(theme), textAlign: 'center', fontSize: 22, fontFamily: FONTS.mono, letterSpacing: 6 }}
        />
        <Button onClick={handleEnterOtp} disabled={busy || otp.trim().length !== 6}>{busy ? 'Verifying…' : 'Unlock'}</Button>
        <button onClick={sendOtp} disabled={busy} style={{ background: 'transparent', border: 'none', color: theme.green, fontSize: 12.5, cursor: 'pointer', padding: 0, textAlign: 'left' }}>
          Resend code
        </button>
      </div>
    ));
  }

  // forgot-password
  return shell('Reset HR password', 'Answer both security questions to set a new password.', (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 12.5, color: theme.ink, marginBottom: 6 }}>{questions?.question_1}</div>
        <input value={forgotAnswer1} onChange={e => setForgotAnswer1(e.target.value)} style={inputStyle(theme)} />
      </div>
      <div>
        <div style={{ fontSize: 12.5, color: theme.ink, marginBottom: 6 }}>{questions?.question_2}</div>
        <input value={forgotAnswer2} onChange={e => setForgotAnswer2(e.target.value)} style={inputStyle(theme)} />
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type={showResetPw ? 'text' : 'password'} placeholder="New password" value={newPassword}
          onChange={e => setNewPassword(e.target.value)} style={{ ...inputStyle(theme), paddingRight: 56 }}
        />
        {showHideBtn(showResetPw, () => setShowResetPw(s => !s))}
      </div>
      <Button onClick={handleResetPassword} disabled={busy}>{busy ? 'Resetting…' : 'Reset password'}</Button>
      <button onClick={() => { setStage('enter-password'); setError(''); }} style={{ background: 'transparent', border: 'none', color: theme.dim, fontSize: 12.5, cursor: 'pointer', padding: 0, textAlign: 'left' }}>
        Back
      </button>
    </div>
  ));
}

// ── Report detail ────────────────────────────────────────────────────────────

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  const { theme } = useTheme();
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1.2, color: theme.dim, textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: theme.ink, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{value}</div>
    </div>
  );
}

function ReportDetail({
  report, token, initialComments, onClose, onUpdated,
}: { report: Report; token: string; initialComments: Comment[]; onClose: () => void; onUpdated: () => void }) {
  const { theme } = useTheme();
  const { user } = useRouter();
  const app = useApp();
  const [status, setStatus] = useState(report.status);
  const [verdict, setVerdict] = useState(report.verdict ?? '');
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isFeedback, setIsFeedback] = useState(true);
  const [saving, setSaving] = useState(false);

  const notifyReporter = async (message: string) => {
    if (!report.reporter_email) return;
    const name = report.is_anonymous ? 'Chorister' : (report.witness_name || 'Chorister');
    await notifyIncidentUpdate({ email: report.reporter_email, name, message, status });
  };

  const handleSaveStatus = async () => {
    setSaving(true);
    try {
      await callHrApi(token, 'update_status', { report_id: report.id, status });
    } catch (e: any) {
      setSaving(false);
      app.showToast(`Could not update status: ${e.message}`, 'error');
      return;
    }
    setSaving(false);
    app.showToast('Status updated');
    await notifyReporter(`Your report's status has been updated to: ${status}.`);
    onUpdated();
  };

  const handleSaveVerdict = async () => {
    setSaving(true);
    try {
      await callHrApi(token, 'update_verdict', { report_id: report.id, verdict: verdict.trim() });
    } catch (e: any) {
      setSaving(false);
      app.showToast(`Could not save verdict: ${e.message}`, 'error');
      return;
    }
    setSaving(false);
    app.showToast('Verdict saved');
    if (verdict.trim()) await notifyReporter(`A verdict has been reached on your report:\n\n${verdict.trim()}`);
    onUpdated();
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSaving(true);
    let data: any;
    try {
      const res = await callHrApi(token, 'add_comment', {
        report_id: report.id, author_name: user?.name ?? 'HR', comment_body: newComment.trim(), is_feedback: isFeedback,
      });
      data = res.comment;
    } catch (e: any) {
      setSaving(false);
      app.showToast(`Could not add comment: ${e.message}`, 'error');
      return;
    }
    setSaving(false);
    setComments(prev => [...prev, data as Comment]);
    if (isFeedback) await notifyReporter(newComment.trim());
    setNewComment('');
    app.showToast(isFeedback ? 'Feedback sent to reporter' : 'Internal note added');
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.paper, color: theme.ink, borderRadius: 14, width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${theme.line}` }}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Incident Report #{report.id}</div>
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '6px 0 0', fontWeight: 500 }}>Regarding: {report.person_complained}</h3>
            <div style={{ marginTop: 8 }}><StatusPill status={report.status} /></div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', color: theme.dim, padding: 4 }}>×</button>
        </div>

        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <DetailField label="Witness" value={report.is_anonymous ? <Chip tone="neutral">Anonymous</Chip> : report.witness_name} />
            <DetailField label="ID Number" value={report.is_anonymous ? null : report.school_id} />
            <DetailField label="Batch / Year Graduated" value={report.is_anonymous ? null : report.batch_year} />
            <DetailField label="Position / Role" value={report.is_anonymous ? null : report.position_role} />
            <DetailField label="Date Submitted" value={new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
            <DetailField label="Signature" value={report.consent_signature} />
          </div>

          <div style={{ height: 1, background: theme.line }} />

          <DetailField label="When did the incident occur?" value={report.incident_when} />
          <DetailField label="Where did the incident occur?" value={report.incident_where} />
          <DetailField label="Who was involved?" value={report.people_involved} />
          <DetailField label="What happened?" value={report.what_happened} />
          <DetailField label="Impact" value={report.impact} />
          <DetailField
            label="Feels safe at present?"
            value={report.feels_safe == null ? null : (report.feels_safe ? 'Yes' : `No — ${report.safety_explanation ?? 'no explanation given'}`)}
          />
          <DetailField label="Additional notes" value={report.additional_notes} />

          {report.evidence?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1.2, color: theme.dim, textTransform: 'uppercase', marginBottom: 8 }}>Evidence</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {report.evidence.map((ev, i) => {
                  const path = evidenceStoragePath(ev.url);
                  if (!path) {
                    // A plain link the member pasted in, not an uploaded file.
                    return (
                      <a key={i} href={ev.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: theme.green, textDecoration: 'none' }}>
                        <Icon name="file" size={14} stroke={theme.green} /> {ev.label}
                      </a>
                    );
                  }
                  return (
                    <button
                      key={i}
                      onClick={async () => {
                        try {
                          const { signedUrl } = await callHrApi(token, 'get_evidence_url', { path });
                          window.open(signedUrl, '_blank', 'noreferrer');
                        } catch (e: any) {
                          app.showToast(`Could not open evidence: ${e.message}`, 'error');
                        }
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: theme.green, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: FONTS.sans }}
                    >
                      <Icon name="file" size={14} stroke={theme.green} /> {ev.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ height: 1, background: theme.line }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
            <div>
              <div style={{ fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1.2, color: theme.dim, textTransform: 'uppercase', marginBottom: 6 }}>Status</div>
              <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle(theme)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Button onClick={handleSaveStatus} disabled={saving || status === report.status}>Save status</Button>
          </div>

          <div>
            <div style={{ fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1.2, color: theme.dim, textTransform: 'uppercase', marginBottom: 6 }}>Verdict</div>
            <textarea value={verdict} onChange={e => setVerdict(e.target.value)} rows={3} style={{ ...inputStyle(theme), resize: 'vertical' }} placeholder="Final decision / outcome…" />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="sm" onClick={handleSaveVerdict} disabled={saving || verdict === (report.verdict ?? '')}>Save verdict</Button>
            </div>
          </div>

          <div style={{ height: 1, background: theme.line }} />

          <div>
            <div style={{ fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1.2, color: theme.dim, textTransform: 'uppercase', marginBottom: 10 }}>Comments</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {comments.length === 0 && <div style={{ fontSize: 12.5, color: theme.dim }}>No comments yet.</div>}
              {comments.map(c => (
                <div key={c.id} style={{ padding: '10px 12px', borderRadius: 8, background: c.is_feedback ? theme.greenSoft : theme.cream, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong>{c.author_name}</strong>
                    <span style={{ color: theme.dim, fontSize: 11 }}>
                      {c.is_feedback ? 'Sent to reporter' : 'Internal note'} · {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {c.body}
                </div>
              ))}
            </div>
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} rows={3} placeholder="Add a comment, feedback, or request for more information…" style={{ ...inputStyle(theme), resize: 'vertical' }} />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={isFeedback} onChange={e => setIsFeedback(e.target.checked)} />
                Send as feedback to reporter (emails them)
              </label>
              <Button size="sm" onClick={handleAddComment} disabled={saving || !newComment.trim()}>Add comment</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const HR_SESSION_STORAGE_KEY = 'hr_incident_session_token';

export function AdminIncidents() {
  const { theme } = useTheme();
  const app = useApp();
  // Kept in sessionStorage (not just React state) so switching to another
  // admin tab and back doesn't force HR to re-enter the password + OTP —
  // it only clears on sign-out (see Shell.tsx) or when the token's own
  // 4-hour server-side expiry kicks in (verify_hr_session_token rejects it
  // and the catch block below drops back to the lock screen).
  const [sessionToken, setSessionTokenState] = useState<string | null>(() => {
    try { return sessionStorage.getItem(HR_SESSION_STORAGE_KEY); } catch { return null; }
  });
  const setSessionToken = (token: string | null) => {
    setSessionTokenState(token);
    try {
      if (token) sessionStorage.setItem(HR_SESSION_STORAGE_KEY, token);
      else sessionStorage.removeItem(HR_SESSION_STORAGE_KEY);
    } catch {}
  };
  const [reports, setReports] = useState<Report[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<Report | null>(null);

  async function load(token: string): Promise<Report[]> {
    setLoading(true);
    try {
      const { reports: rows, comments: allComments } = await callHrApi(token, 'list');
      setReports((rows ?? []) as Report[]);
      setComments((allComments ?? []) as Comment[]);
      setLoading(false);
      return (rows ?? []) as Report[];
    } catch (e: any) {
      setLoading(false);
      if (/session expired|invalid/i.test(e.message ?? '')) {
        // Stale/expired token from a previous visit — drop back to the lock
        // screen instead of leaving the tab stuck on a permanent error toast.
        setSessionToken(null);
        return [];
      }
      app.showToast(`Could not load reports: ${e.message}`, 'error');
      return [];
    }
  }

  useEffect(() => { if (sessionToken) load(sessionToken); }, [sessionToken]);

  if (!sessionToken) {
    return (
      <>
        <PageHeader eyebrow="Admin — HR" title="Incident Reports" subtitle="Password-protected. Only HR has access." />
        <LockScreen onUnlocked={(token) => setSessionToken(token)} />
      </>
    );
  }

  const filtered = filter === 'All' ? reports : reports.filter(r => r.status === filter);

  return (
    <>
      <PageHeader eyebrow="Admin — HR" title="Incident Reports" subtitle="Confidential testimonies filed by members. Visible only after unlocking with the HR password." />

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {['All', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12.5, fontFamily: FONTS.sans,
              border: `1px solid ${filter === s ? theme.green : theme.lineDark}`,
              background: filter === s ? theme.green : 'transparent',
              color: filter === s ? '#fff' : theme.ink,
            }}
          >
            {s} · {s === 'All' ? reports.length : reports.filter(r => r.status === s).length}
          </button>
        ))}
      </div>

      <Card pad={0}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: theme.dim }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: theme.dim }}>No reports match this filter.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
              <thead>
                <tr style={{ background: theme.cream, fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: theme.dim }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Filed</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Witness</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Regarding</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    style={{ borderTop: `1px solid ${theme.line}`, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = theme.cream)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: FONTS.mono, fontSize: 12, color: theme.dim }}>
                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{r.is_anonymous ? <Chip tone="neutral">Anonymous</Chip> : (r.witness_name || '—')}</td>
                    <td style={{ padding: '12px 16px' }}>{r.person_complained}</td>
                    <td style={{ padding: '12px 16px' }}><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && (
        <ReportDetail
          report={selected}
          token={sessionToken}
          initialComments={comments.filter(c => c.report_id === selected.id)}
          onClose={() => setSelected(null)}
          onUpdated={async () => {
            const fresh = await load(sessionToken);
            setSelected(prev => (prev ? fresh.find(r => r.id === prev.id) ?? null : null));
          }}
        />
      )}
    </>
  );
}
