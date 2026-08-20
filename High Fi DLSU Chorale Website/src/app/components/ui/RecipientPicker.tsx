import { useState } from 'react';
import { useTheme } from '../../App';
import { FONTS } from '../../theme';
import { Avatar } from './Avatar';
import { SectionTag } from './SectionTag';

// Shared recipient targeting used by announcement broadcasts and event/
// rehearsal created/cancelled notifications — all/section/specific-members.

export type RecipientMode = 'all' | 'section' | 'exec' | 'specific';
export type RecipientSelection = { mode: RecipientMode; section: string; memberIds: number[] };

export const DEFAULT_RECIPIENTS: RecipientSelection = { mode: 'all', section: 'Soprano', memberIds: [] };

export function resolveRecipients(sel: RecipientSelection, members: any[]): any[] {
  if (sel.mode === 'all') return members.filter((m: any) => !!m.email);
  if (sel.mode === 'section') return members.filter((m: any) => m.email && m.section === sel.section);
  if (sel.mode === 'exec') return members.filter((m: any) => m.email && m.exec);
  return members.filter((m: any) => m.email && sel.memberIds.includes(m.id));
}

export function RecipientPicker({
  value, onChange, members,
}: { value: RecipientSelection; onChange: (v: RecipientSelection) => void; members: any[] }) {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: `1px solid ${theme.lineDark}`,
    borderRadius: 8, fontSize: 13, fontFamily: FONTS.sans, background: theme.paper,
    color: theme.ink, outline: 'none', boxSizing: 'border-box' as const,
  };
  const labelStyle = {
    fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim,
    textTransform: 'uppercase' as const, display: 'block', marginBottom: 5,
  };

  const modeBtn = (mode: RecipientMode, label: string) => (
    <button
      key={mode}
      onClick={() => onChange({ ...value, mode })}
      style={{
        padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontFamily: FONTS.sans,
        border: `1px solid ${value.mode === mode ? theme.green : theme.lineDark}`,
        background: value.mode === mode ? theme.green : theme.paper,
        color: value.mode === mode ? '#fff' : theme.ink,
      }}
    >
      {label}
    </button>
  );

  const filteredMembers = members.filter((m: any) =>
    search.trim() === '' || m.name?.toLowerCase().includes(search.trim().toLowerCase()) || String(m.id).includes(search.trim())
  );

  const toggleMember = (id: number) => {
    const has = value.memberIds.includes(id);
    onChange({ ...value, memberIds: has ? value.memberIds.filter(x => x !== id) : [...value.memberIds, id] });
  };

  const count = resolveRecipients(value, members).length;

  return (
    <div>
      <label style={labelStyle}>Recipients ({count})</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {modeBtn('all', `All members (${members.filter((m: any) => m.email).length})`)}
        {modeBtn('section', 'By section')}
        {modeBtn('exec', `Exec board (${members.filter((m: any) => m.email && m.exec).length})`)}
        {modeBtn('specific', 'Specific members')}
      </div>

      {value.mode === 'section' && (
        <select value={value.section} onChange={e => onChange({ ...value, section: e.target.value })} style={{ ...inputStyle, marginBottom: 4 }}>
          {['Soprano', 'Alto', 'Tenor', 'Bass'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}

      {value.mode === 'specific' && (
        <div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID…" style={{ ...inputStyle, marginBottom: 8 }} />
          <div style={{ border: `1px solid ${theme.line}`, borderRadius: 8, maxHeight: 200, overflowY: 'auto' }}>
            {filteredMembers.length === 0 ? (
              <div style={{ padding: 14, fontSize: 12.5, color: theme.dim, textAlign: 'center' }}>No members match.</div>
            ) : filteredMembers.map((m: any) => (
              <label
                key={m.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer',
                  borderTop: `1px solid ${theme.line}`, background: value.memberIds.includes(m.id) ? theme.greenSoft : 'transparent',
                }}
              >
                <input type="checkbox" checked={value.memberIds.includes(m.id)} onChange={() => toggleMember(m.id)} />
                <Avatar member={m} size={22} />
                <span style={{ fontSize: 12.5, flex: 1 }}>{m.name}</span>
                <SectionTag section={m.section} />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
