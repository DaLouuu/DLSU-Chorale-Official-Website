import { useState, useEffect } from 'react';
import { useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../supabase';
import { downloadCSV, todayStamp } from '../../utils/exportCsv';

const SECTION_COLORS: Record<string, string> = {
  Soprano: '#B04A5F',
  Alto: '#9B6B2F',
  Tenor: '#2C5B8E',
  Bass: '#1B5E20',
};

const SECTION_SOFT: Record<string, string> = {
  Soprano: '#fdf0f3',
  Alto: '#fdf5ec',
  Tenor: '#eff4fc',
  Bass: '#f0f7f0',
};

// ── Types ──────────────────────────────────────────────────────────────────
type OrgStats = {
  total: number;
  byMembershipStatus: Record<string, number>;
  bySection: Record<string, number>;
  byCommittee: Record<string, number>;
  byTermStat: Record<string, number>;
  byCollege: Record<string, number>;
  byCourse: Record<string, number>;
  byCohortYear: Record<string, number>;
  byLongevity: Record<string, number>;
  avgGpa: number | null;
  birthdaysThisMonth: number;
  avgTermsLeft: number | null;
  nearingGraduation: {
    total: number;
    bySection: Record<string, number>;
    members: { name: string; section: string; termsLeft: number }[];
  };
};

const NEARING_GRADUATION_THRESHOLD = 3;

// ── Sub-components ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, tone = 'neutral' }: { label: string; value: string | number; sub?: string; tone?: 'green' | 'amber' | 'red' | 'blue' | 'neutral' }) {
  const { theme } = useTheme();
  const color = { green: theme.green, amber: theme.amber, red: theme.red, blue: theme.blue, neutral: theme.ink }[tone];
  return (
    <Card>
      <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1.5, color: theme.dim, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: FONTS.serif, fontSize: 38, fontWeight: 500, margin: '6px 0 4px', color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: theme.dim }}>{sub}</div>}
    </Card>
  );
}

function MiniStatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  const { theme } = useTheme();
  return (
    <div style={{ background: theme.paper, border: `1px solid ${theme.line}`, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: theme.dim, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: FONTS.serif, fontSize: 28, fontWeight: 500, margin: '4px 0 2px', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.dim }}>{sub}</div>}
    </div>
  );
}

function SectionCard({ section, count, total }: { section: string; count: number; total: number }) {
  const { theme } = useTheme();
  const pct = total ? Math.round((count / total) * 100) : 0;
  const color = SECTION_COLORS[section] ?? theme.green;
  const soft = SECTION_SOFT[section] ?? theme.cream;
  return (
    <div style={{ background: theme.paper, border: `1px solid ${theme.line}`, borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, textTransform: 'uppercase', color, fontWeight: 600 }}>{section}</span>
        <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: theme.dim }}>{pct}%</span>
      </div>
      <div style={{ fontFamily: FONTS.serif, fontSize: 32, fontWeight: 500, color, lineHeight: 1 }}>{count}</div>
      <div style={{ height: 5, background: soft, borderRadius: 3, border: `1px solid ${color}20` }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function BarRow({ label, count, max, pct, showPct = true }: { label: string; count: number; max: number; pct?: number; showPct?: boolean }) {
  const { theme } = useTheme();
  const p = pct ?? (max ? Math.round((count / max) * 100) : 0);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: FONTS.mono, color: theme.dim }}>{count}{showPct ? ` · ${p}%` : ''}</span>
      </div>
      <div style={{ height: 6, background: theme.line, borderRadius: 3 }}>
        <div style={{ width: `${max ? (count / max) * 100 : 0}%`, height: '100%', background: theme.green, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  const { theme } = useTheme();
  return (
    <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginTop: 8, marginBottom: 12 }}>
      {label}
    </div>
  );
}

function Divider() {
  const { theme } = useTheme();
  return <div style={{ height: 1, background: theme.line, margin: '8px 0 28px' }} />;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      {label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function AdminAnalytics() {
  const { theme } = useTheme();
  const app = useApp();
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceRate, setAttendanceRate] = useState<{ pct: number; present: number; total: number } | null>(null);

  useEffect(() => {
    async function loadAttendance() {
      const { data: logs } = await supabase.from('attendance_logs').select('log_status');
      if (!logs || logs.length === 0) return;
      const present = logs.filter(l => (l.log_status ?? '').toLowerCase() === 'present').length;
      setAttendanceRate({ pct: Math.round((present / logs.length) * 100), present, total: logs.length });
    }
    loadAttendance();
  }, []);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, voice_section, committee, membership_status, current_term_stat, bday, college, course_code, terms_left, longevity_terms, last_term_gpa, entry_date');

      if (!data) { setLoading(false); return; }

      const bySection: Record<string, number> = {};
      const byCommittee: Record<string, number> = {};
      const byTermStat: Record<string, number> = {};
      const byMembershipStatus: Record<string, number> = {};
      const byCollege: Record<string, number> = {};
      const byCourse: Record<string, number> = {};
      const byCohortYear: Record<string, number> = {};
      const byLongevity: Record<string, number> = {};
      const nearingGradBySection: Record<string, number> = {};
      const nearingGradMembers: { name: string; section: string; termsLeft: number }[] = [];
      let gpaSum = 0, gpaCount = 0, termsSum = 0, termsCount = 0, birthdaysThisMonth = 0;
      const thisMonth = new Date().getMonth() + 1;

      for (const p of data) {
        // Section
        const sec = p.voice_section ?? 'Unknown';
        bySection[sec] = (bySection[sec] ?? 0) + 1;

        // Committee
        const com = p.committee ?? 'Unassigned';
        byCommittee[com] = (byCommittee[com] ?? 0) + 1;

        // Term stat
        if (p.current_term_stat) {
          byTermStat[p.current_term_stat] = (byTermStat[p.current_term_stat] ?? 0) + 1;
        }

        // College
        const col = p.college ?? 'Unknown';
        byCollege[col] = (byCollege[col] ?? 0) + 1;

        // Course
        if (p.course_code) {
          byCourse[p.course_code] = (byCourse[p.course_code] ?? 0) + 1;
        }

        // Membership status (Trainee / Junior Member / Senior Member)
        const ms = p.membership_status ?? 'Unspecified';
        byMembershipStatus[ms] = (byMembershipStatus[ms] ?? 0) + 1;

        // GPA
        if (p.last_term_gpa != null) { gpaSum += Number(p.last_term_gpa); gpaCount++; }

        // Terms left
        if (p.terms_left != null) {
          const terms = Number(p.terms_left);
          termsSum += terms; termsCount++;
          if (terms <= NEARING_GRADUATION_THRESHOLD) {
            nearingGradBySection[sec] = (nearingGradBySection[sec] ?? 0) + 1;
            nearingGradMembers.push({
              name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unnamed member',
              section: sec, termsLeft: terms,
            });
          }
        }

        // Birthdays this month
        if (p.bday) {
          const bdayMonth = new Date(p.bday).getMonth() + 1;
          if (bdayMonth === thisMonth) birthdaysThisMonth++;
        }

        // Entry cohort
        if (p.entry_date) {
          const year = String(new Date(p.entry_date).getFullYear());
          byCohortYear[year] = (byCohortYear[year] ?? 0) + 1;
        }

        // Longevity bucket
        if (p.longevity_terms != null) {
          const n = Number(p.longevity_terms);
          const bucket = n <= 2 ? '1–2 terms' : n <= 4 ? '3–4 terms' : n <= 6 ? '5–6 terms' : '7+ terms';
          byLongevity[bucket] = (byLongevity[bucket] ?? 0) + 1;
        }
      }

      setStats({
        total: data.length, byMembershipStatus,
        bySection, byCommittee, byTermStat, byCollege, byCourse, byCohortYear, byLongevity,
        avgGpa: gpaCount ? Math.round((gpaSum / gpaCount) * 100) / 100 : null,
        birthdaysThisMonth,
        avgTermsLeft: termsCount ? Math.round((termsSum / termsCount) * 10) / 10 : null,
        nearingGraduation: {
          total: nearingGradMembers.length,
          bySection: nearingGradBySection,
          members: nearingGradMembers.sort((a, b) => a.termsLeft - b.termsLeft),
        },
      });
      setLoading(false);
    }
    load();
  }, []);

  const handleExportCSV = () => {
    if (!stats) return;
    const blank: (string | number)[] = ['', ''];
    const rows: (string | number)[][] = [
      ['DLSU Chorale — Analytics Export', todayStamp()],
      blank,
      ['MEMBERSHIP OVERVIEW', ''],
      ['Metric', 'Value'],
      ['Total Members', stats.total],
      ...Object.entries(stats.byMembershipStatus).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
      ['Avg GPA (last term)', stats.avgGpa ?? 'N/A'],
      ['Avg Terms Left', stats.avgTermsLeft ?? 'N/A'],
      ['Birthdays This Month', stats.birthdaysThisMonth],
      blank,
      ['BY VOICE SECTION', ''],
      ['Section', 'Count'],
      ...Object.entries(stats.bySection).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
      blank,
      ['BY PERFORMING STATUS', ''],
      ['Status', 'Count'],
      ...Object.entries(stats.byTermStat).map(([k, v]) => [k, v]),
      blank,
      ['BY COMMITTEE', ''],
      ['Committee', 'Count'],
      ...Object.entries(stats.byCommittee).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
      blank,
      ['BY COLLEGE', ''],
      ['College', 'Count'],
      ...Object.entries(stats.byCollege).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
      blank,
      ['BY COURSE', ''],
      ['Course Code', 'Count'],
      ...Object.entries(stats.byCourse).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
      blank,
      ['BY ENTRY COHORT YEAR', ''],
      ['Year', 'Count'],
      ...Object.entries(stats.byCohortYear).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => [k, v]),
      blank,
      ['BY LONGEVITY', ''],
      ['Bracket', 'Count'],
      ...Object.entries(stats.byLongevity).map(([k, v]) => [k, v]),
    ];
    downloadCSV(`chorale-analytics-${todayStamp()}`, rows);
  };

  const chartColors: Record<string, string> = { Soprano: '#B04A5F', Alto: '#9B6B2F', Tenor: '#2C5B8E', Bass: '#1B5E20' };
  const SECTIONS = ['Soprano', 'Alto', 'Tenor', 'Bass'];

  const topN = (rec: Record<string, number>, n = 6) =>
    Object.entries(rec).sort((a, b) => b[1] - a[1]).slice(0, n);

  const excuses = app.excuses as any[];
  const excusesTotal = excuses.length;
  const excusesApproved = excuses.filter(e => e.status === 'Approved').length;

  const byType: Record<string, number> = {};
  for (const e of excuses) {
    const t = e.type ?? 'Other';
    byType[t] = (byType[t] ?? 0) + 1;
  }
  const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const maxType = typeEntries.length > 0 ? typeEntries[0][1] : 0;

  const monthlyBySection: Record<string, Record<string, number>> = {};
  for (const e of excuses) {
    if (!e.date || !e.section) continue;
    const monthKey = new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (!monthlyBySection[monthKey]) monthlyBySection[monthKey] = { Soprano: 0, Alto: 0, Tenor: 0, Bass: 0 };
    if (SECTIONS.includes(e.section)) monthlyBySection[monthKey][e.section]++;
  }
  const monthlyData = Object.entries(monthlyBySection)
    .map(([month, counts]) => ({ month, ...counts }))
    .sort((a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime())
    .slice(-6);
  const maxBar = Math.max(1, ...monthlyData.flatMap(m => [m.Soprano, m.Alto, m.Tenor, m.Bass]));

  const fees = app.fees as any[];
  const feesBilled = fees.reduce((s, f) => s + (f.amount ?? 0), 0);
  const feesCollected = fees.filter(f => f.status === 'paid').reduce((s, f) => s + (f.amount ?? 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Analytics"
        subtitle="Membership overview, academic profile, attendance trends, and more."
        actions={<Button variant="outline" icon="download" onClick={handleExportCSV} disabled={!stats}>Export CSV</Button>}
      />

      {loading ? (
        <Card>
          <div style={{ textAlign: 'center', color: theme.dim, fontFamily: FONTS.mono, fontSize: 13, letterSpacing: 1, padding: 32 }}>
            Loading data…
          </div>
        </Card>
      ) : stats ? (
        <>
          {/* ── 1. Membership Overview ── */}
          <SectionLabel label="Membership Overview" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
            <StatCard label="Total members" value={stats.total} sub="All records" />
            {Object.entries(stats.byMembershipStatus).map(([status, count]) => (
              <StatCard
                key={status}
                label={status}
                value={count}
                sub={`${stats.total ? Math.round((count / stats.total) * 100) : 0}% of roster`}
                tone={status === 'Senior Member' ? 'green' : status === 'Junior Member' ? 'blue' : 'amber'}
              />
            ))}
            <StatCard label="Birthdays this month" value={stats.birthdaysThisMonth} tone="neutral" />
          </div>

          {/* Section cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, marginBottom: 24 }}>
            {SECTIONS.map(sec => (
              <SectionCard key={sec} section={sec} count={stats.bySection[sec] ?? 0} total={stats.total} />
            ))}
            {Object.keys(stats.bySection).filter(k => !SECTIONS.includes(k)).map(sec => (
              <SectionCard key={sec} section={sec} count={stats.bySection[sec]} total={stats.total} />
            ))}
          </div>

          {/* Committee + Term stat */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
            {topN(stats.byCommittee).length > 0 && (
              <Card>
                <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: '0 0 16px', fontWeight: 500 }}>Members by Committee</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topN(stats.byCommittee).map(([name, count]) => (
                    <BarRow key={name} label={name} count={count} max={topN(stats.byCommittee)[0][1]} pct={stats.total ? Math.round((count / stats.total) * 100) : 0} />
                  ))}
                </div>
              </Card>
            )}
            {topN(stats.byTermStat).length > 0 && (
              <Card>
                <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: '0 0 16px', fontWeight: 500 }}>Current Term Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topN(stats.byTermStat).map(([stat, count]) => (
                    <BarRow key={stat} label={stat} count={count} max={stats.total} pct={stats.total ? Math.round((count / stats.total) * 100) : 0} />
                  ))}
                </div>
              </Card>
            )}
          </div>

          <Divider />

          {/* ── 2. Academic Profile ── */}
          <SectionLabel label="Academic Profile" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
            {stats.avgGpa !== null && (
              <MiniStatCard label="Avg. last term GPA" value={stats.avgGpa.toFixed(2)} sub="across reported members" />
            )}
            {stats.avgTermsLeft !== null && (
              <MiniStatCard label="Avg. terms left" value={stats.avgTermsLeft} sub="estimated" />
            )}
            <MiniStatCard label="Colleges represented" value={Object.keys(stats.byCollege).length} />
            <MiniStatCard label="Courses represented" value={Object.keys(stats.byCourse).length} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
            {topN(stats.byCollege).length > 0 && (
              <Card>
                <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: '0 0 16px', fontWeight: 500 }}>Members by College</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topN(stats.byCollege, 8).map(([col, count]) => (
                    <BarRow key={col} label={col} count={count} max={topN(stats.byCollege)[0][1]} pct={stats.total ? Math.round((count / stats.total) * 100) : 0} />
                  ))}
                </div>
              </Card>
            )}
            {topN(stats.byCourse, 8).length > 0 && (
              <Card>
                <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: '0 0 16px', fontWeight: 500 }}>Members by Course</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topN(stats.byCourse, 8).map(([course, count]) => (
                    <BarRow key={course} label={course} count={count} max={topN(stats.byCourse)[0][1]} pct={stats.total ? Math.round((count / stats.total) * 100) : 0} />
                  ))}
                </div>
              </Card>
            )}
          </div>

          <Divider />

          {stats.nearingGraduation.total > 0 && (
            <>
              <SectionLabel label="Nearing Graduation" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
                <MiniStatCard
                  label="Nearing graduation"
                  value={stats.nearingGraduation.total}
                  sub={`${NEARING_GRADUATION_THRESHOLD} terms left or fewer`}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
                <Card>
                  <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: '0 0 16px', fontWeight: 500 }}>Nearing Graduation by Section</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(['Soprano', 'Alto', 'Tenor', 'Bass']).filter(s => stats.nearingGraduation.bySection[s]).map(s => (
                      <BarRow
                        key={s}
                        label={s}
                        count={stats.nearingGraduation.bySection[s]}
                        max={stats.nearingGraduation.total}
                        pct={Math.round((stats.nearingGraduation.bySection[s] / stats.nearingGraduation.total) * 100)}
                      />
                    ))}
                  </div>
                </Card>
                <Card>
                  <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: '0 0 16px', fontWeight: 500 }}>Nearing Graduation — Members</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 260, overflowY: 'auto' }}>
                    {stats.nearingGraduation.members.map((m, i) => (
                      <div
                        key={`${m.name}-${i}`}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '9px 0', borderTop: i === 0 ? 'none' : `1px solid ${theme.line}`, fontSize: 13,
                        }}
                      >
                        <span>{m.name}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: SECTION_COLORS[m.section] ?? theme.dim, fontFamily: FONTS.mono, textTransform: 'uppercase' }}>{m.section}</span>
                          <span style={{
                            fontSize: 11, fontFamily: FONTS.mono, padding: '2px 8px', borderRadius: 20,
                            background: theme.amberSoft, color: theme.amber,
                          }}>
                            {m.termsLeft} term{m.termsLeft === 1 ? '' : 's'} left
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Divider />
            </>
          )}

          {/* ── 3. Org Tenure & Cohorts (only shown once entry_date/longevity_terms data exists) ── */}
          {(topN(stats.byCohortYear).length > 0 || topN(stats.byLongevity).length > 0) && (
            <>
              <SectionLabel label="Tenure & Cohorts" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
                {topN(stats.byCohortYear).length > 0 && (
                  <Card>
                    <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: '0 0 16px', fontWeight: 500 }}>Entry Cohort (by year)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {topN(stats.byCohortYear, 8).sort((a, b) => Number(a[0]) - Number(b[0])).map(([year, count]) => (
                        <BarRow key={year} label={year} count={count} max={topN(stats.byCohortYear)[0][1]} pct={stats.total ? Math.round((count / stats.total) * 100) : 0} />
                      ))}
                    </div>
                  </Card>
                )}
                {topN(stats.byLongevity).length > 0 && (
                  <Card>
                    <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: '0 0 16px', fontWeight: 500 }}>Member Longevity</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {(['1–2 terms', '3–4 terms', '5–6 terms', '7+ terms']).filter(b => stats.byLongevity[b]).map(bucket => (
                        <BarRow key={bucket} label={bucket} count={stats.byLongevity[bucket]} max={Math.max(...Object.values(stats.byLongevity))} pct={stats.total ? Math.round((stats.byLongevity[bucket] / stats.total) * 100) : 0} />
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              <Divider />
            </>
          )}
        </>
      ) : (
        <Card style={{ marginBottom: 28 }}>
          <div style={{ color: theme.dim, fontSize: 13 }}>Could not load membership data. Check Supabase RLS policies.</div>
        </Card>
      )}

      {/* ── 4. Attendance & Excuses ── */}
      <SectionLabel label="Attendance & Excuses" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 22 }}>
        <StatCard
          label="Avg. attendance"
          value={attendanceRate ? `${attendanceRate.pct}%` : '—'}
          sub={attendanceRate ? `${attendanceRate.present} of ${attendanceRate.total} logs` : 'no logs yet'}
          tone="green"
        />
        <StatCard label="Excuses filed" value={excusesTotal} sub="on file" tone="amber" />
        <StatCard
          label="Approved %"
          value={excusesTotal ? `${Math.round((excusesApproved / excusesTotal) * 100)}%` : '—'}
          sub={excusesTotal ? `${excusesApproved} of ${excusesTotal}` : 'no excuses yet'}
          tone="blue"
        />
        <StatCard
          label="Fees collected"
          value={`₱${feesCollected.toLocaleString()}`}
          sub={`of ₱${feesBilled.toLocaleString()} billed`}
          tone="green"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, margin: 0, fontWeight: 500 }}>Excuses by section</h3>
            <div style={{ display: 'flex', gap: 14, fontSize: 11.5, fontFamily: FONTS.mono, color: theme.dim, letterSpacing: 0.3, flexWrap: 'wrap' }}>
              {Object.entries(chartColors).map(([s, c]) => <LegendDot key={s} color={c} label={s} />)}
            </div>
          </div>
          {monthlyData.length === 0 ? (
            <div style={{ color: theme.dim, fontSize: 13, textAlign: 'center', padding: '32px 0' }}>No excuses on file yet.</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 16, height: 220, padding: '16px 0 10px', borderBottom: `1px solid ${theme.line}` }}>
              {monthlyData.map(row => (
                <div key={row.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 3, width: '100%', justifyContent: 'center' }}>
                    {(['Soprano', 'Alto', 'Tenor', 'Bass'] as const).map(s => (
                      <div key={s} title={`${s}: ${row[s]}`} style={{ width: 11, height: `${(row[s] / maxBar) * 100}%`, background: chartColors[s], borderRadius: '3px 3px 0 0' }} />
                    ))}
                  </div>
                  <div style={{ marginTop: 8, fontFamily: FONTS.mono, fontSize: 11, color: theme.dim }}>{row.month}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, margin: '0 0 14px', fontWeight: 500 }}>Excuses by type</h3>
          {typeEntries.length === 0 ? (
            <div style={{ color: theme.dim, fontSize: 13, textAlign: 'center', padding: '32px 0' }}>No excuses on file yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {typeEntries.map(([label, count]) => {
                const pct = excusesTotal ? Math.round((count / excusesTotal) * 100) : 0;
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                      <span>{label}</span>
                      <span style={{ fontFamily: FONTS.mono, color: theme.dim }}>{count} · {pct}%</span>
                    </div>
                    <div style={{ height: 6, background: theme.line, borderRadius: 3 }}>
                      <div style={{ width: `${(count / maxType) * 100}%`, height: '100%', background: theme.green, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
