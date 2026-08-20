import { useState, useEffect } from 'react';
import { useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { SectionTag } from '../ui/SectionTag';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';
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
  is_admin: boolean;
};

function fullName(p: Profile) {
  return [p.first_name, p.last_name].filter(Boolean).join(' ') || `Member ${p.school_id ?? '—'}`;
}

function statusChip(status: string | null) {
  if (status === 'Senior Member') return <Chip tone="green">Senior Member</Chip>;
  if (status === 'Junior Member') return <Chip tone="blue">Junior Member</Chip>;
  if (status === 'Trainee') return <Chip tone="amber">Trainee</Chip>;
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

function EditField({
  label, value, onChange, placeholder, style,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; style: React.CSSProperties }) {
  const { theme } = useTheme();
  return (
    <div>
      <div style={{ fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1.2, color: theme.dim, textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />
    </div>
  );
}

const VOICE_SECTIONS = ['Soprano', 'Alto', 'Tenor', 'Bass'];
const MEMBERSHIP_STATUSES = ['Trainee', 'Junior Member', 'Senior Member'];

const EDITABLE_PROFILE_FIELDS = [
  'first_name', 'last_name', 'middle_name', 'nickname',
  'email', 'alternative_email', 'mobile_num',
  'voice_section', 'committee', 'membership_status',
  'college', 'course_code',
  'is_admin',
] as const;

type EditableForm = Pick<Profile, typeof EDITABLE_PROFILE_FIELDS[number]>;

function formFromMember(member: Profile): EditableForm {
  return {
    first_name: member.first_name ?? '',
    last_name: member.last_name ?? '',
    middle_name: member.middle_name ?? '',
    nickname: member.nickname ?? '',
    email: member.email ?? '',
    alternative_email: member.alternative_email ?? '',
    mobile_num: member.mobile_num ?? '',
    voice_section: member.voice_section ?? '',
    committee: member.committee ?? '',
    membership_status: member.membership_status ?? '',
    college: member.college ?? '',
    course_code: member.course_code ?? '',
    is_admin: member.is_admin ?? false,
  };
}

function MemberDetailDrawer({ member, onClose, onSave }: { member: Profile; onClose: () => void; onSave: (patch: Partial<Profile>) => Promise<void> }) {
  const { theme } = useTheme();
  const name = fullName(member);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditableForm>(() => formFromMember(member));
  const set = <K extends keyof EditableForm>(k: K, v: EditableForm[K]) => setForm(prev => ({ ...prev, [k]: v }));

  const editSelectStyle = { width: '100%', padding: '9px 12px', border: `1px solid ${theme.lineDark}`, borderRadius: 8, fontSize: 13.5, background: theme.paper, color: theme.ink, outline: 'none' as const, boxSizing: 'border-box' as const };

  const handleSave = async () => {
    setSaving(true);
    const patch: Partial<Profile> = {
      first_name: form.first_name.trim() || null,
      last_name: form.last_name.trim() || null,
      middle_name: form.middle_name.trim() || null,
      nickname: form.nickname.trim() || null,
      email: form.email.trim() || null,
      alternative_email: form.alternative_email.trim() || null,
      mobile_num: form.mobile_num.trim() || null,
      voice_section: form.voice_section || null,
      committee: form.committee || null,
      membership_status: form.membership_status || null,
      college: form.college.trim() || null,
      course_code: form.course_code.trim() || null,
      is_admin: form.is_admin,
    };
    await onSave(patch);
    setSaving(false);
    setEditing(false);
  };

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  title="Edit member details"
                  style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center' }}
                >
                  <Icon name="edit" size={15} />
                </button>
              )}
              <button
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 22, padding: 4, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
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

          {editing && (
            <div style={{ fontSize: 10.5, fontFamily: FONTS.mono, color: theme.amber, textTransform: 'uppercase', letterSpacing: 1 }}>Editing</div>
          )}

          {/* Personal */}
          <section>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 12 }}>
              Personal Information
            </div>
            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <EditField label="First name" value={form.first_name} onChange={v => set('first_name', v)} style={editSelectStyle} />
                <EditField label="Last name" value={form.last_name} onChange={v => set('last_name', v)} style={editSelectStyle} />
                <EditField label="Middle name" value={form.middle_name} onChange={v => set('middle_name', v)} style={editSelectStyle} />
                <EditField label="Nickname" value={form.nickname} onChange={v => set('nickname', v)} style={editSelectStyle} />
                <EditField label="DLSU email" value={form.email} onChange={v => set('email', v)} style={editSelectStyle} />
                <EditField label="Alt. email" value={form.alternative_email} onChange={v => set('alternative_email', v)} style={editSelectStyle} />
                <EditField label="Mobile number" value={form.mobile_num} onChange={v => set('mobile_num', v)} style={editSelectStyle} />
                <InfoRow label="Birthday" value={member.bday ? new Date(member.bday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null} />
              </div>
            ) : (
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
            )}
          </section>

          <div style={{ height: 1, background: theme.line }} />

          {/* Academic */}
          <section>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 12 }}>
              Academic Profile
            </div>
            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <EditField label="College" value={form.college} onChange={v => set('college', v)} style={editSelectStyle} />
                <EditField label="Course" value={form.course_code} onChange={v => set('course_code', v)} style={editSelectStyle} />
                <InfoRow label="Terms left" value={member.terms_left != null ? `${member.terms_left} terms` : null} />
                <InfoRow label="Last term GPA" value={member.last_term_gpa != null ? member.last_term_gpa.toFixed(2) : null} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <InfoRow label="College" value={member.college} />
                <InfoRow label="Course" value={member.course_code} />
                <InfoRow label="Terms left" value={member.terms_left != null ? `${member.terms_left} terms` : null} />
                <InfoRow label="Last term GPA" value={member.last_term_gpa != null ? member.last_term_gpa.toFixed(2) : null} />
              </div>
            )}
          </section>

          <div style={{ height: 1, background: theme.line }} />

          {/* Chorale membership */}
          <section>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 12 }}>
              Chorale Membership
            </div>
            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1.2, color: theme.dim, textTransform: 'uppercase', marginBottom: 4 }}>Voice section</div>
                  <select value={form.voice_section} onChange={e => set('voice_section', e.target.value)} style={editSelectStyle}>
                    <option value="">Unassigned</option>
                    {VOICE_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <EditField label="Committee" value={form.committee} onChange={v => set('committee', v)} placeholder="e.g. Music" style={editSelectStyle} />
                <InfoRow label="Entry date" value={member.entry_date ? new Date(member.entry_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null} />
                <InfoRow label="Longevity" value={member.longevity_terms != null ? `${member.longevity_terms} terms` : null} />
                <div>
                  <div style={{ fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1.2, color: theme.dim, textTransform: 'uppercase', marginBottom: 4 }}>Membership status</div>
                  <select value={form.membership_status} onChange={e => set('membership_status', e.target.value)} style={editSelectStyle}>
                    {MEMBERSHIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <InfoRow label="Term status" value={member.current_term_stat} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <InfoRow label="Voice section" value={member.voice_section} />
                <InfoRow label="Committee" value={member.committee} />
                <InfoRow label="Entry date" value={member.entry_date ? new Date(member.entry_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null} />
                <InfoRow label="Longevity" value={member.longevity_terms != null ? `${member.longevity_terms} terms` : null} />
                <InfoRow label="Membership status" value={statusChip(member.membership_status)} />
                <InfoRow label="Term status" value={member.current_term_stat} />
              </div>
            )}
          </section>

          <div style={{ height: 1, background: theme.line }} />

          {/* Access */}
          <section>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 12 }}>
              Access
            </div>
            {editing ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_admin} onChange={e => set('is_admin', e.target.checked)} />
                Admin — can access the admin console in addition to the member portal
              </label>
            ) : (
              <InfoRow label="Role" value={member.is_admin ? <Chip tone="green">Admin</Chip> : <Chip tone="neutral">Member</Chip>} />
            )}
          </section>

          {editing && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button
                variant="ghost"
                onClick={() => {
                  setForm(formFromMember(member));
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button icon="check" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          )}

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
              {['All', 'Trainee', 'Junior Member', 'Senior Member'].map(s => pill(s, 'status', s))}
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

type NewMemberForm = {
  school_id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  nickname: string;
  voice_section: string;
  committee: string;
  membership_status: string;
  college: string;
  course_code: string;
  is_admin: boolean;
};

const EMPTY_NEW_MEMBER: NewMemberForm = {
  school_id: '', email: '', first_name: '', last_name: '', middle_name: '', nickname: '',
  voice_section: '', committee: '', membership_status: 'Trainee', college: '', course_code: '',
  is_admin: false,
};

function AddMemberModal({ onClose, onCreate }: { onClose: () => void; onCreate: (form: NewMemberForm) => Promise<string | null> }) {
  const { theme } = useTheme();
  const [form, setForm] = useState<NewMemberForm>(EMPTY_NEW_MEMBER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof NewMemberForm>(k: K, v: NewMemberForm[K]) => setForm(prev => ({ ...prev, [k]: v }));

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: `1px solid ${theme.lineDark}`,
    borderRadius: 8, fontSize: 13.5, fontFamily: FONTS.sans, background: theme.paper,
    color: theme.ink, outline: 'none', boxSizing: 'border-box' as const,
  };
  const labelStyle = {
    fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim,
    textTransform: 'uppercase' as const, display: 'block', marginBottom: 5,
  };

  const handleSubmit = async () => {
    const schoolId = Number(form.school_id.trim());
    if (!schoolId || !Number.isFinite(schoolId)) { setError('Enter a valid ID number.'); return; }
    if (!form.email.trim()) { setError('Enter a DLSU email.'); return; }
    if (!form.first_name.trim() || !form.last_name.trim()) { setError('Enter first and last name.'); return; }
    setError('');
    setSaving(true);
    const err = await onCreate(form);
    setSaving(false);
    if (err) setError(err);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.paper, color: theme.ink, borderRadius: 14, width: 560, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${theme.line}` }}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Members</div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>Add member</h3>
          <p style={{ fontSize: 12.5, color: theme.dim, margin: '6px 0 0' }}>
            Creates their directory entry and profile. They'll log in with this ID and email, then set their own password and security questions.
          </p>
        </div>

        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>ID number *</label>
              <input value={form.school_id} onChange={e => set('school_id', e.target.value)} placeholder="e.g. 12100234" inputMode="numeric" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>DLSU email *</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="name_surname@dlsu.edu.ph" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>First name *</label>
              <input value={form.first_name} onChange={e => set('first_name', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Last name *</label>
              <input value={form.last_name} onChange={e => set('last_name', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Middle name</label>
              <input value={form.middle_name} onChange={e => set('middle_name', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nickname</label>
              <input value={form.nickname} onChange={e => set('nickname', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Voice section</label>
              <select value={form.voice_section} onChange={e => set('voice_section', e.target.value)} style={inputStyle}>
                <option value="">Unassigned</option>
                {VOICE_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Membership status</label>
              <select value={form.membership_status} onChange={e => set('membership_status', e.target.value)} style={inputStyle}>
                {MEMBERSHIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Committee</label>
              <input value={form.committee} onChange={e => set('committee', e.target.value)} placeholder="e.g. Music" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>College</label>
              <input value={form.college} onChange={e => set('college', e.target.value)} placeholder="e.g. CCS" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Course code</label>
            <input value={form.course_code} onChange={e => set('course_code', e.target.value)} placeholder="e.g. BSCS" style={{ ...inputStyle, maxWidth: 200 }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_admin} onChange={e => set('is_admin', e.target.checked)} />
            Admin — can access the admin console in addition to the member portal
          </label>

          {error && <div style={{ fontSize: 12, color: theme.red }}>{error}</div>}
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'flex-end', gap: 10, background: theme.cream }}>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button icon="check" onClick={handleSubmit} disabled={saving}>{saving ? 'Adding…' : 'Add member'}</Button>
        </div>
      </div>
    </div>
  );
}

const thStyle = { padding: '14px 16px', textAlign: 'left' as const, fontWeight: 500 };
const tdStyle = { padding: '11px 16px', verticalAlign: 'middle' as const };

export function AdminMembers() {
  const { theme } = useTheme();
  const app = useApp();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [filters, setFilters] = useState({ section: 'All', committee: 'All', status: 'All' });
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, school_id, first_name, last_name, middle_name, nickname, email, alternative_email, voice_section, committee, membership_status, current_term_stat, bday, mobile_num, college, course_code, terms_left, longevity_terms, last_term_gpa, entry_date, telegram_user, fb_link, guardian_name, parent_contact_num, is_admin')
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

  // Pre-provisions both tables Login.tsx checks on first sign-in: directory
  // (the ID+email gate) and profiles (password_hash left null, which is what
  // routes a first-time login into the "set your password" flow — same as
  // every existing member, no separate invite mechanism needed).
  async function handleCreateMember(form: NewMemberForm): Promise<string | null> {
    const schoolId = Number(form.school_id.trim());
    const email = form.email.trim().toLowerCase();

    const { data: existing } = await supabase.from('directory').select('school_id').eq('school_id', schoolId).maybeSingle();
    if (existing) return 'This ID number is already registered.';

    const { error: dirErr } = await supabase.from('directory').insert({ school_id: schoolId, email });
    if (dirErr) return `Could not create directory entry: ${dirErr.message}`;

    const { error: profErr } = await supabase.from('profiles').insert({
      school_id: schoolId,
      email,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      middle_name: form.middle_name.trim() || null,
      nickname: form.nickname.trim() || null,
      voice_section: form.voice_section || null,
      committee: form.committee.trim() || null,
      membership_status: form.membership_status || 'Trainee',
      current_term_stat: 'Active',
      college: form.college.trim() || null,
      course_code: form.course_code.trim() || null,
      is_admin: form.is_admin,
    });
    if (profErr) {
      // Directory row would otherwise dangle with no profile behind it.
      await supabase.from('directory').delete().eq('school_id', schoolId);
      return `Could not create profile: ${profErr.message}`;
    }

    app.showToast(`Added ${form.first_name} ${form.last_name} — they can now log in with their ID and email to set up their account.`);
    setShowAddMember(false);
    await load();
    return null;
  }

  const committees = [...new Set(members.map(m => m.committee).filter(Boolean) as string[])].sort();

  let filtered = members;
  if (filters.section !== 'All') filtered = filtered.filter(m => m.voice_section === filters.section);
  if (filters.committee !== 'All') filtered = filtered.filter(m => m.committee === filters.committee);
  if (filters.status !== 'All') filtered = filtered.filter(m => m.membership_status === filters.status);
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
          <>
            <Button variant="outline" icon="filter" onClick={() => setShowFilters(true)}>Filter</Button>
            <Button icon="plus" onClick={() => setShowAddMember(true)}>Add Member</Button>
          </>
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
      {showAddMember && (
        <AddMemberModal onClose={() => setShowAddMember(false)} onCreate={handleCreateMember} />
      )}
      {selectedMember && (
        <MemberDetailDrawer
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onSave={async (patch) => {
            const { error } = await supabase.from('profiles').update(patch).eq('id', selectedMember.id);
            if (error) {
              app.showToast('Failed to save member details', 'error');
              return;
            }
            const updated = { ...selectedMember, ...patch };
            setMembers(prev => prev.map(m => (m.id === selectedMember.id ? updated : m)));
            setSelectedMember(updated);
            app.showToast('Member details updated');
          }}
        />
      )}
    </>
  );
}
