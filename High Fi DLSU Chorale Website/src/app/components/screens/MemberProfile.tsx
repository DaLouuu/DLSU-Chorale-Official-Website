import { useState } from 'react';
import { useRouter, useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { SectionTag } from '../ui/SectionTag';
import { Chip, StatusPill } from '../ui/Chip';
import { Field } from '../ui/Field';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

declare global {
  interface Window {
    CLASS_SCHEDULES: any[];
  }
}

function WeeklyDigestModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const weekData = [
    { date: '2026-04-24', status: 'present', time: '18:02' },
    { date: '2026-04-22', status: 'late', time: '18:24' },
    { date: '2026-04-20', status: 'present', time: '17:58' },
    { date: '2026-04-17', status: 'present', time: '14:30' },
  ];

  const stats = {
    present: weekData.filter(d => d.status === 'present').length,
    late: weekData.filter(d => d.status === 'late').length,
    absent: weekData.filter(d => d.status === 'absent').length,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,32,26,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.paper,
          borderRadius: 14,
          width: 600,
          maxHeight: '85vh',
          overflowY: 'auto',
          border: `1px solid ${theme.line}`,
        }}
      >
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>
            Weekly Attendance Digest
          </div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>April 17-24, 2026</h3>
          <p style={{ fontSize: 13, color: theme.dim, margin: '6px 0 0' }}>Your attendance summary for this week</p>
        </div>

        <div style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
            <div style={{ padding: 16, background: theme.greenSoft, borderRadius: 10 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: theme.greenDeep, textTransform: 'uppercase' }}>
                Present
              </div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 32, fontWeight: 500, color: theme.greenDeep, marginTop: 4 }}>
                {stats.present}
              </div>
            </div>
            <div style={{ padding: 16, background: theme.amberSoft, borderRadius: 10 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: theme.amber, textTransform: 'uppercase' }}>
                Late
              </div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 32, fontWeight: 500, color: theme.amber, marginTop: 4 }}>
                {stats.late}
              </div>
            </div>
            <div style={{ padding: 16, background: theme.redSoft, borderRadius: 10 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: theme.red, textTransform: 'uppercase' }}>
                Absent
              </div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 32, fontWeight: 500, color: theme.red, marginTop: 4 }}>
                {stats.absent}
              </div>
            </div>
          </div>

          <h4 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: '0 0 12px', fontWeight: 500 }}>Daily breakdown</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {weekData.map((d, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 14,
                  background: theme.cream,
                  borderRadius: 8,
                  border: `1px solid ${theme.line}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>
                    {new Date(d.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 12, color: theme.dim, fontFamily: FONTS.mono, marginTop: 2 }}>
                    Check-in: {d.time}
                  </div>
                </div>
                <StatusPill status={d.status} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: 16, background: theme.blueSoft, borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="info" size={18} stroke={theme.blue} />
              <div style={{ fontSize: 13, color: theme.ink, lineHeight: 1.5 }}>
                Keep up the great work! You're attending {Math.round((stats.present / weekData.length) * 100)}% of rehearsals on time.
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'flex-end', background: theme.cream }}>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// ── Schedule CSV helpers ──────────────────────────────────────────────────────

const DAY_MAP: Record<string, string> = {
  m: 'Monday', mon: 'Monday', monday: 'Monday',
  t: 'Tuesday', tue: 'Tuesday', tues: 'Tuesday', tuesday: 'Tuesday',
  w: 'Wednesday', wed: 'Wednesday', wednesday: 'Wednesday',
  th: 'Thursday', r: 'Thursday', thu: 'Thursday', thur: 'Thursday', thurs: 'Thursday', thursday: 'Thursday',
  f: 'Friday', fri: 'Friday', friday: 'Friday',
  s: 'Saturday', sa: 'Saturday', sat: 'Saturday', saturday: 'Saturday',
};

function expandDay(raw: string): string {
  return DAY_MAP[raw.toLowerCase()] ?? '';
}

function parseDays(raw: string): string[] {
  if (!raw) return [];
  const parts = raw.split(/[,/\s]+/).filter(Boolean);
  return parts.map(expandDay).filter(Boolean);
}

function parseScheduleCSV(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/[\s-]+/g, '_'));

  return lines.slice(1).map(line => {
    const vals: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    vals.push(cur.trim());
    const row = Object.fromEntries(headers.map((h, i) => [h, vals[i]?.replace(/^"|"$/g, '').trim() ?? '']));
    return {
      code: row.code || row.subject_code || row.course_code || '',
      name: row.name || row.subject_name || row.course || row.class_name || row.description || '',
      days: parseDays(row.days || row.day || row.schedule || ''),
      startTime: row.start_time || row.starttime || row.start || '',
      endTime: row.end_time || row.endtime || row.end || '',
      room: row.room || row.location || row.venue || '',
    };
  }).filter(c => c.code || c.name);
}

function ClassScheduleModal({ schedule, onClose, onSave }: any) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState(
    schedule || {
      term: 'Term 3 2025-2026',
      classes: [],
    }
  );
  const [newClass, setNewClass] = useState({
    code: '',
    name: '',
    days: [],
    startTime: '',
    endTime: '',
    room: '',
  });
  const [csvStatus, setCsvStatus] = useState<string | null>(null);

  const handleScheduleFile = async (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv')) {
      setCsvStatus('Only CSV files are supported for auto-fill. Please save your spreadsheet as CSV.');
      return;
    }
    setCsvStatus('Parsing…');
    try {
      const text = await file.text();
      const classes = parseScheduleCSV(text);
      if (classes.length === 0) {
        setCsvStatus('No valid rows found. Make sure your CSV has columns: code, name, days, start_time, end_time, room');
        return;
      }
      setFormData((prev: any) => ({ ...prev, classes: [...prev.classes, ...classes] }));
      setCsvStatus(`✓ ${classes.length} class${classes.length !== 1 ? 'es' : ''} loaded from file`);
    } catch {
      setCsvStatus('Could not read the file.');
    }
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

  const addClassToSchedule = () => {
    if (!newClass.code || !newClass.name || newClass.days.length === 0 || !newClass.startTime || !newClass.endTime) {
      return;
    }
    setFormData({
      ...formData,
      classes: [...formData.classes, { ...newClass }],
    });
    setNewClass({ code: '', name: '', days: [], startTime: '', endTime: '', room: '' });
  };

  const removeClass = (index: number) => {
    setFormData({
      ...formData,
      classes: formData.classes.filter((_: any, i: number) => i !== index),
    });
  };

  const toggleDay = (day: string) => {
    if (newClass.days.includes(day)) {
      setNewClass({ ...newClass, days: newClass.days.filter(d => d !== day) });
    } else {
      setNewClass({ ...newClass, days: [...newClass.days, day] });
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,32,26,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.paper,
          borderRadius: 14,
          width: 700,
          maxHeight: '85vh',
          overflowY: 'auto',
          border: `1px solid ${theme.line}`,
        }}
      >
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: 0, fontWeight: 500 }}>
            {schedule ? 'Edit Class Schedule' : 'Add Class Schedule'}
          </h3>
          <p style={{ fontSize: 13, color: theme.dim, margin: '6px 0 0' }}>
            Add your classes to see schedule conflicts with choir events
          </p>
        </div>

        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field
            label="Academic Term"
            value={formData.term}
            onChange={e => setFormData({ ...formData, term: e.target.value })}
            placeholder="e.g. Term 3 2025-2026"
          />

          {formData.classes.length > 0 && (
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Current Classes</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {formData.classes.map((cls: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 120px auto',
                      gap: 12,
                      padding: 12,
                      background: theme.cream,
                      borderRadius: 8,
                      alignItems: 'center',
                      fontSize: 13,
                    }}
                  >
                    <div style={{ fontFamily: FONTS.mono, fontWeight: 600, color: theme.green }}>{cls.code}</div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{cls.name}</div>
                      <div style={{ fontSize: 11, color: theme.dim, marginTop: 2 }}>{cls.days.join(', ')}</div>
                    </div>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 11 }}>
                      {cls.startTime} - {cls.endTime}
                    </div>
                    <button
                      onClick={() => removeClass(i)}
                      style={{
                        padding: 6,
                        background: 'transparent',
                        border: `1px solid ${theme.red}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: theme.red,
                      }}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${theme.line}`, paddingTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Add New Class</h4>

            {/* CSV upload zone */}
            <label
              style={{
                display: 'block', marginBottom: 16, padding: '14px 16px',
                border: `2px dashed ${theme.lineDark}`, borderRadius: 10,
                cursor: 'pointer', textAlign: 'center',
                background: theme.cream, transition: 'border-color 0.15s',
              }}
              onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = '#c9a84c'; }}
              onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = theme.lineDark; }}
              onDrop={e => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).style.borderColor = theme.lineDark;
                const file = e.dataTransfer.files[0];
                if (file) handleScheduleFile(file);
              }}
            >
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleScheduleFile(f); e.target.value = ''; }}
              />
              <div style={{ fontSize: 13, color: theme.ink, marginBottom: 2 }}>
                📄 Drop a CSV file or click to browse
              </div>
              <div style={{ fontSize: 11.5, color: theme.dim }}>
                Auto-fills classes from CSV — columns: <span style={{ fontFamily: 'monospace' }}>code, name, days, start_time, end_time, room</span>
              </div>
              {csvStatus && (
                <div style={{
                  marginTop: 8, fontSize: 12,
                  color: csvStatus.startsWith('✓') ? '#16a34a' : '#d97706',
                  fontWeight: csvStatus.startsWith('✓') ? 500 : 400,
                }}>{csvStatus}</div>
              )}
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12, marginBottom: 12 }}>
              <input
                value={newClass.code}
                onChange={e => setNewClass({ ...newClass, code: e.target.value })}
                placeholder="Code"
                style={modalInput}
              />
              <input
                value={newClass.name}
                onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                placeholder="Class Name"
                style={modalInput}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Days
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      background: newClass.days.includes(day) ? theme.green : theme.cream,
                      color: newClass.days.includes(day) ? '#fff' : theme.ink,
                      border: `1px solid ${newClass.days.includes(day) ? theme.green : theme.line}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontFamily: FONTS.sans,
                    }}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input
                type="time"
                value={newClass.startTime}
                onChange={e => setNewClass({ ...newClass, startTime: e.target.value })}
                placeholder="Start"
                style={modalInput}
              />
              <input
                type="time"
                value={newClass.endTime}
                onChange={e => setNewClass({ ...newClass, endTime: e.target.value })}
                placeholder="End"
                style={modalInput}
              />
              <input
                value={newClass.room}
                onChange={e => setNewClass({ ...newClass, room: e.target.value })}
                placeholder="Room"
                style={modalInput}
              />
            </div>

            <Button
              onClick={addClassToSchedule}
              variant="outline"
              icon="plus"
              disabled={!newClass.code || !newClass.name || newClass.days.length === 0 || !newClass.startTime || !newClass.endTime}
            >
              Add Class
            </Button>
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'space-between', gap: 10, background: theme.cream }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => { onSave(formData); onClose(); }} disabled={formData.classes.length === 0}>
            Save Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MemberProfile() {
  const { user } = useRouter();
  const { theme } = useTheme();
  const app = useApp();
  const m = user;
  const [showDigest, setShowDigest] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [notifications, setNotifications] = useState({
    excuseDecision: true,
    rehearsalReminder: true,
    weeklyDigest: false,
  });

  if (!window.CLASS_SCHEDULES) {
    window.CLASS_SCHEDULES = [];
  }

  const userSchedule = window.CLASS_SCHEDULES?.find(s => s.memberId === user.id);

  const handleSaveSchedule = (scheduleData: any) => {
    if (userSchedule) {
      window.CLASS_SCHEDULES = window.CLASS_SCHEDULES.map(s =>
        s.memberId === user.id ? { ...s, ...scheduleData } : s
      );
    } else {
      window.CLASS_SCHEDULES = [
        ...window.CLASS_SCHEDULES,
        { memberId: user.id, ...scheduleData },
      ];
    }
    app.showToast('Class schedule updated');
  };

  return (
    <>
      <PageHeader eyebrow="Profile" title="My Profile" subtitle="Personal details and emergency contact information." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        <Card style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar member={m} size={110} />
          </div>
          <h2 style={{ fontFamily: FONTS.serif, fontSize: 26, margin: '18px 0 4px', fontWeight: 500 }}>{m.name}</h2>
          <div style={{ fontSize: 13, color: theme.dim }}>{m.email}</div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 6 }}>
            <SectionTag section={m.section} />
            <Chip tone="neutral">{m.role}</Chip>
          </div>
        </Card>
        <Card>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, margin: '0 0 14px', fontWeight: 500 }}>Member details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Student ID" value={m.id} readOnly />
            <Field label="Year level" value={m.year} readOnly />
            <Field label="Committee" value={m.committee} readOnly />
            <Field label="Voice section" value={m.section} readOnly />
            <Field label="Emergency contact name" placeholder="e.g. Maria Marquez" />
            <Field label="Emergency contact #" placeholder="e.g. +63 917 xxx xxxx" />
          </div>
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${theme.line}` }}>
            <h4 style={{ fontFamily: FONTS.serif, fontSize: 17, margin: 0, fontWeight: 500 }}>Notifications</h4>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={notifications.excuseDecision}
                  onChange={e => setNotifications({ ...notifications, excuseDecision: e.target.checked })}
                />{' '}
                Email me when an excuse is decided
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={notifications.rehearsalReminder}
                  onChange={e => setNotifications({ ...notifications, rehearsalReminder: e.target.checked })}
                />{' '}
                Remind me 1h before rehearsals
              </label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={notifications.weeklyDigest}
                    onChange={e => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                  />{' '}
                  Weekly attendance digest
                </label>
                {notifications.weeklyDigest && (
                  <button
                    onClick={() => setShowDigest(true)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11.5,
                      background: theme.green,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontFamily: FONTS.sans,
                    }}
                  >
                    View this week
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, margin: 0, fontWeight: 500 }}>Class Schedule</h3>
            <div style={{ fontSize: 12, color: theme.dim, marginTop: 4 }}>
              {userSchedule ? `${userSchedule.term} · ${userSchedule.classes.length} classes` : 'Add your class schedule to see conflicts with choir events'}
            </div>
          </div>
          <Button
            icon={userSchedule ? 'edit' : 'plus'}
            onClick={() => setShowScheduleModal(true)}
          >
            {userSchedule ? 'Edit Schedule' : 'Add Schedule'}
          </Button>
        </div>

        {userSchedule && userSchedule.classes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {userSchedule.classes.map((cls: any, i: number) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 2fr 1fr 120px 80px',
                  gap: 12,
                  padding: 12,
                  background: theme.cream,
                  borderRadius: 8,
                  fontSize: 13,
                  alignItems: 'center',
                }}
              >
                <div style={{ fontFamily: FONTS.mono, fontWeight: 600, color: theme.green }}>
                  {cls.code}
                </div>
                <div>{cls.name}</div>
                <div style={{ fontSize: 12, color: theme.dim }}>
                  {cls.days.join(', ')}
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 12 }}>
                  {cls.startTime} - {cls.endTime}
                </div>
                <div style={{ fontSize: 11, color: theme.dim }}>{cls.room}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showDigest && <WeeklyDigestModal onClose={() => setShowDigest(false)} />}
      {showScheduleModal && (
        <ClassScheduleModal
          schedule={userSchedule}
          onClose={() => setShowScheduleModal(false)}
          onSave={handleSaveSchedule}
        />
      )}
    </>
  );
}
