import { useState, useEffect } from 'react';
import { useRouter, useTheme, useApp } from '../../App';
import { supabase } from '../../supabase';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { SectionTag } from '../ui/SectionTag';
import { Chip, StatusPill } from '../ui/Chip';
import { Field } from '../ui/Field';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';


function WeeklyDigestModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 640;
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.paper, borderRadius: 14, width: isMobile ? '100%' : 600, maxHeight: '85vh', overflowY: 'auto', border: `1px solid ${theme.line}` }}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Weekly Attendance Digest</div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>April 17-24, 2026</h3>
          <p style={{ fontSize: 13, color: theme.dim, margin: '6px 0 0' }}>Your attendance summary for this week</p>
        </div>

        <div style={{ padding: isMobile ? 18 : 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
            <div style={{ padding: 16, background: theme.greenSoft, borderRadius: 10 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: theme.greenDeep, textTransform: 'uppercase' }}>Present</div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 32, fontWeight: 500, color: theme.greenDeep, marginTop: 4 }}>{stats.present}</div>
            </div>
            <div style={{ padding: 16, background: theme.amberSoft, borderRadius: 10 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: theme.amber, textTransform: 'uppercase' }}>Late</div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 32, fontWeight: 500, color: theme.amber, marginTop: 4 }}>{stats.late}</div>
            </div>
            <div style={{ padding: 16, background: theme.redSoft, borderRadius: 10 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: theme.red, textTransform: 'uppercase' }}>Absent</div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 32, fontWeight: 500, color: theme.red, marginTop: 4 }}>{stats.absent}</div>
            </div>
          </div>

          <h4 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: '0 0 12px', fontWeight: 500 }}>Daily breakdown</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {weekData.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: theme.cream, borderRadius: 8, border: `1px solid ${theme.line}` }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{new Date(d.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                  <div style={{ fontSize: 12, color: theme.dim, fontFamily: FONTS.mono, marginTop: 2 }}>Check-in: {d.time}</div>
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

// ── PDF text extraction (shared) ─────────────────────────────────────────────

async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const raw = new TextDecoder('iso-8859-1').decode(buf);
  const parts: string[] = [];
  const re = /\(([^)\\]{0,400}(?:\\.[^)\\]{0,400})*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const s = m[1]
      .replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\t/g, ' ')
      .replace(/\\([^nrt])/g, '$1');
    if (s.length >= 2 && /[a-zA-Z0-9]/.test(s)) parts.push(s);
  }
  return parts.join(' ');
}

// Parse DLSU MyLasalle schedule PDF text — best-effort
function parseDlsuSchedulePdf(text: string) {
  const classes: any[] = [];
  // Look for course code patterns like "ST DISCM - S19" or "LBYCPA2" followed by time
  const courseRe = /([A-Z]{2,4}[A-Z0-9]*(?:\s+[A-Z0-9-]+)?)\s+(?:Lecture|Lab|Lec)\s+(\d{1,2}:\d{2}[AP]M)\s*[-–]\s*(\d{1,2}:\d{2}[AP]M)/gi;
  // Day extraction — look for "Monday", "Tuesday", etc. near each match
  const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  let m: RegExpExecArray | null;
  while ((m = courseRe.exec(text)) !== null) {
    const code = m[1].trim().replace(/\s+/g, ' ');
    const startRaw = m[2];
    const endRaw = m[3];

    const toMilitary = (t: string) => {
      const [time, ap] = [t.slice(0, -2), t.slice(-2).toUpperCase()];
      let [h, min] = time.split(':').map(Number);
      if (ap === 'PM' && h < 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
    };

    // Find which days appear near this match (within 200 chars before)
    const context = text.slice(Math.max(0, m.index - 200), m.index);
    const days = dayNames.filter(d => context.toLowerCase().includes(d.toLowerCase()));

    classes.push({
      code: code.split(/\s+/)[0],
      name: code,
      days: days.length ? days : ['Monday'],
      startTime: toMilitary(startRaw),
      endTime: toMilitary(endRaw),
      room: '',
    });
  }
  return classes;
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

// ── Military time picker (24-hour selects) ────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function MilitaryTimePicker({
  label,
  value,
  onChange,
  inputStyle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputStyle: React.CSSProperties;
}) {
  const { theme } = useTheme();
  const [hh, mm] = value && value.includes(':') ? value.split(':') : ['08', '00'];

  const nearestMinute = MINUTES.includes(mm) ? mm : '00';

  return (
    <div>
      <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <select
          value={hh}
          onChange={e => onChange(`${e.target.value}:${nearestMinute}`)}
          style={{ ...inputStyle, flex: 1, paddingRight: 6 }}
        >
          {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 16, color: theme.ink, flexShrink: 0 }}>:</span>
        <select
          value={nearestMinute}
          onChange={e => onChange(`${hh}:${e.target.value}`)}
          style={{ ...inputStyle, flex: 1, paddingRight: 6 }}
        >
          {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </div>
  );
}

// ── Class schedule modal ──────────────────────────────────────────────────────

function ClassScheduleModal({ schedule, onClose, onSave }: any) {
  const { theme } = useTheme();
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 768;
  const [formData, setFormData] = useState(
    schedule || { term: 'Term 3 2025-2026', classes: [] }
  );
  const [newClass, setNewClass] = useState({
    code: '', name: '', days: [] as string[], startTime: '08:00', endTime: '09:00', room: '',
  });
  const [csvStatus, setCsvStatus] = useState<string | null>(null);
  const [scheduleImage, setScheduleImage] = useState<string | null>(null);

  const handleScheduleFile = async (file: File) => {
    const name = file.name.toLowerCase();
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(name);
    const isPDF = name.endsWith('.pdf');

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => setScheduleImage(e.target?.result as string);
      reader.readAsDataURL(file);
      setCsvStatus('📷 Image attached for visual reference. Auto-fill from images is not possible — enter classes manually below, or export your schedule as CSV from MyLasalle and upload that instead.');
      return;
    }

    if (isPDF) {
      setCsvStatus('Reading PDF…');
      try {
        const text = await extractPdfText(file);
        if (text.length > 30) {
          const classes = parseDlsuSchedulePdf(text);
          if (classes.length > 0) {
            setFormData((prev: any) => ({ ...prev, classes: [...prev.classes, ...classes] }));
            setCsvStatus(`✓ ${classes.length} class${classes.length !== 1 ? 'es' : ''} extracted from PDF — verify days and rooms.`);
            return;
          }
        }
        // PDF had no parseable schedule — show as image if possible
        const reader = new FileReader();
        reader.onload = (e) => setScheduleImage(e.target?.result as string);
        reader.readAsDataURL(file);
        setCsvStatus('PDF attached. Could not auto-detect classes — enter them manually below, or export your schedule as CSV from MyLasalle for best results.');
      } catch {
        setCsvStatus('Could not read the PDF. Try exporting your schedule as CSV from MyLasalle.');
      }
      return;
    }

    if (!name.endsWith('.csv')) {
      setCsvStatus('Supported: CSV (auto-fill) · PDF (best-effort extract) · JPG/PNG (visual reference only)');
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
      setCsvStatus(`✓ ${classes.length} class${classes.length !== 1 ? 'es' : ''} loaded from CSV`);
    } catch {
      setCsvStatus('Could not read the file.');
    }
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

  const addClassToSchedule = () => {
    if (!newClass.code || !newClass.name || newClass.days.length === 0 || !newClass.startTime || !newClass.endTime) return;
    setFormData({ ...formData, classes: [...formData.classes, { ...newClass }] });
    setNewClass({ code: '', name: '', days: [], startTime: '08:00', endTime: '09:00', room: '' });
  };

  const removeClass = (index: number) => {
    setFormData({ ...formData, classes: formData.classes.filter((_: any, i: number) => i !== index) });
  };

  const toggleDay = (day: string) => {
    setNewClass(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
    }));
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.paper, borderRadius: 14, width: isMobile ? '100%' : 700, maxHeight: '85vh', overflowY: 'auto', border: `1px solid ${theme.line}` }}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: 0, fontWeight: 500 }}>
            {schedule ? 'Edit Class Schedule' : 'Add Class Schedule'}
          </h3>
          <p style={{ fontSize: 13, color: theme.dim, margin: '6px 0 0' }}>Add your classes to see schedule conflicts with choir events</p>
        </div>

        <div style={{ padding: isMobile ? 18 : 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Academic Term" value={formData.term} onChange={e => setFormData({ ...formData, term: e.target.value })} placeholder="e.g. Term 3 2025-2026" />

          {formData.classes.length > 0 && (
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Current Classes</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {formData.classes.map((cls: any, i: number) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '80px 1fr 130px auto', gap: 10, padding: 12, background: theme.cream, borderRadius: 8, alignItems: 'center', fontSize: 13 }}>
                    <div style={{ fontFamily: FONTS.mono, fontWeight: 600, color: theme.green }}>{cls.code}</div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{cls.name}</div>
                      <div style={{ fontSize: 11, color: theme.dim, marginTop: 2 }}>{cls.days.join(', ')}</div>
                    </div>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 12 }}>{cls.startTime} – {cls.endTime}</div>
                    <button onClick={() => removeClass(i)} style={{ padding: 6, background: 'transparent', border: `1px solid ${theme.red}`, borderRadius: 6, cursor: 'pointer', color: theme.red }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${theme.line}`, paddingTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Add New Class</h4>

            {/* File upload zone */}
            <label
              style={{ display: 'block', marginBottom: 16, padding: '14px 16px', border: `2px dashed ${theme.lineDark}`, borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: theme.cream, transition: 'border-color 0.15s' }}
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
                accept=".csv,.jpg,.jpeg,.png,.pdf"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleScheduleFile(f); e.target.value = ''; }}
              />
              <div style={{ fontSize: 13, color: theme.ink, marginBottom: 2 }}>📄 Drop a file or click to browse</div>
              <div style={{ fontSize: 11.5, color: theme.dim }}>
                CSV → auto-fill · PDF → best-effort extract · Image → visual reference only
              </div>
              {csvStatus && (
                <div style={{ marginTop: 8, fontSize: 12, color: csvStatus.startsWith('✓') ? '#16a34a' : '#d97706', fontWeight: csvStatus.startsWith('✓') ? 500 : 400 }}>
                  {csvStatus}
                </div>
              )}
            </label>

            {/* Image preview */}
            {scheduleImage && (
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <img src={scheduleImage} alt="Schedule" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 8, border: `1px solid ${theme.line}`, background: theme.cream }} />
                <button onClick={() => setScheduleImage(null)} style={{ position: 'absolute', top: 8, right: 8, background: theme.paper, border: `1px solid ${theme.line}`, borderRadius: 6, cursor: 'pointer', padding: '2px 8px', fontSize: 13, color: theme.ink }}>×</button>
              </div>
            )}

            {/* Code + name */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '100px 1fr', gap: 12, marginBottom: 12 }}>
              <input value={newClass.code} onChange={e => setNewClass({ ...newClass, code: e.target.value })} placeholder="Code" style={modalInput} />
              <input value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} placeholder="Class Name" style={modalInput} />
            </div>

            {/* Days */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Days</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    style={{ padding: '6px 12px', fontSize: 12, background: newClass.days.includes(day) ? theme.green : theme.cream, color: newClass.days.includes(day) ? '#fff' : theme.ink, border: `1px solid ${newClass.days.includes(day) ? theme.green : theme.line}`, borderRadius: 6, cursor: 'pointer', fontFamily: FONTS.sans }}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Time pickers (military) + room */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <MilitaryTimePicker
                label="Start Time"
                value={newClass.startTime}
                onChange={v => setNewClass({ ...newClass, startTime: v })}
                inputStyle={modalInput}
              />
              <MilitaryTimePicker
                label="End Time"
                value={newClass.endTime}
                onChange={v => setNewClass({ ...newClass, endTime: v })}
                inputStyle={modalInput}
              />
              <div>
                <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Room</label>
                <input value={newClass.room} onChange={e => setNewClass({ ...newClass, room: e.target.value })} placeholder="Optional" style={modalInput} />
              </div>
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
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(formData); onClose(); }} disabled={formData.classes.length === 0}>Save Schedule</Button>
        </div>
      </div>
    </div>
  );
}

// ── Member profile screen ─────────────────────────────────────────────────────

export function MemberProfile() {
  const { user } = useRouter();
  const { theme } = useTheme();
  const app = useApp();
  const m = user;
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 768;

  const [showDigest, setShowDigest] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(() => {
    try { return localStorage.getItem(`avatar_${user?.id}`) || null; } catch { return null; }
  });
  const [picPath, setPicPath] = useState<string | null>(() => {
    try { return localStorage.getItem(`avatar_path_${user?.id}`) || null; } catch { return null; }
  });
  const [picHover, setPicHover] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Editable profile fields
  const [pronouns, setPronouns] = useState('');
  const [performingStatus, setPerformingStatus] = useState<'performing' | 'non-performing'>('performing');
  const [memberStatus, setMemberStatus] = useState<'active' | 'inactive' | 'loa'>('active');
  const [savingProfile, setSavingProfile] = useState(false);
  const [userSchedule, setUserSchedule] = useState<{ term: string; classes: any[] } | null>(null);

  const profileUuid: string | null = (user as any)?._uuid ?? (user as any)?.profileUuid ?? null;

  // Load persisted profile data from Supabase on mount
  useEffect(() => {
    if (!profileUuid) return;
    supabase
      .from('profiles')
      .select('avatar_url, pronouns, current_term_stat, membership_status, class_schedule')
      .eq('id', profileUuid)
      .single()
      .then(({ data }) => {
        if (!data) return;
        if (data.avatar_url) {
          setProfilePic(data.avatar_url);
          try { localStorage.setItem(`avatar_${user.id}`, data.avatar_url); } catch {}
        }
        if (data.pronouns) setPronouns(data.pronouns);
        if (data.current_term_stat) {
          const val = (data.current_term_stat as string).toLowerCase();
          if (val === 'performing' || val === 'non-performing') setPerformingStatus(val as 'performing' | 'non-performing');
        }
        if (data.membership_status) {
          const val = (data.membership_status as string).toLowerCase();
          if (val === 'active' || val === 'inactive' || val === 'loa') setMemberStatus(val as 'active' | 'inactive' | 'loa');
        }
        if (data.class_schedule) {
          setUserSchedule(data.class_schedule as { term: string; classes: any[] });
        }
      });
  }, [profileUuid]);

  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pref_notifications') || '{}'); } catch {}
    return { excuseDecision: true, rehearsalReminder: true, weeklyDigest: false };
  });

  const setNotif = (patch: Record<string, boolean>) => {
    const next = { ...notifications, ...patch };
    setNotifications(next);
    try { localStorage.setItem('pref_notifications', JSON.stringify(next)); } catch {}
  };


  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `avatars/${user.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
        if (picPath && picPath !== path) {
          supabase.storage.from('avatars').remove([picPath]);
        }
        if (profileUuid) {
          await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profileUuid);
        }
        setProfilePic(publicUrl);
        setPicPath(path);
        try { localStorage.setItem(`avatar_${user.id}`, publicUrl); localStorage.setItem(`avatar_path_${user.id}`, path); } catch {}
        app.showToast('Profile picture updated');
        return;
      }
    } catch {}
    // Fallback: local FileReader
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setProfilePic(url);
      try { localStorage.setItem(`avatar_${user.id}`, url); } catch {}
      app.showToast('Profile picture updated');
    };
    reader.readAsDataURL(file);
    setUploading(false);
  };

  const handleRemoveProfilePic = async () => {
    if (picPath) {
      supabase.storage.from('avatars').remove([picPath]);
      setPicPath(null);
      try { localStorage.removeItem(`avatar_path_${user.id}`); } catch {}
    }
    if (profileUuid) {
      await supabase.from('profiles').update({ avatar_url: null }).eq('id', profileUuid);
    }
    setProfilePic(null);
    try { localStorage.removeItem(`avatar_${user.id}`); } catch {}
    app.showToast('Profile picture removed');
  };

  const handleSaveProfileDetails = async () => {
    if (!profileUuid) { app.showToast('Unable to save — profile ID missing', 'error'); return; }
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        pronouns,
        current_term_stat: performingStatus === 'performing' ? 'Performing' : 'Non-Performing',
        membership_status: memberStatus.charAt(0).toUpperCase() + memberStatus.slice(1),
      })
      .eq('id', profileUuid);
    setSavingProfile(false);
    if (error) { app.showToast('Failed to save profile', 'error'); }
    else { app.showToast('Profile saved'); }
  };

  const handleSaveSchedule = async (scheduleData: any) => {
    const next = { term: scheduleData.term, classes: scheduleData.classes };
    setUserSchedule(next);
    if (profileUuid) {
      const { error } = await supabase
        .from('profiles')
        .update({ class_schedule: next })
        .eq('id', profileUuid);
      if (error) { app.showToast('Failed to save schedule', 'error'); return; }
    }
    app.showToast('Class schedule updated');
  };

  // Shared select style matching Field component appearance
  const selectStyle: React.CSSProperties = {
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
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 32,
  };

  const fieldLabel: React.CSSProperties = {
    fontSize: 11.5,
    fontFamily: FONTS.mono,
    letterSpacing: 1,
    color: theme.dim,
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 5,
  };

  const STATUS_COLOR: Record<string, string> = {
    active: theme.green,
    inactive: theme.dim,
    loa: theme.amber,
  };

  const STATUS_LABEL: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    loa: 'LOA',
  };

  return (
    <>
      <PageHeader eyebrow="Profile" title="My Profile" subtitle="Personal details and emergency contact information." />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: 20 }}>

        {/* Avatar card */}
        <Card style={{ textAlign: 'center', padding: isMobile ? 22 : 32 }}>
          <div
            style={{ position: 'relative', width: 110, margin: '0 auto', cursor: uploading ? 'wait' : 'pointer' }}
            onMouseEnter={() => setPicHover(true)}
            onMouseLeave={() => setPicHover(false)}
          >
            <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProfilePicChange} disabled={uploading} />
              {profilePic ? (
                <img src={profilePic} alt="Profile" style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', display: 'block', border: `3px solid ${theme.line}` }} />
              ) : (
                <Avatar member={m} size={110} />
              )}
            </label>
            {(picHover || uploading) && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                {uploading
                  ? <div style={{ width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  : <Icon name="camera" size={22} stroke="#fff" />
                }
              </div>
            )}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: theme.dim }}>
            {uploading ? 'Uploading…' : 'Click to change photo'}
          </div>
          {profilePic && !uploading && (
            <button
              onClick={handleRemoveProfilePic}
              style={{ marginTop: 6, fontSize: 11, color: theme.red, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FONTS.sans, textDecoration: 'underline', padding: 0 }}
            >
              Remove photo
            </button>
          )}

          <h2 style={{ fontFamily: FONTS.serif, fontSize: 26, margin: '14px 0 4px', fontWeight: 500 }}>{m.name}</h2>
          <div style={{ fontSize: 13, color: theme.dim }}>{m.email}</div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 6 }}>
            <SectionTag section={m.section} />
            <Chip tone="neutral">{m.role}</Chip>
          </div>

          {/* Status badges */}
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 0.5, padding: '4px 10px', borderRadius: 20, border: `1px solid ${theme.green}`, color: theme.green, textTransform: 'uppercase' }}>
              {performingStatus === 'performing' ? 'Performing' : 'Non-Performing'}
            </span>
            <span style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 0.5, padding: '4px 10px', borderRadius: 20, border: `1px solid ${STATUS_COLOR[memberStatus]}`, color: STATUS_COLOR[memberStatus], textTransform: 'uppercase' }}>
              {STATUS_LABEL[memberStatus]}
            </span>
          </div>
        </Card>

        {/* Details card */}
        <Card>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, margin: '0 0 14px', fontWeight: 500 }}>Member details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <Field label="Student ID" value={m.id} readOnly />
            <Field label="Year level" value={m.year} readOnly />
            <Field label="Committee" value={m.committee} readOnly />
            <Field label="Voice section" value={m.section} readOnly />

            {/* Pronouns */}
            <div>
              <label style={fieldLabel}>Pronouns</label>
              <input
                value={pronouns}
                onChange={e => setPronouns(e.target.value)}
                placeholder="e.g. she/her, he/him, they/them"
                style={{ ...selectStyle, appearance: 'none', backgroundImage: 'none', paddingRight: 14 }}
              />
            </div>

            {/* Performing status */}
            <div>
              <label style={fieldLabel}>Performing Status</label>
              <select value={performingStatus} onChange={e => setPerformingStatus(e.target.value as any)} style={selectStyle}>
                <option value="performing">Performing</option>
                <option value="non-performing">Non-Performing</option>
              </select>
            </div>

            {/* Member status */}
            <div>
              <label style={fieldLabel}>Member Status</label>
              <select value={memberStatus} onChange={e => setMemberStatus(e.target.value as any)} style={selectStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="loa">LOA (Leave of Absence)</option>
              </select>
            </div>

            {/* Spacer to keep grid aligned */}
            {!isMobile && <div />}

            <Field label="Emergency contact name" placeholder="e.g. Maria Marquez" />
            <Field label="Emergency contact #" placeholder="e.g. +63 917 xxx xxxx" />
          </div>

          {/* Save profile details */}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
            <Button icon="check" onClick={handleSaveProfileDetails} disabled={savingProfile}>
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>

          {/* Notifications */}
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${theme.line}` }}>
            <h4 style={{ fontFamily: FONTS.serif, fontSize: 17, margin: 0, fontWeight: 500 }}>Notifications</h4>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, flexWrap: 'wrap' }}>
                <input type="checkbox" checked={!!notifications.excuseDecision} onChange={e => setNotif({ excuseDecision: e.target.checked })} />
                Email me when an excuse is decided
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, flexWrap: 'wrap' }}>
                <input type="checkbox" checked={!!notifications.rehearsalReminder} onChange={e => setNotif({ rehearsalReminder: e.target.checked })} />
                Remind me 1h before rehearsals
              </label>
              <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <input type="checkbox" checked={!!notifications.weeklyDigest} onChange={e => setNotif({ weeklyDigest: e.target.checked })} />
                  Weekly attendance digest
                </label>
                {notifications.weeklyDigest && (
                  <button onClick={() => setShowDigest(true)} style={{ padding: '4px 10px', fontSize: 11.5, background: theme.green, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: FONTS.sans }}>
                    View this week
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Class schedule card */}
      <Card style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 12, marginBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, margin: 0, fontWeight: 500 }}>Class Schedule</h3>
            <div style={{ fontSize: 12, color: theme.dim, marginTop: 4 }}>
              {userSchedule ? `${userSchedule.term} · ${userSchedule.classes.length} classes` : 'Add your class schedule to see conflicts with choir events'}
            </div>
          </div>
          <Button icon={userSchedule ? 'edit' : 'plus'} onClick={() => setShowScheduleModal(true)}>
            {userSchedule ? 'Edit Schedule' : 'Add Schedule'}
          </Button>
        </div>

        {userSchedule && userSchedule.classes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {userSchedule.classes.map((cls: any, i: number) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '100px 2fr 1fr 130px 80px', gap: 8, padding: 12, background: theme.cream, borderRadius: 8, fontSize: 13, alignItems: 'center' }}>
                <div style={{ fontFamily: FONTS.mono, fontWeight: 600, color: theme.green }}>{cls.code}</div>
                <div>{cls.name}</div>
                <div style={{ fontSize: 12, color: theme.dim }}>{cls.days.join(', ')}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 12 }}>{cls.startTime} – {cls.endTime}</div>
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
