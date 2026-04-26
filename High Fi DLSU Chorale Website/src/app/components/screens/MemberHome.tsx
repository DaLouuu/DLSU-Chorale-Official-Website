import { useState, useEffect } from 'react';
import { useRouter, useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Chip, StatusPill } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { Calendar } from '../ui/Calendar';
import { ATTENDANCE_LOG, FEE_RECORDS, REHEARSALS } from '../../data';
import { notifyRehearsalReminder } from '../../utils/email';
import tet from '../../../imports/choir-tet.png';

declare global {
  interface Window {
    CLASS_SCHEDULES: any[];
  }
}

function StatCard({ label, value, trend, tone = 'neutral' }: any) {
  const { theme } = useTheme();
  const colors = { green: theme.green, amber: theme.amber, red: theme.red, blue: theme.blue, neutral: theme.ink };

  return (
    <Card>
      <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1.5, color: theme.dim, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: FONTS.serif, fontSize: 38, fontWeight: 500, margin: '6px 0 4px', color: colors[tone], lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: theme.dim }}>{trend}</div>
    </Card>
  );
}

export function MemberHome() {
  const { user, go } = useRouter();
  const { theme } = useTheme();
  const app = useApp();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('pref_notifications') || '{}');
      if (!prefs.rehearsalReminder || !user?.email) return;
      const now = new Date();
      const next = REHEARSALS.find(r => {
        const start = new Date(`${r.date}T${r.time}:00`);
        const mins = (start.getTime() - now.getTime()) / 60000;
        return mins > 0 && mins <= 60;
      });
      if (!next) return;
      const key = `rehearsal_reminder_sent_${next.id}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
      notifyRehearsalReminder({ email: user.email, name: user.name ?? '', venue: next.venue, time: next.time, date: next.date });
    } catch {}
  }, []);

  const myExcuses = app.excuses.filter(e => e.memberId === user.id);
  const pendingMine = myExcuses.filter(e => e.status === 'Pending').length;
  const upcoming = app.events.filter(e => new Date(e.date) > new Date('2026-04-24')).slice(0, 3);
  const outstanding = FEE_RECORDS.filter(f => f.status === 'unpaid').reduce((s, f) => s + f.amount, 0);
  const recent = ATTENDANCE_LOG.slice(0, 4);

  const userSchedule = window.CLASS_SCHEDULES?.find((s: any) => s.memberId === user.id);

  const checkConflict = (eventDate: string, eventTime: string) => {
    if (!userSchedule || !eventTime) return null;
    const dayOfWeek = new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long' });
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventMinutes = hours * 60 + minutes;
    for (const cls of userSchedule.classes) {
      if (cls.days.includes(dayOfWeek)) {
        const [startH, startM] = cls.startTime.split(':').map(Number);
        const [endH, endM] = cls.endTime.split(':').map(Number);
        if (eventMinutes >= startH * 60 + startM && eventMinutes <= endH * 60 + endM) return cls;
      }
    }
    return null;
  };

  const handleSignup = () => {
    if (selectedEvent) {
      app.signUpEvent(selectedEvent.id);
      app.showToast(`Signed up for ${selectedEvent.title}`);
      setSelectedEvent(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        title={
          <>
            Magandang umaga, <em style={{ fontStyle: 'italic', color: theme.green }}>{user.name.split(' ')[0]}</em>.
          </>
        }
        subtitle="Here's what's happening with the Chorale this week."
        actions={
          <>
            <Button variant="outline" icon="ticket" onClick={() => go('member-excuses' as any)}>
              File excuse
            </Button>
            <Button icon="music" onClick={() => go('member-performances' as any)}>
              Sign up for a performance
            </Button>
          </>
        }
      />

      {/* Hero banner */}
      <div
        style={{
          display: 'flex',
          gap: 18,
          marginBottom: 28,
          background: `linear-gradient(90deg, ${theme.greenDark} 0%, ${theme.greenDark} 48%, transparent 48%), url("${tet}") right center/cover`,
          borderRadius: 16,
          overflow: 'hidden',
          color: '#fff',
        }}
      >
        <div style={{ padding: '32px 36px', flex: '0 0 58%' }}>
          <Chip tone="dark">Next performance · in 16 days</Chip>
          <h2 style={{ fontFamily: FONTS.serif, fontSize: 34, fontWeight: 500, margin: '14px 0 6px', lineHeight: 1.1 }}>
            Baccalaureate & Commencement
            <br />
            <em style={{ color: theme.greenMid }}>— Term 3</em>
          </h2>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, opacity: 0.85, marginTop: 14, fontFamily: FONTS.mono }}>
            <span>MAY 10 · 07:30</span>
            <span>· Teresa Yuchengco Aud.</span>
          </div>
          <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
            <Button onClick={() => go('member-performances' as any)} style={{ background: '#fff', color: theme.greenDark, border: '1px solid #fff' }}>
              View details
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                app.signUpEvent('e1');
                app.showToast('Signed up for BCFC — Term 3');
              }}
              style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.4)', background: 'transparent' }}
            >
              Sign up
            </Button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Attendance rate" value="92%" trend="+4 vs last term" tone="green" />
        <StatCard label="Pending excuses" value={pendingMine} trend={pendingMine > 0 ? 'Awaiting review' : 'All clear'} tone={pendingMine > 0 ? 'amber' : 'green'} />
        <StatCard label="Outstanding fees" value={`₱${outstanding}`} trend={outstanding > 0 ? 'Due April 30' : 'Paid up'} tone={outstanding > 0 ? 'red' : 'green'} />
        <StatCard label="Performances signed" value={app.events.filter(e => e.mySignup).length} trend={`of ${app.events.length} upcoming`} tone="blue" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Recent attendance */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>This week</div>
              <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '4px 0 0', fontWeight: 500 }}>Recent attendance</h3>
            </div>
            <a onClick={() => go('member-attendance' as any)} style={{ fontSize: 12.5, color: theme.green, cursor: 'pointer', textDecoration: 'underline' }}>
              See full record →
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recent.map((a, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 120px 1fr 90px 110px',
                  gap: 16,
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: theme.cream,
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1, color: theme.dim }}>
                    {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                  </div>
                  <div style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: 500 }}>{new Date(a.date).toLocaleDateString('en-US', { weekday: 'long' })}</div>
                </div>
                <div style={{ fontSize: 12, color: theme.dim }}>{a.type}</div>
                <div style={{ fontSize: 13, color: a.note ? theme.dim : '#bbb', fontStyle: a.note ? 'italic' : 'normal' }}>{a.note || '—'}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 12 }}>{a.timeIn}</div>
                <StatusPill status={a.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Side col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card variant="green">
            <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.greenDeep, textTransform: 'uppercase' }}>Pinned</div>
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 19, margin: '6px 0 8px', fontWeight: 500, lineHeight: 1.2 }}>Fee settlement deadline — April 30</h3>
            <p style={{ fontSize: 13, color: theme.greenDeep, margin: 0, lineHeight: 1.5 }}>Outstanding balances for March must be settled by April 30. Finance will be at the studio every rehearsal.</p>
            <a onClick={() => go('member-fees' as any)} style={{ display: 'inline-block', marginTop: 12, fontSize: 12, color: theme.greenDeep, fontWeight: 500, cursor: 'pointer' }}>
              View my balance →
            </a>
          </Card>

          <Card>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Sign-up closing soon</div>
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 19, margin: '6px 0 14px', fontWeight: 500 }}>Upcoming performances</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcoming.map(e => (
                <div key={e.id} onClick={() => go('member-performances' as any)} style={{ display: 'flex', gap: 12, cursor: 'pointer', padding: 6, borderRadius: 8, alignItems: 'center' }}>
                  <div style={{ width: 54, height: 54, borderRadius: 8, backgroundImage: `url(${e.image})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.2 }}>{e.name}</div>
                    <div style={{ fontSize: 11.5, color: theme.dim, fontFamily: FONTS.mono, marginTop: 3 }}>
                      {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} · {e.venue.split(',')[0]}
                    </div>
                  </div>
                  {e.mySignup ? <Chip tone="green" icon="check">In</Chip> : <Chip tone="neutral">Open</Chip>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Calendar section ── */}
      <div style={{ marginTop: 40, paddingTop: 32, borderTop: `1px solid ${theme.line}` }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Schedule</div>
        <h2 style={{ fontFamily: FONTS.serif, fontSize: 28, margin: '4px 0 24px', fontWeight: 500 }}>Calendar</h2>
      </div>

      <Calendar role="member" onEventClick={(event: any) => setSelectedEvent(event)} />

      {userSchedule && (
        <Card style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Icon name="calendar" size={20} stroke={theme.green} />
            <div>
              <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: 0, fontWeight: 500 }}>Your Class Schedule</h3>
              <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>{userSchedule.term}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {userSchedule.classes.map((cls: any, i: number) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 2fr 1fr 120px',
                  gap: 12,
                  padding: 12,
                  background: theme.cream,
                  borderRadius: 8,
                  fontSize: 13,
                  alignItems: 'center',
                }}
              >
                <div style={{ fontFamily: FONTS.mono, fontWeight: 600, color: theme.green }}>{cls.code}</div>
                <div>{cls.name}</div>
                <div style={{ fontSize: 12, color: theme.dim }}>{cls.days.join(', ')}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 12 }}>{cls.startTime} - {cls.endTime}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <div
          onClick={() => setSelectedEvent(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: theme.paper, borderRadius: 14, width: 600, maxHeight: '85vh', overflowY: 'auto', border: `1px solid ${theme.line}` }}
          >
            <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
              <div style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, color: selectedEvent.color, textTransform: 'uppercase', marginBottom: 6 }}>
                {selectedEvent.type}
              </div>
              <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: 0, fontWeight: 500 }}>{selectedEvent.title}</h3>
            </div>

            <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 16px', fontSize: 14 }}>
                <Icon name="calendar" size={18} stroke={theme.dim} />
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>{selectedEvent.time || 'Time TBA'}</div>
                </div>
                {selectedEvent.venue && (
                  <>
                    <Icon name="mapPin" size={18} stroke={theme.dim} />
                    <div>{selectedEvent.venue}</div>
                  </>
                )}
                {selectedEvent.section && (
                  <>
                    <Icon name="users" size={18} stroke={theme.dim} />
                    <div>{selectedEvent.section}</div>
                  </>
                )}
              </div>

              {selectedEvent.time && checkConflict(selectedEvent.date, selectedEvent.time) && (
                <div style={{ padding: 14, background: theme.redSoft, borderRadius: 8, borderLeft: `3px solid ${theme.red}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon name="alertTriangle" size={18} stroke={theme.red} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: theme.red }}>Schedule Conflict</div>
                      <div style={{ fontSize: 12, color: theme.ink, marginTop: 4 }}>
                        This event conflicts with {checkConflict(selectedEvent.date, selectedEvent.time)?.code} – {checkConflict(selectedEvent.date, selectedEvent.time)?.name}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedEvent.mySignup ? (
                <div style={{ padding: 14, background: theme.greenSoft, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="check" size={18} stroke={theme.green} />
                  <div style={{ fontSize: 13, color: theme.greenDeep }}>You're signed up for this event</div>
                </div>
              ) : selectedEvent.type === 'performance' ? (
                <Button icon="userPlus" onClick={handleSignup}>Sign up for this event</Button>
              ) : null}
            </div>

            <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, background: theme.cream, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
