import { useState, useEffect } from 'react';
import { useTheme } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../supabase';

// ── Static fallback data for excuse/attendance charts ──────────────────────
const MONTHLY_DATA = [
  { month: 'Jan', Soprano: 4, Alto: 3, Tenor: 2, Bass: 2 },
  { month: 'Feb', Soprano: 6, Alto: 4, Tenor: 3, Bass: 3 },
  { month: 'Mar', Soprano: 5, Alto: 5, Tenor: 4, Bass: 2 },
  { month: 'Apr', Soprano: 3, Alto: 4, Tenor: 2, Bass: 3 },
  { month: 'May', Soprano: 7, Alto: 6, Tenor: 5, Bass: 4 },
  { month: 'Jun', Soprano: 4, Alto: 3, Tenor: 3, Bass: 2 },
];

const REASONS_DATA = [
  { label: 'Academic requirement', count: 18, pct: 29 },
  { label: 'Illness / medical', count: 16, pct: 25 },
  { label: 'Family obligation', count: 12, pct: 19 },
  { label: 'Org conflict', count: 9, pct: 14 },
  { label: 'Personal reason', count: 8, pct: 13 },
];

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
  active: number;
  inactive: number;
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
};

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
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('voice_section, committee, membership_status, current_term_stat, bday, college, course_code, terms_left, longevity_terms, last_term_gpa, entry_date');

      if (!data) { setLoading(false); return; }

      const bySection: Record<string, number> = {};
      const byCommittee: Record<string, number> = {};
      const byTermStat: Record<string, number> = {};
      const byCollege: Record<string, number> = {};
      const byCourse: Record<string, number> = {};
      const byCohortYear: Record<string, number> = {};
      const byLongevity: Record<string, number> = {};
      let active = 0, inactive = 0, gpaSum = 0, gpaCount = 0, termsSum = 0, termsCount = 0, birthdaysThisMonth = 0;
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

        // Active / inactive
        const ms = (p.membership_status ?? '').toLowerCase();
        if (ms === 'active') active++;
        else inactive++;

        // GPA
        if (p.last_term_gpa != null) { gpaSum += Number(p.last_term_gpa); gpaCount++; }

        // Terms left
        if (p.terms_left != null) { termsSum += Number(p.terms_left); termsCount++; }

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
        total: data.length, active, inactive,
        bySection, byCommittee, byTermStat, byCollege, byCourse, byCohortYear, byLongevity,
        avgGpa: gpaCount ? Math.round((gpaSum / gpaCount) * 100) / 100 : null,
        birthdaysThisMonth,
        avgTermsLeft: termsCount ? Math.round((termsSum / termsCount) * 10) / 10 : null,
      });
      setLoading(false);
    }
    load();
  }, []);

  const maxBar = Math.max(...MONTHLY_DATA.flatMap(m => [m.Soprano, m.Alto, m.Tenor, m.Bass]));
  const chartColors: Record<string, string> = { Soprano: '#B04A5F', Alto: '#9B6B2F', Tenor: '#2C5B8E', Bass: '#1B5E20' };
  const SECTIONS = ['Soprano', 'Alto', 'Tenor', 'Bass'];

  const topN = (rec: Record<string, number>, n = 6) =>
    Object.entries(rec).sort((a, b) => b[1] - a[1]).slice(0, n);

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Analytics"
        subtitle="Membership overview, academic profile, attendance trends, and more."
        actions={<Button variant="outline" icon="download">Download PDF</Button>}
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
            <StatCard label="Active" value={stats.active} sub={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% of roster`} tone="green" />
            <StatCard label="Inactive / LOA" value={stats.inactive} sub={`${stats.total ? Math.round((stats.inactive / stats.total) * 100) : 0}% of roster`} tone="amber" />
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

          {/* ── 3. Org Tenure & Cohorts ── */}
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
      ) : (
        <Card style={{ marginBottom: 28 }}>
          <div style={{ color: theme.dim, fontSize: 13 }}>Could not load membership data. Check Supabase RLS policies.</div>
        </Card>
      )}

      {/* ── 4. Attendance & Excuses ── */}
      <SectionLabel label="Attendance & Excuses" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 22 }}>
        <StatCard label="Avg. attendance" value="89%" sub="+2% vs Q1" tone="green" />
        <StatCard label="Excuses filed" value="63" sub="this term" tone="amber" />
        <StatCard label="Approved %" value="82%" sub="52 of 63" tone="blue" />
        <StatCard label="Fees collected" value="₱8.4k" sub="of ₱11.1k billed" tone="green" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, margin: 0, fontWeight: 500 }}>Excuses by section — 2026</h3>
            <div style={{ display: 'flex', gap: 14, fontSize: 11.5, fontFamily: FONTS.mono, color: theme.dim, letterSpacing: 0.3, flexWrap: 'wrap' }}>
              {Object.entries(chartColors).map(([s, c]) => <LegendDot key={s} color={c} label={s} />)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 220, padding: '16px 0 10px', borderBottom: `1px solid ${theme.line}` }}>
            {MONTHLY_DATA.map(row => (
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
        </Card>

        <Card>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, margin: '0 0 14px', fontWeight: 500 }}>Reasons breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {REASONS_DATA.map(r => (
              <div key={r.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                  <span>{r.label}</span>
                  <span style={{ fontFamily: FONTS.mono, color: theme.dim }}>{r.count} · {r.pct}%</span>
                </div>
                <div style={{ height: 6, background: theme.line, borderRadius: 3 }}>
                  <div style={{ width: `${r.pct * 2.5}%`, height: '100%', background: theme.green, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
