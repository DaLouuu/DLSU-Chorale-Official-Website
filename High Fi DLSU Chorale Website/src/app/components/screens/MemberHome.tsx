import { useState } from 'react';
import { useRouter, useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Chip, StatusPill } from '../ui/Chip';
import { ATTENDANCE_LOG, FEE_RECORDS } from '../../data';
import tet from '../../../imports/choir-tet.png';

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
  const [refreshKey, setRefreshKey] = useState(0);

  const myExcuses = app.excuses.filter(e => e.memberId === user.id);
  const pendingMine = myExcuses.filter(e => e.status === 'Pending').length;
  const upcoming = app.events.filter(e => new Date(e.date) > new Date('2026-04-24')).slice(0, 3);
  const outstanding = FEE_RECORDS.filter(f => f.status === 'unpaid').reduce((s, f) => s + f.amount, 0);
  const recent = ATTENDANCE_LOG.slice(0, 4);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    app.showToast('Feed refreshed');
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
            <Button variant="ghost" icon="refreshCw" onClick={handleRefresh}>
              Refresh
            </Button>
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
    </>
  );
}
