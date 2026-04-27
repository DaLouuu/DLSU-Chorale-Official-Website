import { useState, useEffect } from 'react';
import { useTheme, useApp } from '../../App';
import { supabase } from '../../supabase';
import { EVENTS } from '../../data';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Calendar } from '../ui/Calendar';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Field } from '../ui/Field';

declare global {
  interface Window {
    REHEARSALS: any[];
    CLASS_SCHEDULES: any[];
  }
}

type ScheduleMode = 'single' | 'multiple' | 'weekly';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function generateWeeklyDates(startDate: string, endDate: string, days: string[]): string[] {
  if (!startDate || !endDate || days.length === 0) return [];
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const cur = new Date(start);
  while (cur <= end) {
    const dayName = cur.toLocaleDateString('en-US', { weekday: 'long' });
    if (days.includes(dayName)) {
      dates.push(cur.toISOString().split('T')[0]);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function RehearsalModal({ rehearsal, onClose, onSave, onDelete }: any) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<ScheduleMode>('single');

  // Shared fields
  const [type, setType] = useState(rehearsal?.type ?? 'Full Rehearsal');
  const [section, setSection] = useState(rehearsal?.section ?? '');
  const [time, setTime] = useState(rehearsal?.time ?? '18:00');
  const [endTime, setEndTime] = useState(rehearsal?.endTime ?? '21:00');
  const [venue, setVenue] = useState(rehearsal?.venue ?? 'Music Studio A');
  const [notes, setNotes] = useState(rehearsal?.notes ?? '');

  // Single
  const [singleDate, setSingleDate] = useState(rehearsal?.date ?? '');

  // Multiple dates
  const [dateInput, setDateInput] = useState('');
  const [multipleDates, setMultipleDates] = useState<string[]>([]);

  // Weekly recurring
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

  const modalInput: React.CSSProperties = {
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
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: 0, fontWeight: 500 }}>
            {isEditing ? 'Edit Rehearsal' : 'Add Rehearsal'}
          </h3>
        </div>

        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Scheduling mode — only shown when creating */}
          {!isEditing && (
            <div>
              <div style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 8 }}>
                Scheduling Mode
              </div>
              <div style={{ display: 'flex', gap: 0, border: `1px solid ${theme.line}`, borderRadius: 10, overflow: 'hidden' }}>
                {([['single', 'Single date'], ['multiple', 'Multiple dates'], ['weekly', 'Weekly recurring']] as const).map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      border: 'none',
                      background: mode === m ? theme.green : theme.paper,
                      color: mode === m ? '#fff' : theme.ink,
                      fontSize: 13,
                      fontFamily: FONTS.sans,
                      cursor: 'pointer',
                      borderRight: m !== 'weekly' ? `1px solid ${theme.line}` : 'none',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type + section */}
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

          {/* Time + venue */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Start Time" type="time" value={time} onChange={(e: any) => setTime(e.target.value)} />
            <Field label="End Time" type="time" value={endTime} onChange={(e: any) => setEndTime(e.target.value)} />
          </div>
          <Field label="Venue" value={venue} onChange={(e: any) => setVenue(e.target.value)} placeholder="e.g. Music Studio A" />

          {/* ── Date inputs by mode ── */}
          {(isEditing || mode === 'single') && (
            <Field label="Date" type="date" value={singleDate} onChange={(e: any) => setSingleDate(e.target.value)} />
          )}

          {!isEditing && mode === 'multiple' && (
            <div>
              <div style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 8 }}>
                Dates ({multipleDates.length} selected)
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input
                  type="date"
                  value={dateInput}
                  onChange={e => setDateInput(e.target.value)}
                  style={{ ...modalInput, flex: 1 }}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (dateInput && !multipleDates.includes(dateInput)) {
                      setMultipleDates(prev => [...prev, dateInput].sort());
                      setDateInput('');
                    }
                  }}
                  disabled={!dateInput || multipleDates.includes(dateInput)}
                >
                  Add
                </Button>
              </div>
              {multipleDates.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {multipleDates.map(d => (
                    <div
                      key={d}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 10px',
                        background: theme.greenSoft,
                        color: theme.greenDeep,
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontFamily: FONTS.mono,
                      }}
                    >
                      {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                      <button
                        onClick={() => setMultipleDates(prev => prev.filter(x => x !== d))}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.greenDeep, padding: 0, fontSize: 14, lineHeight: 1 }}
                      >
                        ×
                      </button>
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
                <div style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 8 }}>
                  Repeat on
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DAYS_OF_WEEK.map(day => {
                    const on = recurDays.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => setRecurDays(prev => on ? prev.filter(d => d !== day) : [...prev, day])}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 20,
                          border: `1px solid ${on ? theme.green : theme.line}`,
                          background: on ? theme.green : 'transparent',
                          color: on ? '#fff' : theme.ink,
                          fontSize: 13,
                          cursor: 'pointer',
                          fontFamily: FONTS.sans,
                        }}
                      >
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
                    {previewDates.length > 12 && (
                      <span style={{ fontSize: 12, color: theme.greenDeep }}>+{previewDates.length - 12} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Additional details…"
              style={{ ...modalInput, resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'space-between', gap: 10, background: theme.cream }}>
          <div>
            {isEditing && (
              <Button variant="outline" onClick={() => { onDelete(rehearsal.id); onClose(); }} style={{ color: theme.red, borderColor: theme.red }}>
                Delete
              </Button>
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

function eventsToRehearsals(evs: typeof EVENTS): any[] {
  return evs
    .filter(ev => ev.type === 'Rehearsal')
    .map(ev => ({
      id: String(ev._eventId ?? ev.id),
      _eventId: ev._eventId ?? null,
      date: ev.date,
      type: ev.name ?? 'Full Rehearsal',
      section: '',
      time: ev.callTime ?? '18:00',
      endTime: '21:00',
      venue: ev.venue ?? 'Music Studio A',
      notes: ev.description ?? '',
    }));
}

export function AdminCalendar() {
  const { theme } = useTheme();
  const app = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingRehearsal, setEditingRehearsal] = useState<any>(null);
  const [rehearsals, setRehearsals] = useState<any[]>(() => {
    const fromEvents = eventsToRehearsals(EVENTS);
    return fromEvents.length > 0 ? fromEvents : (window.REHEARSALS || []);
  });

  // Keep window.REHEARSALS in sync for the Calendar UI component
  useEffect(() => { window.REHEARSALS = rehearsals; }, [rehearsals]);

  const toSupabaseRow = (data: any) => ({
    event_date: data.date,
    event_type: 'rehearsal',
    name: data.type,
    start_time: data.time ? `${data.time}:00` : null,
    end_time: data.endTime ? `${data.endTime}:00` : null,
    venue: data.venue || null,
    notes: data.notes || null,
  });

  const handleSave = async (data: any) => {
    if (editingRehearsal) {
      const next = rehearsals.map(r => r.id === editingRehearsal.id ? { ...r, ...data } : r);
      setRehearsals(next);
      if (editingRehearsal._eventId) {
        await supabase.from('events').update(toSupabaseRow(data)).eq('event_id', editingRehearsal._eventId);
      }
      app.showToast('Rehearsal updated');
    } else if (Array.isArray(data)) {
      const inserted: any[] = [];
      for (let i = 0; i < data.length; i++) {
        const { data: row } = await supabase.from('events').insert(toSupabaseRow(data[i])).select('event_id').single();
        inserted.push({ ...data[i], id: String(row?.event_id ?? `r${Date.now()}_${i}`), _eventId: row?.event_id ?? null });
      }
      setRehearsals(prev => [...prev, ...inserted]);
      app.showToast(`${inserted.length} rehearsal${inserted.length !== 1 ? 's' : ''} added`);
    } else {
      const { data: row } = await supabase.from('events').insert(toSupabaseRow(data)).select('event_id').single();
      const newR = { ...data, id: String(row?.event_id ?? `r${Date.now()}`), _eventId: row?.event_id ?? null };
      setRehearsals(prev => [...prev, newR]);
      app.showToast('Rehearsal added');
    }
    setEditingRehearsal(null);
  };

  const handleDelete = async (id: string) => {
    const r = rehearsals.find(x => x.id === id);
    if (r?._eventId) {
      await supabase.from('events').delete().eq('event_id', r._eventId);
    }
    setRehearsals(prev => prev.filter(x => x.id !== id));
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

  window.REHEARSALS = rehearsals;

  const upcoming = rehearsals
    .filter((r: any) => new Date(r.date) >= new Date())
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <>
      <PageHeader
        eyebrow="Admin Console"
        title="Calendar Management"
        subtitle="Manage all rehearsals, sectionals, and view member schedule conflicts."
        actions={
          <Button icon="plus" onClick={() => { setEditingRehearsal(null); setShowModal(true); }}>
            Add Rehearsal
          </Button>
        }
      />

      <Calendar role="admin" />

      <Card style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, margin: 0, fontWeight: 500 }}>
              Upcoming Rehearsals & Sectionals
            </h3>
            <div style={{ fontSize: 12, color: theme.dim, marginTop: 4 }}>
              {upcoming.length} upcoming · click a row to edit
            </div>
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
              const totalMembers = 64;
              const estimatedAttendance = totalMembers - conflicts.length;

              return (
                <div
                  key={r.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '110px 140px 1fr auto auto auto',
                    gap: 14,
                    padding: '12px 14px',
                    background: theme.cream,
                    borderRadius: 10,
                    alignItems: 'center',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = theme.line)}
                  onMouseLeave={e => (e.currentTarget.style.background = theme.cream)}
                  onClick={() => { setEditingRehearsal(r); setShowModal(true); }}
                >
                  <div>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: theme.dim }}>
                      {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 600, marginTop: 2 }}>
                      {new Date(r.date).toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: FONTS.mono,
                        padding: '4px 8px',
                        background: r.type === 'Sectional' ? theme.amberSoft : theme.greenSoft,
                        color: r.type === 'Sectional' ? theme.amber : theme.greenDeep,
                        borderRadius: 6,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {r.type}
                    </span>
                    {r.section && (
                      <div style={{ fontSize: 11, color: theme.dim, marginTop: 4 }}>{r.section}</div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontWeight: 500 }}>{r.venue}</div>
                    {r.notes && <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>{r.notes}</div>}
                  </div>

                  <div style={{ fontFamily: FONTS.mono, fontSize: 12, whiteSpace: 'nowrap' }}>
                    {r.time}–{r.endTime}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: theme.dim }}>Est. attendance</div>
                    <div style={{ fontWeight: 600, color: conflicts.length > 5 ? theme.amber : theme.green }}>
                      {estimatedAttendance}/{totalMembers}
                      {conflicts.length > 0 && (
                        <span style={{ fontSize: 11, color: theme.dim, marginLeft: 4 }}>({conflicts.length} conflicts)</span>
                      )}
                    </div>
                  </div>

                  {/* Stop row click from bubbling on delete */}
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(r.id); }}
                    style={{ padding: 8, background: 'transparent', border: `1px solid ${theme.red}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: theme.red }}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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
