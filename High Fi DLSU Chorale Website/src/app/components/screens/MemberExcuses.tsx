import { useState, useEffect } from 'react';
import { useRouter, useTheme, useApp } from '../../App';
import { notifyExcuseFiled } from '../../utils/email';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Chip, StatusPill } from '../ui/Chip';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { Field } from '../ui/Field';

export function MemberExcuses() {
  const { user } = useRouter();
  const { theme } = useTheme();
  const app = useApp();
  const mine = app.excuses.filter(e => e.memberId === user.id);
  const [tab, setTab] = useState('new');
  const [type, setType] = useState('Absent');
  const [date, setDate] = useState('2026-04-29');
  const [eventType, setEventType] = useState('Rehearsal');
  const [reason, setReason] = useState('');
  const [eta, setEta] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 768;

  const submit = () => {
    if (!reason.trim()) return;
    app.addExcuse({
      memberId: user.id,
      memberName: user.name,
      section: user.section,
      date,
      type: type === 'Excused Absent' ? 'Excused Absent' : type,
      reason,
      eventType,
      eta: eta || undefined,
    });
    app.showToast("Excuse submitted — your Section Head will review it.");
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL as string ?? '';
    if (adminEmail) notifyExcuseFiled({ adminEmail, memberName: user.name, section: user.section, excuseType: type, date, reason });
    setSubmitted(true);
    setReason('');
    setEta('');
    setTimeout(() => {
      setSubmitted(false);
      setTab('mine');
    }, 1200);
  };

  return (
    <>
      <PageHeader
        eyebrow="Module 3"
        title="Excuse Requests"
        subtitle="File excused absences, late arrivals, or stepping-out requests. Your Section Head decides within 24 hours."
      />

      <div style={{ display: 'flex', gap: 0, marginBottom: 22, borderBottom: `1px solid ${theme.line}`, overflowX: 'auto' }}>
        {[
          { k: 'new', l: 'New request' },
          { k: 'mine', l: `My requests (${mine.length})` },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{
              padding: isMobile ? '11px 16px' : '12px 22px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: FONTS.sans,
              fontSize: 13.5,
              fontWeight: tab === t.k ? 500 : 400,
              color: tab === t.k ? theme.greenDark : theme.dim,
              borderBottom: `2px solid ${tab === t.k ? theme.green : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'new' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 22 }}>
          <Card pad={28}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 18 }}>
              {['Absent', 'Excused Absent', 'Late', 'Stepping Out'].map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: type === t ? theme.greenSoft : '#fff',
                    border: `1.5px solid ${type === t ? theme.green : theme.line}`,
                    borderRadius: 10,
                    fontFamily: FONTS.sans,
                  }}
                >
                  <div style={{ fontFamily: FONTS.serif, fontSize: 17, fontWeight: 500, color: theme.ink }}>{t}</div>
                  <div style={{ fontSize: 11.5, color: theme.dim, marginTop: 3 }}>
                    {t === 'Absent' && "Can't attend — request no-fee status"}
                    {t === 'Excused Absent' && 'Academic / medical · needs documentation'}
                    {t === 'Late' && 'Arriving past call time'}
                    {t === 'Stepping Out' && 'Leaving mid-rehearsal temporarily'}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <Field label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
              <Field label="Event type" select options={['Rehearsal', 'Performance']} value={eventType} onChange={e => setEventType(e.target.value)} />
              {(type === 'Late' || type === 'Stepping Out') && <Field label="Estimated arrival / return" type="time" value={eta} onChange={e => setEta(e.target.value)} />}
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase' }}>Reason</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={4}
                placeholder="Be specific — your Section Head reads every request."
                style={{
                  width: '100%',
                  marginTop: 6,
                  padding: 12,
                  border: `1px solid ${theme.lineDark}`,
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: FONTS.sans,
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginTop: 18, padding: 14, background: theme.cream, border: `1px solid ${theme.line}`, borderRadius: 10, fontSize: 12.5, color: theme.dim, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Icon name="bell" size={14} stroke={theme.amber} />
              <div>
                <strong style={{ color: theme.ink }}>Please note:</strong> Late rehearsals incur a ₱50 fee, unexcused absences ₱150. Approved excuses carry no fee. Repeat excuses may be flagged.
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: isMobile ? 'stretch' : 'flex-end', flexWrap: 'wrap' }}>
              <Button variant="outline">Save draft</Button>
              <Button onClick={submit} icon="check" disabled={submitted}>
                {submitted ? 'Submitted ✓' : 'Submit excuse'}
              </Button>
            </div>
          </Card>

          <div>
            <Card variant="cream">
              <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Filing as</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                <Avatar member={user} size={44} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: theme.dim }}>
                    {user.section} · {user.year}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${theme.line}`, fontSize: 12.5, color: theme.dim, lineHeight: 1.6 }}>
                <div>
                  <strong style={{ color: theme.ink }}>Section Head:</strong> Miguel Santos
                </div>
                <div>
                  <strong style={{ color: theme.ink }}>Will route to:</strong> SectionHead → VP Internal
                </div>
                <div>
                  <strong style={{ color: theme.ink }}>Review SLA:</strong> Within 24 hours
                </div>
              </div>
            </Card>
            <Card style={{ marginTop: 16 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Quick templates</div>
              {['Thesis defense conflict', "Medical — doctor's appt.", 'Family obligation (provincial)', 'Org event overlap'].map(t => (
                <button
                  key={t}
                  onClick={() => setReason(t + ' — ')}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: `1px solid ${theme.line}`,
                    borderRadius: 8,
                    marginTop: 8,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    fontFamily: FONTS.sans,
                  }}
                >
                  {t}
                </button>
              ))}
            </Card>
          </div>
        </div>
      )}

      {tab === 'mine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mine.length === 0 && (
            <Card pad={40} style={{ textAlign: 'center', color: theme.dim }}>
              You haven't filed any excuse yet.
            </Card>
          )}
          {mine.map(e => (
            <Card key={e.id}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '90px 1fr 120px', gap: 18, alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: theme.dim, letterSpacing: 0.5 }}>
                    {new Date(e.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </div>
                  <div style={{ fontFamily: FONTS.serif, fontSize: 28, lineHeight: 1, fontWeight: 500 }}>{new Date(e.date).getDate()}</div>
                  <div style={{ fontSize: 10.5, color: theme.dim, fontFamily: FONTS.mono, marginTop: 2 }}>
                    {new Date(e.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 500 }}>{e.type}</span>
                    {e.eta && <Chip tone="neutral">ETA {e.eta}</Chip>}
                  </div>
                  <div style={{ fontSize: 13, color: theme.dim, lineHeight: 1.5 }}>{e.reason}</div>
                  {e.notes && (
                    <div style={{ marginTop: 10, padding: '8px 12px', background: theme.cream, borderLeft: `3px solid ${theme.green}`, borderRadius: 4, fontSize: 12.5 }}>
                      <strong>{e.approvedBy}:</strong> {e.notes}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                  <StatusPill status={e.status} />
                  <div style={{ fontSize: 10.5, color: theme.dim, marginTop: 6, fontFamily: FONTS.mono }}>Filed {e.submittedAt?.slice(0, 10)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
