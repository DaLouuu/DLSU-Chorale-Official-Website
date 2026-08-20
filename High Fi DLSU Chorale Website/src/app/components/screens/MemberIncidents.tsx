import { useState, useEffect } from 'react';
import { useRouter, useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusPill } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { Field } from '../ui/Field';
import { supabase } from '../../supabase';
import { notifyIncidentSubmitted, notifyIncidentNewReport } from '../../utils/email';

// incident_reports has no client-readable SELECT policy at all (see
// 20260832_lock_down_incident_reports.sql) — "My Reports" goes through
// this Edge Function instead, which reads with the service role key.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const MEMBER_REPORTS_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/member-incident-reports` : undefined;

type Evidence = { label: string; url: string };

type MyReport = {
  id: number;
  status: string;
  verdict: string | null;
  created_at: string;
  person_complained: string;
  what_happened: string;
  comments: { id: number; body: string; created_at: string }[];
};

function labelStyle(theme: any) {
  return { fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase' as const };
}

function textareaStyle(theme: any) {
  return {
    width: '100%', marginTop: 6, padding: 12, border: `1px solid ${theme.lineDark}`,
    borderRadius: 10, fontSize: 14, fontFamily: FONTS.sans, resize: 'vertical' as const,
    outline: 'none', boxSizing: 'border-box' as const, background: theme.paper, color: theme.ink,
  };
}

export function MemberIncidents() {
  const { user } = useRouter();
  const { theme } = useTheme();
  const app = useApp();
  const [tab, setTab] = useState<'new' | 'mine'>('new');

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [witnessName, setWitnessName] = useState(user?.name ?? '');
  const [schoolIdInput, setSchoolIdInput] = useState(String(user?.id ?? ''));
  const [batchYear, setBatchYear] = useState('');
  const [positionRole, setPositionRole] = useState('');
  const [personComplained, setPersonComplained] = useState('');
  const [incidentWhen, setIncidentWhen] = useState('');
  const [incidentWhere, setIncidentWhere] = useState('');
  const [peopleInvolved, setPeopleInvolved] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [impact, setImpact] = useState('');
  const [feelsSafe, setFeelsSafe] = useState<'yes' | 'no' | ''>('');
  const [safetyExplanation, setSafetyExplanation] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [evidenceLabel, setEvidenceLabel] = useState('');
  const [evidenceLinkUrl, setEvidenceLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [myReports, setMyReports] = useState<MyReport[]>([]);
  const [loadingMine, setLoadingMine] = useState(true);

  const todayIso = new Date().toISOString().slice(0, 10);
  const profileUuid: string | null = (user as any)?._uuid ?? (user as any)?.profileUuid ?? null;

  async function loadMine() {
    if (!profileUuid || !MEMBER_REPORTS_URL) { setLoadingMine(false); return; }
    setLoadingMine(true);
    try {
      const res = await fetch(MEMBER_REPORTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(SUPABASE_ANON_KEY ? { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY } : {}),
        },
        body: JSON.stringify({ account_id_fk: profileUuid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      const reports = data.reports ?? [];
      const comments = data.comments ?? [];
      setMyReports(reports.map((r: any) => ({
        ...r,
        comments: comments.filter((c: any) => c.report_id === r.id),
      })));
    } catch (e: any) {
      app.showToast(`Could not load your reports: ${e.message}`, 'error');
      setMyReports([]);
    }
    setLoadingMine(false);
  }

  useEffect(() => { if (tab === 'mine') loadMine(); }, [tab]);

  const resetForm = () => {
    setIsAnonymous(false);
    setWitnessName(user?.name ?? '');
    setSchoolIdInput(String(user?.id ?? ''));
    setBatchYear('');
    setPositionRole('');
    setPersonComplained('');
    setIncidentWhen('');
    setIncidentWhere('');
    setPeopleInvolved('');
    setWhatHappened('');
    setImpact('');
    setFeelsSafe('');
    setSafetyExplanation('');
    setAdditionalNotes('');
    setEvidence([]);
    setEvidenceLabel('');
    setConsentChecked(false);
    setSignature('');
  };

  const handleAddEvidence = async (file: File) => {
    setUploading(true);
    try {
      const path = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { data: uploadData, error } = await supabase.storage.from('incident-evidence').upload(path, file);
      if (error) throw error;
      const url = supabase.storage.from('incident-evidence').getPublicUrl(uploadData.path).data.publicUrl;
      setEvidence(prev => [...prev, { label: evidenceLabel.trim() || file.name, url }]);
      setEvidenceLabel('');
    } catch (err: any) {
      app.showToast(`Could not upload file: ${err?.message ?? 'unknown error'}`, 'error');
    }
    setUploading(false);
  };

  const handleAddEvidenceLink = () => {
    const url = evidenceLinkUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      app.showToast('Evidence links must start with http:// or https://', 'error');
      return;
    }
    setEvidence(prev => [...prev, { label: evidenceLabel.trim() || url, url }]);
    setEvidenceLabel('');
    setEvidenceLinkUrl('');
  };

  const missingFields = (): string[] => {
    const missing: string[] = [];
    if (!isAnonymous && !witnessName.trim()) missing.push('your name (or check "Submit anonymously")');
    if (!personComplained.trim()) missing.push('the person being complained about');
    if (whatHappened.trim().length < 10) missing.push('a fuller description of what happened (at least 10 characters)');
    if (!consentChecked) missing.push('the consent checkbox');
    if (!signature.trim()) missing.push('your signature over printed name');
    return missing;
  };

  const submit = async () => {
    const missing = missingFields();
    if (missing.length > 0) {
      app.showToast(`Please fill in: ${missing.join(', ')}.`, 'error');
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from('incident_reports').insert({
      account_id_fk: profileUuid,
      reporter_email: user?.email ?? null,
      is_anonymous: isAnonymous,
      witness_name: isAnonymous ? null : witnessName.trim(),
      school_id: schoolIdInput.trim() ? Number(schoolIdInput.trim()) : null,
      batch_year: batchYear.trim() || null,
      position_role: positionRole.trim() || null,
      person_complained: personComplained.trim(),
      incident_when: incidentWhen.trim() || null,
      incident_where: incidentWhere.trim() || null,
      people_involved: peopleInvolved.trim() || null,
      what_happened: whatHappened.trim(),
      impact: impact.trim() || null,
      feels_safe: feelsSafe === '' ? null : feelsSafe === 'yes',
      safety_explanation: feelsSafe === 'no' ? safetyExplanation.trim() || null : null,
      additional_notes: additionalNotes.trim() || null,
      evidence,
      consent_signature: signature.trim(),
      consent_date: todayIso,
    });

    setSubmitting(false);
    if (error) {
      app.showToast(`Could not submit report: ${error.message}`, 'error');
      return;
    }

    if (user?.email) notifyIncidentSubmitted({ email: user.email, name: witnessName.trim() || 'Chorister' });
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL as string) ?? '';
    if (adminEmail) notifyIncidentNewReport({ adminEmail });

    app.showToast('Report submitted confidentially. You will be notified of any updates.');
    setSubmitted(true);
    resetForm();
    setTimeout(() => { setSubmitted(false); setTab('mine'); }, 1200);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      <PageHeader
        eyebrow="Member Portal"
        title="Report a Concern"
        subtitle="File a confidential testimony for an incident, issue, or concern. Only HR can access submitted reports."
      />

      <div style={{ display: 'flex', gap: 0, marginBottom: 22, borderBottom: `1px solid ${theme.line}`, overflowX: 'auto' }}>
        {[{ k: 'new', l: 'New Report' }, { k: 'mine', l: `My Reports (${myReports.length})` }].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as any)}
            style={{
              padding: isMobile ? '11px 16px' : '12px 22px', background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: FONTS.sans, fontSize: 13.5, fontWeight: tab === t.k ? 500 : 400,
              color: tab === t.k ? theme.ink : theme.dim,
              borderBottom: `2px solid ${tab === t.k ? theme.green : 'transparent'}`, marginBottom: -1,
            }}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'new' && (
        <Card pad={28}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 4 }}>
            Testimony Form for Incident Report
          </div>
          <p style={{ fontSize: 12.5, color: theme.dim, marginBottom: 20 }}>
            Everything you submit here is reviewed only by HR, through a password-locked area of the admin console.
          </p>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, padding: 14, background: theme.cream, borderRadius: 8, cursor: 'pointer', marginBottom: 18 }}>
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
            <div>
              <div style={{ fontWeight: 500 }}>Submit anonymously</div>
              <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>HR will see "Anonymous" instead of your name. You'll still receive status emails.</div>
            </div>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 18 }}>
            {!isAnonymous && (
              <Field label="Name of Witness / Member / Alumnus" value={witnessName} onChange={e => setWitnessName(e.target.value)} />
            )}
            <Field label="ID Number (if student)" value={schoolIdInput} onChange={e => setSchoolIdInput(e.target.value)} />
            <Field label="Batch / Year Graduated (if alumnus)" value={batchYear} onChange={e => setBatchYear(e.target.value)} />
            <Field label="Position / Role in the Organization" value={positionRole} onChange={e => setPositionRole(e.target.value)} placeholder="if applicable" />
            <Field label="Person being Complained *" value={personComplained} onChange={e => setPersonComplained(e.target.value)} />
            <Field label="Date of Testimony Submission" value={todayIso} readOnly />
          </div>

          <div style={{ height: 1, background: theme.line, margin: '4px 0 20px' }} />
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 14 }}>
            Details of the Incident
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle(theme)}>1. When did the incident occur?</label>
              <div style={{ fontSize: 11.5, color: theme.dim, marginTop: 2, marginBottom: 4 }}>Date and time, or approximate if exact is unknown.</div>
              <input value={incidentWhen} onChange={e => setIncidentWhen(e.target.value)} style={{ ...textareaStyle(theme), resize: 'none' }} />
            </div>
            <div>
              <label style={labelStyle(theme)}>2. Where did the incident occur?</label>
              <div style={{ fontSize: 11.5, color: theme.dim, marginTop: 2, marginBottom: 4 }}>Location, e.g. rehearsal hall, online, external setting.</div>
              <input value={incidentWhere} onChange={e => setIncidentWhere(e.target.value)} style={{ ...textareaStyle(theme), resize: 'none' }} />
            </div>
            <div>
              <label style={labelStyle(theme)}>3. Who was involved in the incident?</label>
              <div style={{ fontSize: 11.5, color: theme.dim, marginTop: 2, marginBottom: 4 }}>Please include names and roles, if known.</div>
              <input value={peopleInvolved} onChange={e => setPeopleInvolved(e.target.value)} style={{ ...textareaStyle(theme), resize: 'none' }} />
            </div>
            <div>
              <label style={labelStyle(theme)}>4. What happened? *</label>
              <div style={{ fontSize: 11.5, color: theme.dim, marginTop: 2, marginBottom: 4 }}>
                Describe in detail what you personally witnessed or experienced. Include direct quotes if possible. Stick to facts — avoid opinions or hearsay.
              </div>
              <textarea value={whatHappened} onChange={e => setWhatHappened(e.target.value)} rows={6} style={textareaStyle(theme)} />
            </div>
            <div>
              <label style={labelStyle(theme)}>5. How did the incident affect you or others?</label>
              <div style={{ fontSize: 11.5, color: theme.dim, marginTop: 2, marginBottom: 4 }}>Emotional, psychological, academic, or organizational impact.</div>
              <textarea value={impact} onChange={e => setImpact(e.target.value)} rows={4} style={textareaStyle(theme)} />
            </div>

            <div style={{ padding: 14, background: theme.cream, borderRadius: 8, fontSize: 12.5, color: theme.dim, lineHeight: 1.6 }}>
              Criticisms are important, but overly done fault-finding that is unhealthy and does not promote growth in any form would stunt the development of the group.
            </div>

            <div>
              <label style={labelStyle(theme)}>6. Do you feel safe at present?</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {(['yes', 'no'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setFeelsSafe(v)}
                    style={{
                      padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: FONTS.sans,
                      border: `1px solid ${feelsSafe === v ? theme.green : theme.lineDark}`,
                      background: feelsSafe === v ? theme.green : theme.paper,
                      color: feelsSafe === v ? '#fff' : theme.ink,
                    }}
                  >
                    {v === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
              {feelsSafe === 'no' && (
                <textarea
                  value={safetyExplanation}
                  onChange={e => setSafetyExplanation(e.target.value)}
                  rows={3}
                  placeholder="Please explain…"
                  style={{ ...textareaStyle(theme), marginTop: 10 }}
                />
              )}
            </div>

            <div>
              <label style={labelStyle(theme)}>7. Additional Notes / Context (if any)</label>
              <textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} rows={3} style={textareaStyle(theme)} />
            </div>

            <div>
              <label style={labelStyle(theme)}>8. Photo / Screenshot Evidence</label>
              <div style={{ fontSize: 11.5, color: theme.dim, marginTop: 2, marginBottom: 8 }}>
                Attach supporting files, or paste a link (Google Drive, Facebook post, etc.). Label them clearly — e.g. "Photo A – Event Venue", "Screenshot B – Conversation Extract".
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <input
                  value={evidenceLabel}
                  onChange={e => setEvidenceLabel(e.target.value)}
                  placeholder="Label, e.g. Screenshot B – Conversation Extract"
                  style={{ flex: 1, minWidth: 220, padding: '10px 12px', border: `1px solid ${theme.lineDark}`, borderRadius: 8, fontSize: 13, fontFamily: FONTS.sans, background: theme.paper, color: theme.ink, outline: 'none' }}
                />
                <label style={{
                  padding: '10px 16px', borderRadius: 8, border: `1px dashed ${theme.lineDark}`, cursor: 'pointer',
                  fontSize: 13, color: theme.ink, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Icon name="camera" size={14} />
                  {uploading ? 'Uploading…' : 'Choose file'}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    disabled={uploading}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleAddEvidence(f); e.target.value = ''; }}
                  />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <input
                  value={evidenceLinkUrl}
                  onChange={e => setEvidenceLinkUrl(e.target.value)}
                  placeholder="…or paste a link — https://drive.google.com/…"
                  style={{ flex: 1, minWidth: 220, padding: '10px 12px', border: `1px solid ${theme.lineDark}`, borderRadius: 8, fontSize: 13, fontFamily: FONTS.sans, background: theme.paper, color: theme.ink, outline: 'none' }}
                />
                <Button variant="outline" onClick={handleAddEvidenceLink} disabled={!evidenceLinkUrl.trim()}>
                  Add link
                </Button>
              </div>
              {evidence.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {evidence.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: theme.cream, borderRadius: 8, fontSize: 12.5 }}>
                      <Icon name="file" size={14} stroke={theme.green} />
                      <span style={{ flex: 1 }}>{ev.label}</span>
                      <button onClick={() => setEvidence(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.dim }}>
                        <Icon name="x" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: theme.line, margin: '24px 0 20px' }} />
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 14 }}>
            Consent for Documentation
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
            <input type="checkbox" checked={consentChecked} onChange={e => setConsentChecked(e.target.checked)} style={{ marginTop: 2 }} />
            <span style={{ color: theme.ink, lineHeight: 1.5 }}>
              I confirm that the information I have provided is true to the best of my knowledge. I understand that my testimony may be included
              in a confidential incident report submitted to the Executive Board and/or CAO, and that my privacy will be respected.
            </span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <Field label="Signature over Printed Name *" value={signature} onChange={e => setSignature(e.target.value)} placeholder="Type your full name to sign" />
            <Field label="Date" value={todayIso} readOnly />
          </div>

          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
            <Button icon="check" onClick={submit} disabled={submitted || submitting}>
              {submitted ? 'Submitted ✓' : submitting ? 'Submitting…' : 'Submit report'}
            </Button>
          </div>
        </Card>
      )}

      {tab === 'mine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loadingMine ? (
            <Card pad={40} style={{ textAlign: 'center', color: theme.dim }}>Loading…</Card>
          ) : myReports.length === 0 ? (
            <Card pad={40} style={{ textAlign: 'center', color: theme.dim }}>You haven't filed any reports yet.</Card>
          ) : myReports.map(r => (
            <Card key={r.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Report regarding: {r.person_complained}</div>
                  <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>Filed {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
                <StatusPill status={r.status} />
              </div>
              {r.verdict && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: theme.greenSoft, borderRadius: 8, fontSize: 13 }}>
                  <strong>Verdict:</strong> {r.verdict}
                </div>
              )}
              {r.comments.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {r.comments.map(c => (
                    <div key={c.id} style={{ padding: '8px 12px', background: theme.cream, borderLeft: `3px solid ${theme.green}`, borderRadius: 4, fontSize: 12.5 }}>
                      <div style={{ color: theme.dim, fontSize: 11, marginBottom: 2 }}>{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      {c.body}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
