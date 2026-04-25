import { useState, useEffect } from 'react';
import { useTheme } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { SectionTag } from '../ui/SectionTag';
import { Chip } from '../ui/Chip';
import { supabase } from '../../supabase';

type Profile = {
  id: string;
  school_id: number | null;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  nickname: string | null;
  email: string | null;
  alternative_email: string | null;
  voice_section: string | null;
  committee: string | null;
  membership_status: string | null;
  current_term_stat: string | null;
  bday: string | null;
  mobile_num: string | null;
  college: string | null;
  course_code: string | null;
  terms_left: number | null;
  longevity_terms: number | null;
  last_term_gpa: number | null;
  entry_date: string | null;
  telegram_user: string | null;
  fb_link: string | null;
  guardian_name: string | null;
  parent_contact_num: string | null;
};

function fullName(p: Profile) {
  return [p.first_name, p.last_name].filter(Boolean).join(' ') || `Member ${p.school_id ?? '—'}`;
}

function statusChip(status: string | null) {
  const s = (status ?? '').toLowerCase();
  if (s === 'active') return <Chip tone="green">Active</Chip>;
  if (s === 'inactive') return <Chip tone="neutral">Inactive</Chip>;
  if (s === 'loa') return <Chip tone="amber">LOA</Chip>;
  if (s === 'alumni') return <Chip tone="neutral">Alumni</Chip>;
  return <Chip tone="neutral">{status ?? 'Unknown'}</Chip>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  const { theme } = useTheme();
  if (!value) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1.2, color: theme.dim, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 13.5, color: theme.ink }}>{value}</div>
    </div>
  );
}

function MemberDetailDrawer({ member, onClose }: { member: Profile; onClose: () => void }) {
  const { theme } = useTheme();
  const name = fullName(member);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }}
      />
      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 420,
          maxWidth: '95vw',
          background: theme.paper,
          zIndex: 50,
          boxShadow: '-12px 0 48px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '28px 28px 24px',
            background: theme.greenDark,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar
                member={{ id: member.school_id ?? 0, name, section: member.voice_section ?? '' }}
                size={52}
              />
              <div>
                <div style={{ fontFamily: FONTS.serif, fontSize: 20, fontWeight: 500 }}>{name}</div>
                {member.nickname && (
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>"{member.nickname}"</div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {member.voice_section && (
                    <span style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                      {member.voice_section}
                    </span>
                  )}
                  {member.school_id && (
                    <span style={{ fontSize: 11, fontFamily: FONTS.mono, opacity: 0.7 }}>
                      #{member.school_id}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 22, padding: 4, lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {statusChip(member.membership_status)}
            {member.current_term_stat && (
              <Chip tone="dark">{member.current_term_stat}</Chip>
            )}
            {member.committee && (
              <Chip tone="neutral">{member.committee}</Chip>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>

          {/* Personal */}
          <section>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 12 }}>
              Personal Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <InfoRow label="Full name" value={[member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ')} />
              <InfoRow label="Nickname" value={member.nickname} />
              <InfoRow label="Birthday" value={member.bday ? new Date(member.bday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null} />
              <InfoRow label="Mobile number" value={member.mobile_num} />
              <InfoRow label="DLSU email" value={member.email} />
              <InfoRow label="Alt. email" value={member.alternative_email} />
              <InfoRow label="Telegram" value={member.telegram_user ? `@${member.telegram_user}` : null} />
              <InfoRow label="Facebook" value={member.fb_link} />
            </div>
          </section>

          <div style={{ height: 1, background: theme.line }} />

          {/* Academic */}
          <section>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 12 }}>
              Academic Profile
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <InfoRow label="College" value={member.college} />
              <InfoRow label="Course" value={member.course_code} />
              <InfoRow label="Terms left" value={member.terms_left != null ? `${member.terms_left} terms` : null} />
              <InfoRow label="Last term GPA" value={member.last_term_gpa != null ? member.last_term_gpa.toFixed(2) : null} />
            </div>
          </section>

          <div style={{ height: 1, background: theme.line }} />

          {/* Chorale membership */}
          <section>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 12 }}>
              Chorale Membership
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <InfoRow label="Voice section" value={member.voice_section} />
              <InfoRow label="Committee" value={member.committee} />
              <InfoRow label="Entry date" value={member.entry_date ? new Date(member.entry_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null} />
              <InfoRow label="Longevity" value={member.longevity_terms != null ? `${member.longevity_terms} terms` : null} />
              <InfoRow label="Membership status" value={statusChip(member.membership_status)} />
              <InfoRow label="Term status" value={member.current_term_stat} />
            </div>
          </section>

          <div style={{ height: 1, background: theme.line }} />

          {/* Emergency contact */}
          {(member.guardian_name || member.parent_contact_num) && (
            <section>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 12 }}>
                Emergency Contact
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <InfoRow label="Guardian name" value={member.guardian_name} />
                <InfoRow label="Guardian contact" value={member.parent_contact_num} />
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function MembersFilterModal({
  onClose,
  filters,
  onApply,
  committees,
}: {
  onClose: () => void;
  filters: any;
  onApply: (f: any) => void;
  committees: string[];
}) {
  const { theme } = useTheme();
  const [local, setLocal] = useState(filters);

  const pill = (label: string, field: string, value: string) => (
    <button
      onClick={() => setLocal({ ...local, [field]: value })}
      style={{
        padding: '6px 14px',
        borderRadius: 20,
        border: `1px solid ${local[field] === value ? theme.green : theme.line}`,
        background: local[field] === value ? theme.green : 'transparent',
        color: local[field] === value ? '#fff' : theme.ink,
        fontSize: 13,
        cursor: 'pointer',
        fontFamily: FONTS.sans,
      }}
    >
      {label}
    </button>
  );

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.paper, borderRadius: 14, width: '100%', maxWidth: 500, border: `1px solid ${theme.line}`, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Members</div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>Filters</h3>
        </div>
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 8 }}>Section</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['All', 'Soprano', 'Alto', 'Tenor', 'Bass'].map(s => pill(s, 'section', s))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 8 }}>Committee</div>
            <select value={local.committee} onChange={e => setLocal({ ...local, committee: e.target.value })} style={{ width: '100%', padding: '11px 14px', border: `1px solid ${theme.lineDark}`, borderRadius: 10, fontSize: 14, background: theme.paper, color: theme.ink, outline: 'none' }}>
              <option value="All">All committees</option>
              {committees.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 8 }}>Membership status</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['All', 'active', 'inactive', 'loa'].map(s => pill(s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1), 'status', s))}
            </div>
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

const thStyle = { padding: '14px 16px', textAlign: 'left' as const, fontWeight: 500 };
const tdStyle = { padding: '11px 16px', verticalAlign: 'middle' as const };

export function AdminMembers() {
  const { theme } = useTheme();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [filters, setFilters] = useState({ section: 'All', committee: 'All', status: 'All' });
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, school_id, first_name, last_name, middle_name, nickname, email, alternative_email, voice_section, committee, membership_status, current_term_stat, bday, mobile_num, college, course_code, terms_left, longevity_terms, last_term_gpa, entry_date, telegram_user, fb_link, guardian_name, parent_contact_num')
      .order('last_name', { ascending: true });
    if (error) {
      console.error('[AdminMembers] Supabase error:', error);
      setFetchError(error.message);
    } else {
      setMembers((data ?? []) as Profile[]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const committees = [...new Set(members.map(m => m.committee).filter(Boolean) as string[])].sort();

  let filtered = members;
  if (filters.section !== 'All') filtered = filtered.filter(m => m.voice_section === filters.section);
  if (filters.committee !== 'All') filtered = filtered.filter(m => m.committee === filters.committee);
  if (filters.status !== 'All') filtered = filtered.filter(m => (m.membership_status ?? '').toLowerCase() === filters.status);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(m =>
      fullName(m).toLowerCase().includes(q) ||
      String(m.school_id ?? '').includes(q) ||
      (m.email ?? '').toLowerCase().includes(q) ||
      (m.nickname ?? '').toLowerCase().includes(q)
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Roster"
        title="Members"
        subtitle={`${filtered.length} of ${members.length} members`}
        actions={
          <Button variant="outline" icon="filter" onClick={() => setShowFilters(true)}>Filter</Button>
        }
      />

      {/* Search bar */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, ID, or email…"
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '10px 14px',
            border: `1px solid ${theme.lineDark}`,
            borderRadius: 10,
            fontSize: 13.5,
            fontFamily: FONTS.sans,
            background: theme.paper,
            color: theme.ink,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <Card pad={0}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: theme.dim, fontFamily: FONTS.mono, fontSize: 13, letterSpacing: 1 }}>
            Loading members…
          </div>
        ) : fetchError ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ color: '#dc2626', fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 0.5, marginBottom: 8 }}>
              Could not load profiles
            </div>
            <div style={{ color: theme.dim, fontSize: 13, marginBottom: 20, maxWidth: 420, margin: '0 auto 20px' }}>
              {fetchError}
            </div>
            <Button variant="outline" icon="refresh" onClick={load}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: theme.dim }}>
            No members match the current filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
              <thead>
                <tr style={{ background: theme.cream, fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: theme.dim }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Section</th>
                  <th style={thStyle}>Committee</th>
                  <th style={thStyle}>College</th>
                  <th style={thStyle}>GPA</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMember(m)}
                    style={{ borderTop: `1px solid ${theme.line}`, cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = theme.cream)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ ...tdStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar member={{ id: m.school_id ?? 0, name: fullName(m), section: m.voice_section ?? '' }} size={28} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{fullName(m)}</div>
                        {m.nickname && <div style={{ fontSize: 11, color: theme.dim }}>"{m.nickname}"</div>}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: FONTS.mono, color: theme.dim }}>{m.school_id ? `#${m.school_id}` : '—'}</td>
                    <td style={tdStyle}>{m.voice_section ? <SectionTag section={m.voice_section} /> : <span style={{ color: theme.dim }}>—</span>}</td>
                    <td style={{ ...tdStyle, color: m.committee ? theme.ink : theme.dim }}>{m.committee ?? '—'}</td>
                    <td style={{ ...tdStyle, fontSize: 12, color: theme.dim }}>{[m.college, m.course_code].filter(Boolean).join(' · ') || '—'}</td>
                    <td style={{ ...tdStyle, fontFamily: FONTS.mono, fontSize: 12 }}>
                      {m.last_term_gpa != null ? m.last_term_gpa.toFixed(2) : '—'}
                    </td>
                    <td style={tdStyle}>{statusChip(m.membership_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showFilters && (
        <MembersFilterModal onClose={() => setShowFilters(false)} filters={filters} onApply={setFilters} committees={committees} />
      )}
      {selectedMember && (
        <MemberDetailDrawer member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </>
  );
}
