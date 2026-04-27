import { useState, useEffect } from 'react';
import { useRouter, useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { Calendar } from '../ui/Calendar';
import { Field } from '../ui/Field';
import { FEE_SUMMARIES, MEMBERS, EVENTS } from '../../data';
import { downloadCSV, todayStamp } from '../../utils/exportCsv';
import { supabase } from '../../supabase';

declare global {
  interface Window {
    REHEARSALS: any[];
    CLASS_SCHEDULES: any[];
  }
}

function eventsToRehearsals(evs: typeof EVENTS): any[] {
  return evs
    .filter(ev => ev.type === 'Rehearsal')
    .map(ev => ({
      id: String((ev as any)._eventId ?? ev.id),
      _eventId: (ev as any)._eventId ?? null,
      date: ev.date,
      type: ev.name ?? 'Full Rehearsal',
      section: '',
      time: (ev as any).callTime ?? '18:00',
      endTime: '21:00',
      venue: ev.venue ?? 'Music Studio A',
      notes: (ev as any).description ?? '',
    }));
}

type ScheduleMode = 'single' | 'multiple' | 'weekly';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function generateWeeklyDates(startDate: string, endDate: string, days: string[]): string[] {
  if (!startDate || !endDate || days.length === 0) return [];
  const dates: string[] = [];
  const end = new Date(endDate);
  const cur = new Date(startDate);
  while (cur <= end) {
    if (days.includes(cur.toLocaleDateString('en-US', { weekday: 'long' }))) {
      dates.push(cur.toISOString().split('T')[0]);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function BroadcastNoticeModal({ onClose, onBroadcast }: { onClose: () => void; onBroadcast: (data: { title: string; body: string; pinned: boolean; recipients: string }) => void }) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [recipients, setRecipients] = useState('all');

  const handleBroadcast = () => {
    onBroadcast({ title, body, pinned, recipients });
    onClose();
  };

  const modalInput = {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${theme.lineDark}`,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: FONTS.sans,
    background: theme.paper,
    color: theme.ink,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.paper, borderRadius: 14, width: 650, maxHeight: '85vh', overflowY: 'auto', border: `1px solid ${theme.line}` }}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Admin Console</div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>Broadcast notice</h3>
          <p style={{ fontSize: 13, color: theme.dim, margin: '6px 0 0' }}>Send an announcement to all members or specific sections.</p>
        </div>

        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Notice title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Rehearsal schedule update" />

          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Recipients</label>
            <select value={recipients} onChange={e => setRecipients(e.target.value)} style={modalInput}>
              <option value="all">All members (64)</option>
              <option value="Soprano">Soprano section (16)</option>
              <option value="Alto">Alto section (15)</option>
              <option value="Tenor">Tenor section (16)</option>
              <option value="Bass">Bass section (17)</option>
              <option value="exec">Executive board only (8)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Message body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} placeholder="Write your announcement here..." style={{ ...modalInput, resize: 'vertical' }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, padding: 14, background: theme.cream, borderRadius: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} />
            <div>
              <div style={{ fontWeight: 500 }}>Pin this notice</div>
              <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>Pinned notices appear at the top of member announcements</div>
            </div>
          </label>

          <div style={{ padding: 14, background: theme.blueSoft, borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="info" size={16} stroke={theme.blue} />
              <div style={{ fontSize: 12, color: theme.ink }}>Recipients will receive this via email and it will appear in their Announcements feed.</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'space-between', gap: 10, background: theme.cream }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="megaphone" onClick={handleBroadcast} disabled={!title || !body}>Broadcast notice</Button>
        </div>
      </div>
    </div>
  );
}

function RehearsalModal({ rehearsal, onClose, onSave, onDelete }: any) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<ScheduleMode>('single');

  const [type, setType] = useState(rehearsal?.type ?? 'Full Rehearsal');
  const [section, setSection] = useState(rehearsal?.section ?? '');
  const [time, setTime] = useState(rehearsal?.time ?? '18:00');
  const [endTime, setEndTime] = useState(rehearsal?.endTime ?? '21:00');
  const [venue, setVenue] = useState(rehearsal?.venue ?? 'Music Studio A');
  const [notes, setNotes] = useState(rehearsal?.notes ?? '');
  const [singleDate, setSingleDate] = useState(rehearsal?.date ?? '');
  const [dateInput, setDateInput] = useState('');
  const [multipleDates, setMultipleDates] = useState<string[]>([]);
  const [recurStart, setRecurStart] = useState('');
  const [recurEnd, setRecurEnd] = useState('');
  const [recurDays, setRecurDays] = useState<string[]>([]);

  const isEditing = !!rehearsal;
  const previewDates = mode === 'weekly' ? generateWeeklyDates(recurStart, recurEnd, recurDays) : [];

  const handleSave = () => {
    const base = { type, section: type === 'Sectional' ? section : '', time, endTime, venue, notes };
    if (isEditing || mode === 'single') {
      onSave({ ...base, date: singleDate });
    } else if (mode === 'multiple') {
      onSave(multipleDates.map(date => ({ ...base, date })));
    } else if (mode === 'weekly') {
      onSave(previewDates.map(date => ({ ...base, date })));
    }
    onClose();
  };

  const canSave = () => {
    if (!type || !time || !endTime || !venue) return false;
    if (type === 'Sectional' && !section) return false;
    if (isEditing || mode === 'single') return !!singleDate;
    if (mode === 'multiple') return multipleDates.length > 0;
    if (mode === 'weekly') return !!recurStart && !!recurEnd && recurDays.length > 0 && previewDates.length > 0;
    return false;
  };

  const modalInput = {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${theme.lineDark}`,
    borderRadius: 10,
    fontSize: 14,
    fontFamily: FONTS.sans,
    background: theme.paper,
    color: theme.ink,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.paper, borderRadius: 14, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${theme.line}` }}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: 0, fontWeight: 500 }}>{isEditing ? 'Edit Rehearsal' : 'Add Rehearsal'}</h3>
        </div>

        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {!isEditing && (
            <div>
              <div style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 8 }}>Scheduling Mode</div>
              <div style={{ display: 'flex', gap: 0, border: `1px solid ${theme.line}`, borderRadius: 10, overflow: 'hidden' }}>
                {([['single', 'Single date'], ['multiple', 'Multiple dates'], ['weekly', 'Weekly recurring']] as const).map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{ flex: 1, padding: '10px 8px', border: 'none', background: mode === m ? theme.green : theme.paper, color: mode === m ? '#fff' : theme.ink, fontSize: 13, fontFamily: FONTS.sans, cursor: 'pointer', borderRight: m !== 'weekly' ? `1px solid ${theme.line}` : 'none' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: type === 'Sectional' ? '1fr 1fr' : '1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={modalInput}>
                <option value="Full Rehearsal">Full Rehearsal</option>
                <option value="Sectional">Sectional</option>
              </select>
            </div>
            {type === 'Sectional' && (
              <div>
                <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Section</label>
                <select value={section} onChange={e => setSection(e.target.value)} style={modalInput}>
                  <option value="">Select section…</option>
                  <option value="Soprano/Alto">Soprano / Alto</option>
                  <option value="Tenor/Bass">Tenor / Bass</option>
                  <option value="Soprano">Soprano</option>
                  <option value="Alto">Alto</option>
                  <option value="Tenor">Tenor</option>
                  <option value="Bass">Bass</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Start Time" type="time" value={time} onChange={(e: any) => setTime(e.target.value)} />
            <Field label="End Time" type="time" value={endTime} onChange={(e: any) => setEndTime(e.target.value)} />
          </div>
          <Field label="Venue" value={venue} onChange={(e: any) => setVenue(e.target.value)} placeholder="e.g. Music Studio A" />

          {(isEditing || mode === 'single') && (
            <Field label="Date" type="date" value={singleDate} onChange={(e: any) => setSingleDate(e.target.value)} />
          )}

          {!isEditing && mode === 'multiple' && (
            <div>
              <div style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 8 }}>
                Dates ({multipleDates.length} selected)
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} style={{ ...modalInput, flex: 1 }} />
                <Button variant="outline" onClick={() => { if (dateInput && !multipleDates.includes(dateInput)) { setMultipleDates(prev => [...prev, dateInput].sort()); setDateInput(''); } }} disabled={!dateInput || multipleDates.includes(dateInput)}>Add</Button>
              </div>
              {multipleDates.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {multipleDates.map(d => (
                    <div key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: theme.greenSoft, color: theme.greenDeep, borderRadius: 6, fontSize: 12.5, fontFamily: FONTS.mono }}>
                      {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                      <button onClick={() => setMultipleDates(prev => prev.filter(x => x !== d))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.greenDeep, padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isEditing && mode === 'weekly' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Start Date" type="date" value={recurStart} onChange={(e: any) => setRecurStart(e.target.value)} />
                <Field label="End Date" type="date" value={recurEnd} onChange={(e: any) => setRecurEnd(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 8 }}>Repeat on</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DAYS_OF_WEEK.map(day => {
                    const on = recurDays.includes(day);
                    return (
                      <button key={day} onClick={() => setRecurDays(prev => on ? prev.filter(d => d !== day) : [...prev, day])} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${on ? theme.green : theme.line}`, background: on ? theme.green : 'transparent', color: on ? '#fff' : theme.ink, fontSize: 13, cursor: 'pointer', fontFamily: FONTS.sans }}>
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
              {previewDates.length > 0 && (
                <div style={{ padding: 14, background: theme.greenSoft, borderRadius: 10 }}>
                  <div style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.greenDeep, textTransform: 'uppercase', marginBottom: 8 }}>
                    Preview — {previewDates.length} rehearsal{previewDates.length !== 1 ? 's' : ''} will be created
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {previewDates.slice(0, 12).map(d => (
                      <span key={d} style={{ fontSize: 12, fontFamily: FONTS.mono, color: theme.greenDeep, background: 'rgba(255,255,255,0.6)', padding: '3px 8px', borderRadius: 4 }}>
                        {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                      </span>
                    ))}
                    {previewDates.length > 12 && <span style={{ fontSize: 12, color: theme.greenDeep }}>+{previewDates.length - 12} more</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional details…" style={{ ...modalInput, resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'space-between', gap: 10, background: theme.cream }}>
          <div>
            {isEditing && (
              <Button variant="outline" onClick={() => { onDelete(rehearsal.id); onClose(); }} style={{ color: theme.red, borderColor: theme.red }}>Delete</Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave()}>
              {isEditing ? 'Update' : mode === 'single' ? 'Add Rehearsal' : `Add ${mode === 'multiple' ? multipleDates.length : previewDates.length} Rehearsal${(mode === 'multiple' ? multipleDates.length : previewDates.length) !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
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

const toSupabaseRow = (data: any) => ({
  event_date: data.date,
  event_type: 'rehearsal',
  name: data.type,
  start_time: data.time ? `${data.time}:00` : null,
  end_time: data.endTime ? `${data.endTime}:00` : null,
  venue: data.venue || null,
  notes: data.notes || null,
});

function useViewportWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

export function AdminHome() {
  const { user } = useRouter();
  const { theme } = useTheme();
  const app = useApp();
  const vw = useViewportWidth();
  const isMobile = vw < 768;
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRehearsal, setEditingRehearsal] = useState<any>(null);
  const [rehearsals, setRehearsals] = useState<any[]>(() => {
    const fromEvents = eventsToRehearsals(EVENTS);
    return fromEvents.length > 0 ? fromEvents : (window.REHEARSALS || []);
  });

  useEffect(() => { window.REHEARSALS = rehearsals; }, [rehearsals]);

  const pending = app.excuses.filter(e => e.status === 'Pending');
  const outstanding = FEE_SUMMARIES.reduce((s, f) => s + f.outstanding, 0);
  const activeEvents = app.events.filter(e => new Date(e.date) > new Date('2026-04-24'));

  const handleSave = async (data: any) => {
    if (editingRehearsal) {
      const updated = { ...editingRehearsal, ...data };
      if (editingRehearsal._eventId) {
        await supabase.from('events').update(toSupabaseRow(data)).eq('id', editingRehearsal._eventId);
      }
      setRehearsals(prev => prev.map(r => r.id === editingRehearsal.id ? updated : r));
      app.showToast('Rehearsal updated');
    } else if (Array.isArray(data)) {
      const newOnes: any[] = [];
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        const { data: row } = await supabase.from('events').insert(toSupabaseRow(d)).select('id').single();
        newOnes.push({ ...d, id: row?.id ?? `r${Date.now()}_${i}`, _eventId: row?.id ?? null });
      }
      setRehearsals(prev => [...prev, ...newOnes]);
      app.showToast(`${newOnes.length} rehearsal${newOnes.length !== 1 ? 's' : ''} added`);
    } else {
      const { data: row } = await supabase.from('events').insert(toSupabaseRow(data)).select('id').single();
      const newOne = { ...data, id: row?.id ?? `r${Date.now()}`, _eventId: row?.id ?? null };
      setRehearsals(prev => [...prev, newOne]);
      app.showToast('Rehearsal added');
    }
    setEditingRehearsal(null);
  };

  const handleDelete = async (id: string) => {
    const target = rehearsals.find(r => r.id === id);
    if (target?._eventId) {
      await supabase.from('events').delete().eq('id', target._eventId);
    }
    setRehearsals(prev => prev.filter(r => r.id !== id));
    app.showToast('Rehearsal deleted', 'error');
  };

  const getConflicts = (eventDate: string, eventTime: string) => {
    if (!window.CLASS_SCHEDULES || !eventTime) return [];
    const conflicts = [];
    const dayOfWeek = new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long' });
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventMinutes = hours * 60 + minutes;
    for (const schedule of window.CLASS_SCHEDULES) {
      for (const cls of schedule.classes) {
        if (cls.days.includes(dayOfWeek)) {
          const classStart = Number(cls.startTime.split(':')[0]) * 60 + Number(cls.startTime.split(':')[1]);
          const classEnd = Number(cls.endTime.split(':')[0]) * 60 + Number(cls.endTime.split(':')[1]);
          if (eventMinutes >= classStart && eventMinutes <= classEnd) {
            conflicts.push({ memberId: schedule.memberId, class: cls });
          }
        }
      }
    }
    return conflicts;
  };

  const upcoming = rehearsals
    .filter((r: any) => new Date(r.date) >= new Date())
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleWeeklyReport = () => {
    const blank: (string | number)[] = ['', '', ''];
    const rows: (string | number)[][] = [
      ['DLSU Chorale — Weekly Admin Report', todayStamp(), ''],
      blank,
      ['PENDING EXCUSE REQUESTS', '', ''],
      ['Member', 'Date', 'Reason', 'Type'],
      ...pending.map((e: any) => [e.memberName ?? e.memberId ?? '—', e.date ?? '—', e.reason ?? '—', e.type ?? '—']),
      ...(pending.length === 0 ? [['No pending requests', '', '']] : []),
      blank,
      ['OUTSTANDING FEES', '', ''],
      ['Member', 'Outstanding (₱)', 'Total Fees (₱)'],
      ...FEE_SUMMARIES
        .filter(f => f.outstanding > 0)
        .map(f => {
          const member = MEMBERS.find(m => m.id === f.memberId);
          return [member?.name ?? `ID ${f.memberId}`, f.outstanding, f.outstanding + (f as any).paid];
        }),
      ...(FEE_SUMMARIES.filter(f => f.outstanding > 0).length === 0 ? [['No outstanding fees', '', '']] : []),
      blank,
      ['UPCOMING EVENTS', '', ''],
      ['Name', 'Date', 'Type'],
      ...activeEvents.map((e: any) => [e.name ?? '—', e.date ?? '—', e.type ?? '—']),
      ...(activeEvents.length === 0 ? [['No upcoming events', '', '']] : []),
      blank,
      ['UPCOMING REHEARSALS', '', ''],
      ['Date', 'Time', 'Venue'],
      ...upcoming.slice(0, 10).map((r: any) => [r.date ?? '—', r.callTime ?? r.time ?? '—', r.venue ?? '—']),
      ...(upcoming.length === 0 ? [['No upcoming rehearsals', '', '']] : []),
    ];
    downloadCSV(`weekly-report-${todayStamp()}`, rows);
  };

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        title={
          <>
            Admin Console, <em style={{ fontStyle: 'italic', color: theme.green }}>{user.name.split(' ')[0]}</em>.
          </>
        }
        subtitle="Everything happening across the Chorale — at a glance."
        actions={
          <>
            <Button variant="outline" icon="download" onClick={handleWeeklyReport}>Weekly report</Button>
            <Button icon="megaphone" onClick={() => setShowBroadcast(true)}>Broadcast notice</Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Active members" value="64" trend="+3 this term" tone="green" />
        <StatCard label="Pending excuses" value={pending.length} trend="requires review" tone="amber" />
        <StatCard label="Outstanding fees" value={`₱${outstanding.toLocaleString()}`} trend={`across ${FEE_SUMMARIES.filter(f => f.outstanding > 0).length} members`} tone="red" />
        <StatCard label="Upcoming events" value={activeEvents.length} trend="next: BCFC in 16d" tone="blue" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: 20 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Action needed</div>
              <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '4px 0 0', fontWeight: 500 }}>Pending excuses · {pending.length}</h3>
            </div>
            <a onClick={() => {}} style={{ fontSize: 12.5, color: theme.green, cursor: 'pointer', textDecoration: 'underline' }}>Review all →</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.slice(0, 5).map(e => {
              const m = MEMBERS.find(m => m.id === e.memberId);
              return (
                <div key={e.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 14, alignItems: 'center', padding: 12, background: theme.cream, borderRadius: 10 }}>
                  <Avatar member={m} size={34} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{e.memberName} · <span style={{ color: theme.dim, fontWeight: 400 }}>{e.type}</span></div>
                    <div style={{ fontSize: 12, color: theme.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.reason}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: theme.dim, fontFamily: FONTS.mono }}>{e.date}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button size="sm" onClick={() => { app.updateExcuse(e.id, { status: 'Approved', approvedBy: user.name }); app.showToast(`Approved ${e.memberName}'s excuse`); }}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => { app.updateExcuse(e.id, { status: 'Declined', approvedBy: user.name }); app.showToast(`Declined ${e.memberName}'s excuse`, 'error'); }}>Decline</Button>
                  </div>
                </div>
              );
            })}
            {pending.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: theme.dim }}>🎉 No pending requests.</div>}
          </div>
        </Card>

        <Card>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 12 }}>This week · attendance</div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '0 0 16px', fontWeight: 500 }}>Section turnout</h3>
          {[
            { s: 'Soprano', present: 14, total: 16, color: '#B04A5F' },
            { s: 'Alto', present: 13, total: 15, color: '#9B6B2F' },
            { s: 'Tenor', present: 12, total: 16, color: '#2C5B8E' },
            { s: 'Bass', present: 15, total: 17, color: theme.greenDeep },
          ].map(row => (
            <div key={row.s} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                <span>{row.s}</span>
                <span style={{ fontFamily: FONTS.mono, color: theme.dim }}>{row.present}/{row.total} · {Math.round((row.present / row.total) * 100)}%</span>
              </div>
              <div style={{ height: 8, background: theme.line, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${(row.present / row.total) * 100}%`, height: '100%', background: row.color }} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* ── Calendar section ── */}
      <div style={{ marginTop: 40, paddingTop: 32, borderTop: `1px solid ${theme.line}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Admin Console</div>
            <h2 style={{ fontFamily: FONTS.serif, fontSize: 28, margin: '4px 0 0', fontWeight: 500 }}>Calendar Management</h2>
            <div style={{ fontSize: 13, color: theme.dim, marginTop: 4 }}>Manage rehearsals, sectionals, and view schedule conflicts.</div>
          </div>
          <Button icon="plus" onClick={() => { setEditingRehearsal(null); setShowModal(true); }}>Add Rehearsal</Button>
        </div>
      </div>

      <Calendar role="admin" />

      <Card style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, margin: 0, fontWeight: 500 }}>Upcoming Rehearsals & Sectionals</h3>
            <div style={{ fontSize: 12, color: theme.dim, marginTop: 4 }}>{upcoming.length} upcoming · click a row to edit</div>
          </div>
        </div>

        {upcoming.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: theme.dim }}>
            <Icon name="calendar" size={36} stroke={theme.dim} />
            <div style={{ marginTop: 12, fontSize: 14 }}>No upcoming rehearsals. Add one to get started.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map((r: any) => {
              const conflicts = getConflicts(r.date, r.time);
              const estimatedAttendance = 64 - conflicts.length;

              return (
                <div
                  key={r.id}
                  style={{ display: 'grid', gridTemplateColumns: '110px 140px 1fr auto auto auto', gap: 14, padding: '12px 14px', background: theme.cream, borderRadius: 10, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = theme.line)}
                  onMouseLeave={e => (e.currentTarget.style.background = theme.cream)}
                  onClick={() => { setEditingRehearsal(r); setShowModal(true); }}
                >
                  <div>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: theme.dim }}>
                      {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 600, marginTop: 2 }}>{new Date(r.date).toLocaleDateString('en-US', { weekday: 'long' })}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontFamily: FONTS.mono, padding: '4px 8px', background: r.type === 'Sectional' ? theme.amberSoft : theme.greenSoft, color: r.type === 'Sectional' ? theme.amber : theme.greenDeep, borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {r.type}
                    </span>
                    {r.section && <div style={{ fontSize: 11, color: theme.dim, marginTop: 4 }}>{r.section}</div>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{r.venue}</div>
                    {r.notes && <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>{r.notes}</div>}
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 12, whiteSpace: 'nowrap' }}>{r.time}–{r.endTime}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: theme.dim }}>Est. attendance</div>
                    <div style={{ fontWeight: 600, color: conflicts.length > 5 ? theme.amber : theme.green }}>
                      {estimatedAttendance}/64
                      {conflicts.length > 0 && <span style={{ fontSize: 11, color: theme.dim, marginLeft: 4 }}>({conflicts.length} conflicts)</span>}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDelete(r.id); }} style={{ padding: 8, background: 'transparent', border: `1px solid ${theme.red}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: theme.red }}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Recent Announcements section ── */}
      <div style={{ marginTop: 40, paddingTop: 32, borderTop: `1px solid ${theme.line}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Admin Console</div>
            <h2 style={{ fontFamily: FONTS.serif, fontSize: 28, margin: '4px 0 0', fontWeight: 500 }}>Recent Announcements</h2>
          </div>
          <Button icon="megaphone" onClick={() => setShowBroadcast(true)}>New announcement</Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {app.announcements.length === 0 && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: theme.dim }}>No announcements yet.</div>
          )}
          {app.announcements.slice(0, 5).map((a: any) => (
            <div key={a.id}>
              <Card style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {a.pinned && (
                        <span style={{ fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 1, background: theme.amberSoft, color: theme.amber, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>
                          Pinned
                        </span>
                      )}
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</span>
                    </div>
                    <div style={{ fontSize: 13, color: theme.dim, lineHeight: 1.5 }}>{a.body}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: theme.dim }}>{a.date}</div>
                    <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>{a.author}</div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {showBroadcast && (
        <BroadcastNoticeModal
          onClose={() => setShowBroadcast(false)}
          onBroadcast={(data) => {
            app.addAnnouncement({
              title: data.title,
              body: data.body,
              pinned: data.pinned,
              author: user.name,
              recipients: data.recipients,
            });
            app.showToast(`Notice broadcast to ${data.recipients === 'all' ? 'all members' : data.recipients}`);
          }}
        />
      )}
      {showModal && (
        <RehearsalModal
          rehearsal={editingRehearsal}
          onClose={() => { setShowModal(false); setEditingRehearsal(null); }}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
