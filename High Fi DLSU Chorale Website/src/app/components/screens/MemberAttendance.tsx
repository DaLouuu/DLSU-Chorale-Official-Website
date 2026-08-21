import { useState, useMemo, useEffect } from 'react';
import { useRouter, useTheme } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusPill } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { ATTENDANCE_LOG } from '../../data';
import { downloadCSV, todayStamp } from '../../utils/exportCsv';
import { useViewportWidth } from '../../utils/useViewportWidth';

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

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      {label}
    </span>
  );
}

export function MemberAttendance() {
  const [filter, setFilter] = useState('All');
  const { theme } = useTheme();
  const vw = useViewportWidth();
  const isMobile = vw < 768;

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['Date', 'Type', 'Status', 'Time In', 'Note'],
      ...ATTENDANCE_LOG
        .filter(a => filter === 'All' || a.type === filter.slice(0, -1))
        .map(a => [a.date, a.type, a.status, a.timeIn, a.note || '']),
    ];
    downloadCSV(`my-attendance-${todayStamp()}`, rows);
  };

  const log = useMemo(() => ATTENDANCE_LOG.filter(a => filter === 'All' || a.type === filter.slice(0, -1)), [filter]);
  const counts = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0, excused: 0 };
    log.forEach(a => c[a.status as keyof typeof c]++);
    return c;
  }, [log]);

  // Build calendar grid for the viewed month
  const [viewMonth, setViewMonth] = useState(new Date());
  const viewYear = viewMonth.getFullYear();
  const viewMonthIndex = viewMonth.getMonth();
  const today = new Date();
  const isToday = (day: number) =>
    viewYear === today.getFullYear() && viewMonthIndex === today.getMonth() && day === today.getDate();

  const monthDays: Array<{ day: number; entry?: any; isToday?: boolean } | null> = [];
  const firstDay = new Date(viewYear, viewMonthIndex, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonthIndex + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) monthDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${viewYear}-${String(viewMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const entry = ATTENDANCE_LOG.find(a => a.date === date);
    monthDays.push({ day: d, entry, isToday: isToday(d) });
  }

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        title="My Attendance"
        subtitle="Complete attendance record across all rehearsals and performances this term."
        actions={
          <Button variant="outline" icon="download" onClick={handleExportCSV}>
            Export CSV
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Present" value={counts.present} trend="on time" tone="green" />
        <StatCard label="Late" value={counts.late} trend="₱50 each" tone="amber" />
        <StatCard label="Absent" value={counts.absent} trend="unexcused · ₱150" tone="red" />
        <StatCard label="Excused" value={counts.excused} trend="no fee" tone="blue" />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {['All', 'Rehearsals', 'Performances'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 12.5,
              background: filter === f ? theme.ink : 'transparent',
              color: filter === f ? '#fff' : theme.ink,
              border: `1px solid ${filter === f ? theme.ink : theme.lineDark}`,
              cursor: 'pointer',
              fontFamily: FONTS.sans,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: 20 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setViewMonth(new Date(viewYear, viewMonthIndex - 1, 1))}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: theme.ink }}
              >
                <Icon name="chevronLeft" size={18} />
              </button>
              <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: 0, fontWeight: 500, minWidth: 150, textAlign: 'center' }}>
                {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setViewMonth(new Date(viewYear, viewMonthIndex + 1, 1))}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: theme.ink }}
              >
                <Icon name="chevronRight" size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: theme.dim, fontFamily: FONTS.mono, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              <LegendDot color={theme.green} label="Present" />
              <LegendDot color={theme.amber} label="Late" />
              <LegendDot color={theme.red} label="Absent" />
              <LegendDot color={theme.blue} label="Excused" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ fontFamily: FONTS.mono, fontSize: 10, color: theme.dim, textAlign: 'center', paddingBottom: 6, letterSpacing: 1 }}>
                {d}
              </div>
            ))}
            {monthDays.map((d, i) => {
              if (!d) return <div key={i} />;
              const color = d.entry ? ({ present: theme.green, late: theme.amber, absent: theme.red, excused: theme.blue } as any)[d.entry.status] : null;
              return (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 8,
                    border: `1px solid ${d.isToday ? theme.green : theme.line}`,
                    background: color ? color + '15' : d.isToday ? theme.greenSoft : 'transparent',
                    padding: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    cursor: d.entry ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: d.isToday ? 700 : 500, color: color ? color : theme.ink, fontFamily: FONTS.mono }}>{d.day}</div>
                  {color && <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, alignSelf: 'flex-end' }} />}
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '0 0 14px', fontWeight: 500 }}>Log ({log.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 440, overflow: 'auto' }}>
            {log.map((a, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '70px 1fr 90px', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: theme.cream }}>
                <div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: theme.dim, letterSpacing: 0.5 }}>
                    {new Date(a.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </div>
                  <div style={{ fontFamily: FONTS.serif, fontSize: 22, lineHeight: 1, fontWeight: 500 }}>{new Date(a.date).getDate()}</div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                    {a.type} · {a.timeIn}
                  </div>
                  <div style={{ fontSize: 11.5, color: theme.dim, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.note || '—'}</div>
                </div>
                <div style={{ justifySelf: isMobile ? 'flex-start' : 'auto' }}>
                  <StatusPill status={a.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
