import { useState, useEffect } from 'react';
import { useTheme } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { SectionTag } from '../ui/SectionTag';
import { StatusPill } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { MEMBERS, EVENTS } from '../../data';
import { supabase } from '../../supabase';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekBounds(offset: number): { start: string; end: string; label: string } {
  const today = new Date();
  const dow = today.getDay(); // 0 = Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const label = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  return { start: fmt(monday), end: fmt(sunday), label: `${label(monday)} — ${label(sunday)}, ${monday.getFullYear()}` };
}

function statusColor(s: string, theme: any): string {
  switch (s) {
    case 'present': return theme.green;
    case 'late': return theme.amber;
    case 'absent': return theme.red;
    case 'excused': return theme.blue;
    default: return theme.dim;
  }
}

// ── FiltersModal ─────────────────────────────────────────────────────────────

function FiltersModal({ onClose, filters, onApply }: { onClose: () => void; filters: any; onApply: (f: any) => void }) {
  const { theme } = useTheme();
  const [local, setLocal] = useState(filters);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.paper, borderRadius: 14, width: 500, border: `1px solid ${theme.line}` }}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Attendance Overview</div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>Filters</h3>
        </div>
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Attendance status
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Present', 'Late', 'Absent', 'Excused'].map(s => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={local.statuses.includes(s.toLowerCase())}
                    onChange={e => {
                      const v = s.toLowerCase();
                      setLocal({ ...local, statuses: e.target.checked ? [...local.statuses, v] : local.statuses.filter((x: string) => x !== v) });
                    }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Attendance rate threshold
            </label>
            <select
              value={local.rateThreshold}
              onChange={e => setLocal({ ...local, rateThreshold: Number(e.target.value) })}
              style={{ width: '100%', padding: '11px 14px', border: `1px solid ${theme.lineDark}`, borderRadius: 10, fontSize: 14, background: theme.paper, color: theme.ink, outline: 'none' }}
            >
              <option value={0}>All members</option>
              <option value={50}>Below 50%</option>
              <option value={75}>Below 75%</option>
              <option value={90}>Below 90%</option>
            </select>
          </div>
        </div>
        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'space-between', gap: 10, background: theme.cream }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="check" onClick={() => { onApply(local); onClose(); }}>Apply filters</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const thStyle = { padding: '14px 16px', textAlign: 'left' as const, fontWeight: 500 };
const tdStyle = { padding: '12px 16px', verticalAlign: 'middle' as const };

export function AdminAttendance() {
  const { theme } = useTheme();
  const [section, setSection] = useState('All');
  const [weekOffset, setWeekOffset] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ statuses: ['present', 'late', 'absent', 'excused'], rateThreshold: 0 });

  // Map: profileUuid → Map<eventId, logStatus>
  const [logMap, setLogMap] = useState<Map<string, Map<number, string>>>(new Map());
  const [loadingLogs, setLoadingLogs] = useState(false);

  const week = getWeekBounds(weekOffset);
  const weekEvents = EVENTS.filter(ev => ev.date >= week.start && ev.date <= week.end);

  // Fetch attendance logs whenever the week changes
  useEffect(() => {
    const eventIds = EVENTS
      .filter(ev => ev.date >= week.start && ev.date <= week.end)
      .map(ev => Number(ev.id))
      .filter(Boolean);

    if (eventIds.length === 0) { setLogMap(new Map()); return; }

    setLoadingLogs(true);
    supabase
      .from('attendance_logs')
      .select('account_id_fk, event_id_fk, log_status')
      .in('event_id_fk', eventIds)
      .then(({ data }) => {
        const map = new Map<string, Map<number, string>>();
        for (const log of data ?? []) {
          if (!log.account_id_fk) continue;
          if (!map.has(log.account_id_fk)) map.set(log.account_id_fk, new Map());
          map.get(log.account_id_fk)!.set(log.event_id_fk, (log.log_status ?? 'present').toLowerCase());
        }
        setLogMap(map);
        setLoadingLogs(false);
      });
  }, [weekOffset, week.start]);

  // Members list filtered by section
  let members = section === 'All' ? MEMBERS : MEMBERS.filter(m => m.section === section);

  // Apply rate threshold filter
  if (filters.rateThreshold > 0 && weekEvents.length > 0) {
    members = members.filter(m => {
      const uuid = m._uuid as string;
      const memberLogs = logMap.get(uuid) ?? new Map();
      const presentCount = weekEvents.filter(ev => memberLogs.get(Number(ev.id)) === 'present').length;
      const rate = Math.round((presentCount / weekEvents.length) * 100);
      return rate < filters.rateThreshold;
    });
  }

  const navBtn = {
    width: 30, height: 30,
    background: theme.paper, border: `1px solid ${theme.line}`, borderRadius: 8,
    cursor: 'pointer', display: 'inline-flex' as const,
    alignItems: 'center' as const, justifyContent: 'center' as const, color: theme.ink,
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Attendance Overview"
        subtitle="Section-level attendance across all rehearsals and performances."
        actions={
          <>
            <Button variant="outline" icon="filter" onClick={() => setShowFilters(true)}>Filters</Button>
            <Button variant="outline" icon="download">Export</Button>
          </>
        }
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: theme.paper, border: `1px solid ${theme.line}`, borderRadius: 10 }}>
          {['All', 'Soprano', 'Alto', 'Tenor', 'Bass'].map(s => (
            <button
              key={s}
              onClick={() => setSection(s)}
              style={{
                padding: '7px 14px', borderRadius: 7, fontSize: 12.5,
                background: section === s ? theme.greenDark : 'transparent',
                color: section === s ? '#fff' : theme.ink,
                border: 'none', cursor: 'pointer', fontFamily: FONTS.sans, fontWeight: section === s ? 500 : 400,
              }}
            >{s}</button>
          ))}
        </div>

        {/* Week navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setWeekOffset(w => w - 1)} style={navBtn}><Icon name="chevronLeft" size={14} /></button>
          <div style={{ fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 0.5 }}>{week.label}</div>
          <button onClick={() => setWeekOffset(w => w + 1)} style={navBtn}><Icon name="chevronRight" size={14} /></button>
        </div>
      </div>

      {weekEvents.length === 0 ? (
        <Card>
          <div style={{ padding: 32, textAlign: 'center', color: theme.dim }}>
            <Icon name="calendar" size={32} stroke={theme.line} />
            <div style={{ marginTop: 12, fontSize: 14 }}>No events scheduled this week.</div>
            <div style={{ fontSize: 12, marginTop: 4, color: theme.dim }}>Use the arrows to navigate to a week with events.</div>
          </div>
        </Card>
      ) : (
        <Card pad={0}>
          {loadingLogs && (
            <div style={{ padding: '10px 20px', fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1, color: theme.dim }}>
              Loading attendance data…
            </div>
          )}
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONTS.sans, fontSize: 13 }}>
              <thead>
                <tr style={{ background: theme.cream, fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: theme.dim }}>
                  <th style={thStyle}>Member</th>
                  <th style={thStyle}>Section</th>
                  {weekEvents.map(ev => (
                    <th key={ev.id} style={{ ...thStyle, textAlign: 'center' as const, whiteSpace: 'nowrap', minWidth: 110 }}>
                      <div>{new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{ev.type.slice(0, 5).toUpperCase()}</div>
                    </th>
                  ))}
                  <th style={{ ...thStyle, textAlign: 'center' as const }}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => {
                  const uuid = m._uuid as string;
                  const memberLogs = logMap.get(uuid) ?? new Map<number, string>();
                  const statuses = weekEvents.map(ev => memberLogs.get(Number(ev.id)) ?? 'absent');
                  const presentCount = statuses.filter(s => s === 'present').length;
                  const rate = weekEvents.length > 0 ? Math.round((presentCount / weekEvents.length) * 100) : 0;
                  const hasAnyLog = statuses.some(s => s !== 'absent');

                  // Skip members who don't match status filter (when specific statuses are selected)
                  const filteredStatuses = filters.statuses;
                  if (filteredStatuses.length < 4 && !statuses.some(s => filteredStatuses.includes(s))) return null;

                  return (
                    <tr key={m.id} style={{ borderTop: `1px solid ${theme.line}` }}>
                      <td style={{ ...tdStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar member={m} size={28} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: theme.dim, fontFamily: FONTS.mono }}>#{m.id}</div>
                        </div>
                      </td>
                      <td style={tdStyle}><SectionTag section={m.section} /></td>
                      {statuses.map((s, j) => (
                        <td key={j} style={{ ...tdStyle, textAlign: 'center' }}>
                          {!hasAnyLog && s === 'absent'
                            ? <span style={{ color: theme.line, fontSize: 18 }}>—</span>
                            : <StatusPill status={s} />
                          }
                        </td>
                      ))}
                      <td style={{ ...tdStyle, textAlign: 'center', fontFamily: FONTS.serif, fontSize: 17, fontWeight: 500, color: !hasAnyLog ? theme.dim : rate >= 75 ? theme.green : rate >= 50 ? theme.amber : theme.red }}>
                        {hasAnyLog ? `${rate}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showFilters && <FiltersModal onClose={() => setShowFilters(false)} filters={filters} onApply={setFilters} />}
    </>
  );
}
