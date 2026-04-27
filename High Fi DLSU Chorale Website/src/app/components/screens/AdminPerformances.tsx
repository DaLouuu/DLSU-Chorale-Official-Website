import { useState } from 'react';
import { useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { Field } from '../ui/Field';
import { MEMBERS } from '../../data';
import { downloadCSV } from '../../utils/exportCsv';

type FormField = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'file' | 'checkbox';
  required?: boolean;
};

type FormConfig = {
  enabled: boolean;
  title: string;
  description?: string;
  fields: FormField[];
};

type Event = {
  id: string;
  name: string;
  type: string;
  category?: string;
  date: string;
  venue: string;
  image: string;
  signedUp: number;
  castSize: number;
  signupDeadline: string;
  forms?: {
    waiver?: FormConfig;
    excuse?: FormConfig;
  };
};

// Performance categories used for filtering
const PERF_CATEGORIES = ['Competition', 'Festival', 'Production', 'Performance Request'];

// Map legacy type values to display labels
function categoryLabel(ev: Event): string {
  if (ev.category) return ev.category;
  if (PERF_CATEGORIES.includes(ev.type)) return ev.type;
  return ev.type; // Rehearsal, Workshop, etc.
}

// Chip tone per category
function categoryChip(ev: Event) {
  const label = categoryLabel(ev);
  const toneMap: Record<string, 'green' | 'amber' | 'blue' | 'red' | 'neutral' | 'dark'> = {
    Competition: 'red',
    Festival: 'amber',
    Production: 'blue',
    'Performance Request': 'green',
    Rehearsal: 'neutral',
    Workshop: 'neutral',
    Performance: 'dark',
  };
  return <Chip tone={toneMap[label] ?? 'neutral'}>{label}</Chip>;
}

function CreateEventModal({ onClose, onCreate }: { onClose: () => void; onCreate: (event: any) => void }) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [eventKind, setEventKind] = useState<'performance' | 'rehearsal' | 'workshop'>('performance');
  const [category, setCategory] = useState('Competition');
  const [date, setDate] = useState('');
  const [callTime, setCallTime] = useState('');
  const [venue, setVenue] = useState('');
  const [attire, setAttire] = useState('');
  const [castSize, setCastSize] = useState('');
  const [signupDeadline, setSignupDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [requireWaiver, setRequireWaiver] = useState(false);
  const [requireExcuse, setRequireExcuse] = useState(false);

  const handleCreate = () => {
    const forms: any = {};
    if (requireWaiver) {
      forms.waiver = {
        enabled: true,
        title: 'Campus Waiver Form',
        description: 'Required for all participants.',
        fields: [
          { id: 'f1', label: 'Student ID Number', type: 'text', required: true },
          { id: 'f2', label: 'Emergency contact name', type: 'text', required: true },
          { id: 'f3', label: 'Emergency contact number', type: 'text', required: true },
          { id: 'f4', label: 'I agree to the terms and conditions of participation', type: 'checkbox', required: true },
        ],
      };
    }
    if (requireExcuse) {
      forms.excuse = {
        enabled: true,
        title: 'Excused Absence Form',
        description: 'If you cannot attend certain rehearsals, submit this form for approval.',
        fields: [
          { id: 'e1', label: 'Date(s) you will be absent', type: 'date', required: true },
          { id: 'e2', label: 'Reason for absence', type: 'textarea', required: true },
          { id: 'e3', label: 'Supporting document', type: 'file', required: false },
        ],
      };
    }
    const type = eventKind === 'performance' ? category : eventKind === 'rehearsal' ? 'Rehearsal' : 'Workshop';
    onCreate({
      id: 'e' + Date.now(),
      name, type,
      category: eventKind === 'performance' ? category : undefined,
      date, callTime, venue, attire,
      castSize: Number(castSize), signupDeadline, description,
      signedUp: 0, repertoire: [], image: '',
      forms: Object.keys(forms).length > 0 ? forms : undefined,
    });
    onClose();
  };

  const modalInput: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: `1px solid ${theme.lineDark}`,
    borderRadius: 10, fontSize: 14, fontFamily: FONTS.sans, background: theme.paper,
    color: theme.ink, outline: 'none', boxSizing: 'border-box',
  };

  const kindPill = (k: typeof eventKind, label: string) => (
    <button
      onClick={() => setEventKind(k)}
      style={{
        flex: 1, padding: '9px 8px', border: 'none',
        background: eventKind === k ? theme.green : theme.paper,
        color: eventKind === k ? '#fff' : theme.ink,
        fontSize: 13, fontFamily: FONTS.sans, cursor: 'pointer',
        borderRight: k !== 'workshop' ? `1px solid ${theme.line}` : 'none',
      }}
    >
      {label}
    </button>
  );

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.paper, borderRadius: 14, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${theme.line}` }}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Performance Management</div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>Create new event</h3>
        </div>

        <div style={{ padding: 28, display: 'grid', gap: 16 }}>
          {/* Kind selector */}
          <div>
            <div style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 8 }}>Event Kind</div>
            <div style={{ display: 'flex', border: `1px solid ${theme.line}`, borderRadius: 10, overflow: 'hidden' }}>
              {kindPill('performance', 'Performance')}
              {kindPill('rehearsal', 'Rehearsal')}
              {kindPill('workshop', 'Workshop')}
            </div>
          </div>

          {/* Category — only for performances */}
          {eventKind === 'performance' && (
            <div>
              <div style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 8 }}>Category</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PERF_CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    style={{
                      padding: '7px 16px', borderRadius: 20, fontSize: 13, fontFamily: FONTS.sans, cursor: 'pointer',
                      border: `1.5px solid ${category === c ? theme.green : theme.line}`,
                      background: category === c ? theme.green : 'transparent',
                      color: category === c ? '#fff' : theme.ink,
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <Field label="Event name" value={name} onChange={(e: any) => setName(e.target.value)} placeholder="e.g. Christmas Concert 2026" />
            <Field label="Date" type="date" value={date} onChange={(e: any) => setDate(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Call time" type="time" value={callTime} onChange={(e: any) => setCallTime(e.target.value)} />
            <Field label="Signup deadline" type="date" value={signupDeadline} onChange={(e: any) => setSignupDeadline(e.target.value)} />
          </div>

          <Field label="Venue" value={venue} onChange={(e: any) => setVenue(e.target.value)} placeholder="e.g. Teresa Yuchengco Auditorium" />

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <Field label="Attire" value={attire} onChange={(e: any) => setAttire(e.target.value)} placeholder="e.g. Formal Filipiniana" />
            <Field label="Cast size" type="number" value={castSize} onChange={(e: any) => setCastSize(e.target.value)} placeholder="e.g. 40" />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Brief description…" style={{ ...modalInput, resize: 'vertical' }} />
          </div>

          <div style={{ paddingTop: 16, borderTop: `1px solid ${theme.line}` }}>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Required forms</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'waiver', state: requireWaiver, set: setRequireWaiver, title: 'Campus Waiver Form', sub: 'Require participants to submit waiver before confirming sign-up' },
                { key: 'excuse', state: requireExcuse, set: setRequireExcuse, title: 'Excused Absence Form', sub: 'Allow participants to pre-submit excuses for rehearsals' },
              ].map(({ key, state, set, title, sub }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, padding: 12, background: theme.cream, borderRadius: 8, cursor: 'pointer', border: `1px solid ${state ? theme.green : theme.line}` }}>
                  <input type="checkbox" checked={state} onChange={e => set(e.target.checked)} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{title}</div>
                    <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>{sub}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'space-between', gap: 10, background: theme.cream }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="check" onClick={handleCreate} disabled={!name || !date || !venue}>Create event</Button>
        </div>
      </div>
    </div>
  );
}

function MessageModal({ event, onClose }: { event: Event; onClose: () => void }) {
  const { theme } = useTheme();
  const app = useApp();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const modalInput: React.CSSProperties = { width: '100%', padding: '11px 14px', border: `1px solid ${theme.lineDark}`, borderRadius: 10, fontSize: 14, fontFamily: FONTS.sans, background: theme.paper, color: theme.ink, outline: 'none', boxSizing: 'border-box' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.paper, borderRadius: 14, width: '100%', maxWidth: 650, maxHeight: '85vh', overflowY: 'auto', border: `1px solid ${theme.line}` }}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Message Participants · {event.name}</div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>Send email to roster</h3>
          <p style={{ fontSize: 13, color: theme.dim, margin: '6px 0 0' }}>This message will be sent to all {event.signedUp} participants.</p>
        </div>
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Subject line" value={subject} onChange={(e: any) => setSubject(e.target.value)} placeholder="e.g. Rehearsal schedule update" />
          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Message body</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={8} placeholder="Write your message here..." style={{ ...modalInput, resize: 'vertical' }} />
          </div>
          <div style={{ padding: 14, background: theme.blueSoft, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="info" size={16} stroke={theme.blue} />
            <div style={{ fontSize: 12, color: theme.ink }}>Recipients will receive this at their registered DLSU email addresses.</div>
          </div>
        </div>
        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'space-between', gap: 10, background: theme.cream }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="mail" onClick={() => { app.showToast(`Message sent to ${event.signedUp} participants`); onClose(); }} disabled={!subject || !message}>
            Send to {event.signedUp} participants
          </Button>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  const { theme } = useTheme();
  return (
    <div style={{ padding: 14, background: theme.cream, borderRadius: 10 }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 1.3, color: theme.dim, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 500, marginTop: 4, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: theme.dim, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function FormBuilder({ event }: { event: Event }) {
  const app = useApp();
  const { theme } = useTheme();
  const defaults = {
    waiver: { enabled: false, title: 'Campus Waiver Form', description: '', fields: [] as FormField[] },
    excuse: { enabled: false, title: 'Excused Absence Form', description: '', fields: [] as FormField[] },
  };
  const forms = event.forms || defaults;
  const [active, setActive] = useState<'waiver' | 'excuse'>('waiver');
  const form = forms[active] || defaults[active];

  const save = (next: Partial<FormConfig>) => app.updateEventForms(event.id, { ...forms, [active]: { ...form, ...next } });
  const updateField = (fid: string, patch: Partial<FormField>) => save({ fields: form.fields.map(f => f.id === fid ? { ...f, ...patch } : f) });
  const removeField = (fid: string) => save({ fields: form.fields.filter(f => f.id !== fid) });
  const addField = () => save({ fields: [...form.fields, { id: 'f' + Date.now(), label: 'New field', type: 'text', required: false }] });
  const moveField = (idx: number, dir: number) => {
    const next = [...form.fields]; const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]]; save({ fields: next });
  };

  const fbInput: React.CSSProperties = { width: '100%', padding: '8px 10px', border: `1px solid ${theme.line}`, borderRadius: 6, fontSize: 13, fontFamily: FONTS.sans, background: theme.paper, color: theme.ink, outline: 'none', boxSizing: 'border-box' };
  const arrowBtn: React.CSSProperties = { width: 20, height: 16, background: theme.paper, border: `1px solid ${theme.line}`, borderRadius: 4, cursor: 'pointer', fontSize: 9, color: theme.dim, padding: 0, lineHeight: 1 };

  return (
    <div style={{ marginBottom: 24, border: `1px solid ${theme.line}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: theme.cream, borderBottom: `1px solid ${theme.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Icon name="ticket" size={16} />
          <div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 16, fontWeight: 500 }}>Custom forms</div>
            <div style={{ fontSize: 11.5, color: theme.dim, fontFamily: FONTS.mono, letterSpacing: 0.3, marginTop: 2 }}>Define fields members must fill when signing up</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 3, background: theme.paper, border: `1px solid ${theme.line}`, borderRadius: 8 }}>
          {(['waiver', 'excuse'] as const).map(k => (
            <button key={k} onClick={() => setActive(k)} style={{ padding: '6px 12px', fontSize: 12, fontFamily: FONTS.sans, cursor: 'pointer', background: active === k ? theme.green : 'transparent', color: active === k ? '#fff' : theme.ink, border: 'none', borderRadius: 6 }}>
              {k === 'waiver' ? 'Waiver' : 'Excused absence'}{forms[k]?.enabled ? ' ●' : ''}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: 18, background: theme.paper }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!form.enabled} onChange={e => save({ enabled: e.target.checked })} style={{ width: 16, height: 16 }} />
          <span style={{ fontWeight: 500 }}>Require this form on sign-up</span>
          <span style={{ color: theme.dim, fontSize: 12 }}>— members must submit before their seat is confirmed</span>
        </label>
        {form.enabled && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 10.5, fontFamily: FONTS.mono, letterSpacing: 1.3, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Form title</label>
                <input value={form.title} onChange={e => save({ title: e.target.value })} style={fbInput} />
              </div>
              <div>
                <label style={{ fontSize: 10.5, fontFamily: FONTS.mono, letterSpacing: 1.3, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Description</label>
                <input value={form.description || ''} onChange={e => save({ description: e.target.value })} placeholder="e.g. Required for all BCFC participants." style={fbInput} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1.5, color: theme.dim, textTransform: 'uppercase' }}>Fields · {form.fields.length}</div>
              <Button size="sm" variant="outline" icon="plus" onClick={addField}>Add field</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {form.fields.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: theme.dim, fontSize: 13, border: `1px dashed ${theme.line}`, borderRadius: 10 }}>
                  No fields yet. Click <strong>Add field</strong> to start building the form.
                </div>
              )}
              {form.fields.map((f, i) => (
                <div key={f.id} style={{ display: 'grid', gridTemplateColumns: 'auto 2fr 130px auto auto', gap: 10, alignItems: 'center', padding: 10, background: theme.cream, borderRadius: 10, border: `1px solid ${theme.line}` }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button onClick={() => moveField(i, -1)} disabled={i === 0} style={arrowBtn}>▲</button>
                    <button onClick={() => moveField(i, 1)} disabled={i === form.fields.length - 1} style={arrowBtn}>▼</button>
                  </div>
                  <input value={f.label} onChange={e => updateField(f.id, { label: e.target.value })} placeholder="Field label" style={{ ...fbInput, background: theme.paper }} />
                  <select value={f.type} onChange={e => updateField(f.id, { type: e.target.value as FormField['type'] })} style={{ ...fbInput, background: theme.paper }}>
                    <option value="text">Short text</option>
                    <option value="textarea">Long text</option>
                    <option value="date">Date</option>
                    <option value="number">Number</option>
                    <option value="checkbox">Checkbox / consent</option>
                    <option value="file">File upload</option>
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: theme.dim, cursor: 'pointer' }}>
                    <input type="checkbox" checked={f.required} onChange={e => updateField(f.id, { required: e.target.checked })} />
                    Required
                  </label>
                  <button onClick={() => removeField(f.id)} style={{ background: 'transparent', border: 'none', color: theme.red, cursor: 'pointer', fontSize: 16, padding: 6 }}>×</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const ALL_FILTER = 'All';
const FILTER_TABS = [ALL_FILTER, ...PERF_CATEGORIES, 'Rehearsal', 'Workshop'];

export function AdminPerformances() {
  const app = useApp();
  const { theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState(ALL_FILTER);
  const [showCreate, setShowCreate] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const allEvents = app.events as Event[];
  const filtered = activeFilter === ALL_FILTER
    ? allEvents
    : allEvents.filter(e => categoryLabel(e) === activeFilter || e.type === activeFilter);

  const [selected, setSelected] = useState<string>(filtered[0]?.id ?? allEvents[0]?.id ?? '');
  const ev = allEvents.find(e => e.id === selected) ?? allEvents[0];

  // Keep selected valid when filter changes
  const visibleIds = new Set(filtered.map(e => e.id));
  const displaySelected = visibleIds.has(selected) ? selected : filtered[0]?.id ?? '';
  const displayEv = allEvents.find(e => e.id === displaySelected) ?? allEvents[0];

  const handleCreate = (event: any) => {
    app.showToast(`Event created: ${event.name}`);
  };

  const handleExportRoster = () => {
    if (!displayEv) return;
    const participants = MEMBERS.slice(0, displayEv.signedUp);
    const rows = [
      ['Name', 'Student ID', 'Voice Section', 'Status'],
      ...participants.map((m: any) => [m.name, m.id, m.section || '', 'Confirmed']),
    ];
    const safeName = displayEv.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    downloadCSV(`${safeName}-roster-${displayEv.date}`, rows);
  };

  if (!displayEv) return null;

  return (
    <>
      <PageHeader
        eyebrow="Performance Management"
        title="Performances"
        subtitle="Track sign-ups, manage rosters, broadcast updates to participants."
        actions={<Button icon="plus" onClick={() => setShowCreate(true)}>Create event</Button>}
      />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveFilter(tab);
              const nextFiltered = tab === ALL_FILTER
                ? allEvents
                : allEvents.filter(e => categoryLabel(e) === tab || e.type === tab);
              if (nextFiltered.length > 0) setSelected(nextFiltered[0].id);
            }}
            style={{
              padding: '7px 16px',
              borderRadius: 20,
              border: `1.5px solid ${activeFilter === tab ? theme.green : theme.line}`,
              background: activeFilter === tab ? theme.green : theme.paper,
              color: activeFilter === tab ? '#fff' : theme.ink,
              fontSize: 12.5,
              fontFamily: FONTS.sans,
              cursor: 'pointer',
              fontWeight: activeFilter === tab ? 500 : 400,
            }}
          >
            {tab}
            {tab !== ALL_FILTER && (
              <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 11 }}>
                ({(tab === ALL_FILTER ? allEvents : allEvents.filter(e => categoryLabel(e) === tab || e.type === tab)).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Event list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: theme.dim, fontSize: 13, border: `1px dashed ${theme.line}`, borderRadius: 12 }}>
              No {activeFilter !== ALL_FILTER ? activeFilter : ''} events yet.
            </div>
          ) : (
            filtered.map(e => (
              <button
                key={e.id}
                onClick={() => setSelected(e.id)}
                style={{
                  textAlign: 'left', padding: 0, border: `1.5px solid ${displaySelected === e.id ? theme.green : theme.line}`,
                  background: theme.paper, borderRadius: 12, cursor: 'pointer', overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: e.image ? `url(${e.image}) center/cover` : theme.greenDark, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!e.image && <Icon name="music" size={18} stroke="rgba(255,255,255,0.5)" />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, fontFamily: FONTS.sans, lineHeight: 1.3 }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: theme.dim, fontFamily: FONTS.mono, marginTop: 3 }}>
                      {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()} · {e.signedUp}/{e.castSize}
                    </div>
                    <div style={{ marginTop: 4 }}>{categoryChip(e)}</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Event detail */}
        <Card pad={0}>
          <div
            style={{
              height: 180,
              backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.55), transparent), url(${displayEv.image})`,
              background: displayEv.image ? undefined : `linear-gradient(135deg, ${theme.greenDark}, ${theme.green})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'flex-end',
              padding: 24,
              color: '#fff',
            }}
          >
            <div>
              {categoryChip(displayEv)}
              <div style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 500, marginTop: 8 }}>{displayEv.name}</div>
              <div style={{ fontSize: 12.5, opacity: 0.85, fontFamily: FONTS.mono, marginTop: 4 }}>
                {new Date(displayEv.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()} · {displayEv.venue}
              </div>
            </div>
          </div>

          <div style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              <MiniStat label="Signed up" value={displayEv.signedUp} sub={`of ${displayEv.castSize}`} />
              <MiniStat label="Sopranos" value={Math.round(displayEv.signedUp * 0.28)} sub="of 16" />
              <MiniStat label="Basses" value={Math.round(displayEv.signedUp * 0.27)} sub="of 17" />
              <MiniStat label="Closes in" value="6d" sub={displayEv.signupDeadline} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <Button icon="mail" onClick={() => setShowMessage(true)}>Message participants</Button>
              <Button variant="outline" icon="download" onClick={handleExportRoster}>Export roster CSV</Button>
              <Button variant="outline">Lock roster</Button>
            </div>

            <FormBuilder event={displayEv} />

            <h4 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: '0 0 12px', fontWeight: 500 }}>Participant roster ({displayEv.signedUp})</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {MEMBERS.slice(0, displayEv.signedUp).map((m: any) => (
                <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', background: theme.cream, borderRadius: 8 }}>
                  <Avatar member={m} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                    <div style={{ fontSize: 10.5, color: theme.dim, fontFamily: FONTS.mono }}>
                      {(m.section || '').toUpperCase()}
                    </div>
                  </div>
                  <Chip tone="green">Confirmed</Chip>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {showMessage && displayEv && <MessageModal event={displayEv} onClose={() => setShowMessage(false)} />}
    </>
  );
}
