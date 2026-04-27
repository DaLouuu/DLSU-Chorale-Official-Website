import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme, useRouter } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { supabase } from '../../supabase';
import { EVENTS, MEMBERS } from '../../data';
import {
  EventSignup,
  getEventMeta,
  getEventSignups,
  initializeEventSignups,
  setEventMeta,
  updateSignupStatus,
} from '../../utils/eventSignups';

// ── Types ────────────────────────────────────────────────────────────────────

type DbEvent = {
  event_id: number;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  event_type: string | null;
  is_castable: string | null;
  // New columns (added by migration)
  name: string | null;
  venue: string | null;
  call_time: string | null;
  attire: string | null;
  repertoire: string[] | null;
  signup_deadline: string | null;
  cast_size: number | null;
  file_url: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  updated_by: string | null;
};

type FormData = {
  name: string;
  type: 'rehearsal' | 'performance' | 'social' | 'competition' | 'festival' | 'request';
  date: string;
  venue: string;
  call_time: string;
  attire: string;
  repertoire: string[];
  signup_deadline: string;
  cast_size: string;
  file_url: string;
  role_slots_text: string;
  major_event_enabled: boolean;
  exam_required: boolean;
  ensemble_type: string;
};

type AutoFilledKey = keyof Omit<FormData, 'file_url'>;

const EMPTY_FORM: FormData = {
  name: '', type: 'rehearsal', date: '', venue: '',
  call_time: '', attire: '', repertoire: [], signup_deadline: '', cast_size: '', file_url: '',
  role_slots_text: '', major_event_enabled: false, exam_required: false, ensemble_type: '',
};

const EVENT_TYPE_LABELS: Record<FormData['type'], string> = {
  rehearsal: 'Rehearsal',
  performance: 'Performance',
  social: 'Social',
  competition: 'Competition',
  festival: 'Festival',
  request: 'Request',
};

const EVENT_TYPE_CHIP: Record<string, 'neutral' | 'green' | 'amber' | 'blue' | 'red'> = {
  performance: 'green',
  social: 'blue',
  competition: 'blue',
  festival: 'amber',
  request: 'red',
  rehearsal: 'neutral',
};

// ── PDF text extraction ───────────────────────────────────────────────────────

async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  // Decode as latin-1 so every byte becomes a char — PDF binary survives
  const raw = new TextDecoder('iso-8859-1').decode(buf);
  const parts: string[] = [];
  // Capture all PDF string objects: content between ( … ) with basic escape handling
  const re = /\(([^)\\]{0,400}(?:\\.[^)\\]{0,400})*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const s = m[1]
      .replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\t/g, ' ')
      .replace(/\\([^nrt])/g, '$1');
    // Keep only strings with readable content
    if (s.length >= 2 && /[a-zA-Z0-9]/.test(s)) parts.push(s);
  }
  return parts.join(' ');
}

function parsePrPdf(text: string): Partial<FormData> & { autoFilled: AutoFilledKey[] } {
  const result: Partial<FormData> = {};
  const autoFilled: AutoFilledKey[] = [];

  const grab = (re: RegExp, max = 100) => {
    const m = text.match(re);
    return m ? m[1].trim().slice(0, max) : null;
  };

  // Event name / title
  const name = grab(/Event\s+Title[:\s]+([^\n(]{3,100})/i)
    || grab(/Event[:\s]+([^\n(]{3,80})/i);
  if (name) { result.name = name; autoFilled.push('name'); }

  // Date — "March 22, 2026" or "March 22 2026"
  const rawDate = grab(/Event\s+Date[:\s]+([A-Za-z]+ \d{1,2},?\s*\d{4})/i);
  if (rawDate) {
    const d = new Date(rawDate.replace(/\s*\([^)]*\)/g, ''));
    if (!isNaN(d.getTime())) { result.date = d.toISOString().split('T')[0]; autoFilled.push('date'); }
  }

  // Venue
  const venue = grab(/Venue[:\s]+([^\n(]{3,100})/i);
  if (venue) { result.venue = venue; autoFilled.push('venue'); }

  // Cast size
  const cast = grab(/Number\s+of\s+Performers[:\s]+(\d+)/i) || grab(/(\d{1,3})\s+performers/i);
  if (cast && !isNaN(Number(cast))) { result.cast_size = cast.trim(); autoFilled.push('cast_size'); }

  // Repertoire — song request line
  const song = grab(/Song\s+requests?[:\s]+([^\n(]{2,100})/i);
  if (song) { result.repertoire = [song]; autoFilled.push('repertoire'); }

  // Attire
  const attire = grab(/Attire[:\s]+([^\n(]{3,150})/i);
  if (attire) { result.attire = attire; autoFilled.push('attire'); }

  // Call time — "March 22 - 7 AM" or "7:00 AM" in Soundcheck/Rehearsal line
  const ctLine = text.match(/(?:Soundcheck|Rehearsal)[^:]*[:\s]+[A-Za-z]+ \d+\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i)
    || text.match(/(?:call\s*time|start)[:\s]+(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (ctLine) {
    let h = parseInt(ctLine[1], 10);
    const min = ctLine[2] ? parseInt(ctLine[2], 10) : 0;
    const ap = (ctLine[3] ?? 'AM').toUpperCase();
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    result.call_time = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    autoFilled.push('call_time');
  }

  // Mark as a "request" type since this is a performance request form
  if (autoFilled.length > 0) { result.type = 'request'; autoFilled.push('type'); }

  return { ...result, autoFilled };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function displayName(ev: DbEvent) {
  return ev.name || ev.notes || `Event #${ev.event_id}`;
}

function displayType(ev: DbEvent) {
  const t = (ev.event_type ?? '').toLowerCase();
  if (t === 'performance') return 'Performance';
  if (t === 'social') return 'Social';
  if (t === 'competition') return 'Competition';
  if (t === 'festival') return 'Festival';
  if (t === 'request') return 'Request';
  return 'Rehearsal';
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(t: string | null) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function normalizeKey(raw: string): string {
  return raw.toLowerCase().replace(/[\s_-]+/g, '_');
}

function parseRoleSlotsText(input: string) {
  // One role per line: Committee | Role | Limit
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [committee, role, limitRaw] = line.split('|').map(p => p.trim());
      const limit = Number(limitRaw);
      return {
        committee: committee ?? '',
        role: role ?? '',
        limit: Number.isFinite(limit) ? limit : 0,
      };
    })
    .filter(row => row.committee && row.role && row.limit > 0);
}

function roleSlotsToText(slots: { committee: string; role: string; limit: number }[]) {
  return slots.map(s => `${s.committee} | ${s.role} | ${s.limit}`).join('\n');
}

const CSV_FIELD_MAP: Record<string, AutoFilledKey> = {
  name: 'name', event_name: 'name', title: 'name',
  type: 'type', event_type: 'type',
  date: 'date', event_date: 'date',
  venue: 'venue', location: 'venue',
  call_time: 'call_time', calltime: 'call_time', start_time: 'call_time',
  attire: 'attire', dress_code: 'attire', uniform: 'attire',
  repertoire: 'repertoire', program: 'repertoire', pieces: 'repertoire',
  signup_deadline: 'signup_deadline', deadline: 'signup_deadline', registration_deadline: 'signup_deadline',
  cast_size: 'cast_size', ensemble_size: 'cast_size', slots: 'cast_size',
};

function parseCSVText(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { values.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    values.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

function rowToForm(row: Record<string, string>): Partial<FormData> & { autoFilled: AutoFilledKey[] } {
  const result: Partial<FormData> = {};
  const autoFilled: AutoFilledKey[] = [];

  for (const [rawKey, rawVal] of Object.entries(row)) {
    const mapped = CSV_FIELD_MAP[normalizeKey(rawKey)];
    if (!mapped || !rawVal) continue;

    if (mapped === 'type') {
      const v = rawVal.toLowerCase();
      if (v.includes('social')) result.type = 'social';
      else if (v.includes('comp')) result.type = 'competition';
      else if (v.includes('fest')) result.type = 'festival';
      else if (v.includes('req')) result.type = 'request';
      else if (v.includes('perf')) result.type = 'performance';
      else result.type = 'rehearsal';
    } else if (mapped === 'repertoire') {
      result.repertoire = rawVal.split(/[;|]/).map(s => s.trim()).filter(Boolean);
    } else if (mapped === 'cast_size') {
      const n = parseInt(rawVal, 10);
      if (!isNaN(n)) result.cast_size = String(n);
    } else {
      (result as any)[mapped] = rawVal;
    }
    autoFilled.push(mapped);
  }

  return { ...result, autoFilled };
}

function getMissingColumnFromError(message: string): string | null {
  const quoted = message.match(/'([^']+)'/);
  return quoted?.[1] ?? null;
}

async function safeUpdateEventRow(eventId: number, payload: Record<string, any>) {
  const nextPayload = { ...payload };
  // Retry by progressively removing missing columns from payload.
  for (let i = 0; i < 30; i++) {
    const { error } = await supabase.from('events').update(nextPayload).eq('event_id', eventId);
    if (!error) return { error: null };
    if (!error.message?.includes('column')) return { error };
    const missing = getMissingColumnFromError(error.message);
    if (!missing || !(missing in nextPayload)) return { error };
    delete nextPayload[missing];
    if (Object.keys(nextPayload).length === 0) break;
  }
  return { error: { message: 'Could not save event due to repeated schema mismatch. Please run migrations.' } };
}

async function safeInsertEventRow(payload: Record<string, any>) {
  const nextPayload = { ...payload };
  for (let i = 0; i < 30; i++) {
    const { data, error } = await supabase
      .from('events')
      .insert(nextPayload)
      .select('event_id')
      .single();
    if (!error) return { data, error: null };
    if (!error.message?.includes('column')) return { data: null, error };
    const missing = getMissingColumnFromError(error.message);
    if (!missing || !(missing in nextPayload)) return { data: null, error };
    delete nextPayload[missing];
    if (Object.keys(nextPayload).length === 0) break;
  }
  // Last fallback for legacy schema: use guaranteed older columns only.
  const legacyPayload: Record<string, any> = {
    event_date: payload.event_date ?? payload.date ?? null,
    start_time: payload.call_time ? `${String(payload.call_time).trim()}:00` : null,
    end_time: null,
    notes: payload.name ?? payload.notes ?? null,
    event_type: payload.event_type ?? 'rehearsal',
    is_castable: null,
  };
  const { data, error } = await supabase
    .from('events')
    .insert(legacyPayload)
    .select('event_id')
    .single();
  if (!error) return { data, error: null };
  return { data: null, error };
}

async function safeInsertEventRows(rows: Record<string, any>[]) {
  let nextRows = rows.map(r => ({ ...r }));
  for (let i = 0; i < 30; i++) {
    const { error } = await supabase.from('events').insert(nextRows);
    if (!error) return { error: null };
    if (!error.message?.includes('column')) return { error };
    const missing = getMissingColumnFromError(error.message);
    if (!missing) return { error };
    nextRows = nextRows.map(r => {
      const copy = { ...r };
      delete copy[missing];
      return copy;
    });
    if (nextRows.every(r => Object.keys(r).length === 0)) break;
  }
  const legacyRows = rows.map(r => ({
    event_date: r.event_date ?? null,
    start_time: r.call_time ? `${String(r.call_time).trim()}:00` : null,
    end_time: null,
    notes: r.name ?? r.notes ?? null,
    event_type: r.event_type ?? 'rehearsal',
    is_castable: null,
  }));
  const { error } = await supabase.from('events').insert(legacyRows);
  return { error };
}

// ── RepertoireInput ──────────────────────────────────────────────────────────

function RepertoireInput({
  value, onChange, autoFilled,
}: { value: string[]; onChange: (v: string[]) => void; autoFilled: boolean }) {
  const { theme } = useTheme();
  const [input, setInput] = useState('');

  const add = () => {
    const t = input.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput('');
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: value.length ? 8 : 0 }}>
        {value.map((piece, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 20,
              background: theme.cream, border: `1px solid ${theme.line}`,
              fontSize: 12.5, color: theme.ink, fontFamily: FONTS.sans,
            }}
          >
            {piece}
            <button
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.dim, padding: '0 2px', fontSize: 14, lineHeight: 1 }}
            >×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Add piece and press Enter…"
          style={{
            flex: 1, padding: '9px 12px',
            border: `1px solid ${autoFilled ? '#c9a84c' : theme.lineDark}`,
            background: autoFilled ? '#fef9ec' : theme.paper,
            borderRadius: 8, fontSize: 13.5, fontFamily: FONTS.sans,
            color: theme.ink, outline: 'none',
          }}
        />
        <button
          onClick={add}
          style={{
            padding: '9px 14px', background: theme.green, color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13,
          }}
        >Add</button>
      </div>
    </div>
  );
}

// ── FileUploadZone ───────────────────────────────────────────────────────────

type UploadResult = {
  fileUrl: string;
  rows: Record<string, string>[] | null;
  isBulk: boolean;
  parseError: string | null;
  parsedForm?: { fields: Partial<FormData>; autoFilled: AutoFilledKey[] };
};

function FileUploadZone({
  onResult,
  onClear,
  fileUrl,
  uploading,
}: {
  onResult: (r: UploadResult) => void;
  onClear: () => void;
  fileUrl: string;
  uploading: boolean;
}) {
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setStatus('Uploading…');
    setError(null);

    // 1. Try to upload to Supabase Storage — failure is non-fatal, CSV parsing still runs
    let fileUrl = '';
    try {
      const path = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('events')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadErr) {
        console.warn('[FileUpload] Storage error:', uploadErr.message);
      } else if (uploadData) {
        fileUrl = supabase.storage.from('events').getPublicUrl(uploadData.path).data.publicUrl;
      }
    } catch (e) {
      console.warn('[FileUpload] Storage unavailable — continuing without attachment URL:', e);
    }

    // 2. Parse if CSV or Excel
    const name = file.name.toLowerCase();
    let rows: Record<string, string>[] | null = null;
    let parseError: string | null = null;

    if (name.endsWith('.csv')) {
      setStatus('Parsing CSV…');
      try {
        const text = await file.text();
        rows = parseCSVText(text);
        if (rows.length === 0) parseError = 'CSV appears empty or has no data rows.';
      } catch {
        parseError = 'Could not read CSV file.';
      }
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      parseError = 'Excel auto-fill is not supported yet — file was uploaded. To auto-fill fields, save your spreadsheet as CSV first.';
    } else if (name.endsWith('.pdf')) {
      setStatus('Reading PDF…');
      try {
        const text = await extractPdfText(file);
        if (text.length > 30) {
          const { autoFilled, ...fields } = parsePrPdf(text);
          if (autoFilled.length > 0) {
            onResult({ fileUrl, rows: null, isBulk: false, parseError: null, parsedForm: { fields, autoFilled } });
            setStatus(null);
            return;
          }
        }
        // PDF yielded no fields — just attach
        parseError = null;
      } catch {
        parseError = null;
      }
    }
    // Images — just attach, no auto-fill possible without OCR

    setStatus(null);
    onResult({
      fileUrl,
      rows,
      isBulk: (rows?.length ?? 0) > 1,
      parseError,
    });
  }, [onResult]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  if (fileUrl) {
    const fileName = decodeURIComponent(fileUrl.split('/').pop() ?? 'File');
    return (
      <div
        style={{
          padding: '12px 16px', borderRadius: 10, border: `1px solid ${theme.line}`,
          background: theme.cream, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
        }}
      >
        <Icon name="file" size={18} stroke={theme.green} />
        <div style={{ flex: 1, fontSize: 13, color: theme.ink }}>
          <a href={fileUrl} target="_blank" rel="noreferrer" style={{ color: theme.green, textDecoration: 'none' }}>
            {fileName.replace(/^\d+_/, '')}
          </a>
          <div style={{ fontSize: 11, color: theme.dim, marginTop: 2 }}>Attached</div>
        </div>
        <button
          onClick={onClear}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.dim, padding: 4 }}
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? '#c9a84c' : theme.lineDark}`,
        borderRadius: 12, padding: '24px 20px', textAlign: 'center',
        cursor: 'pointer', marginBottom: 20,
        background: dragOver ? '#fef9ec' : theme.cream,
        transition: 'all 0.15s',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
      <Icon name="download" size={22} stroke={uploading ? '#c9a84c' : theme.dim} />
      <div style={{ marginTop: 8, fontSize: 13.5, color: theme.ink }}>
        {status ?? 'Drop a file or click to browse'}
      </div>
      <div style={{ fontSize: 11.5, color: theme.dim, marginTop: 4 }}>
        PDF (CAO request form auto-fills) · CSV (bulk import) · Image (attaches only)
      </div>
      {error && <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}>{error}</div>}
    </div>
  );
}

// ── FormField helper ─────────────────────────────────────────────────────────

function FormField({
  label, children, autoFilled, hint,
}: { label: string; children: React.ReactNode; autoFilled?: boolean; hint?: string }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <label style={{ fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 1.2, textTransform: 'uppercase', color: theme.dim }}>
          {label}
        </label>
        {autoFilled && (
          <span style={{
            fontSize: 9, fontFamily: FONTS.mono, letterSpacing: 1,
            background: '#c9a84c22', color: '#9a7228', padding: '1px 6px',
            borderRadius: 4, textTransform: 'uppercase',
          }}>auto-filled</span>
        )}
      </div>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#9a7228' }}>{hint}</div>}
    </div>
  );
}

function inputStyle(theme: any, autoFilled: boolean) {
  return {
    width: '100%', padding: '9px 12px', boxSizing: 'border-box' as const,
    border: `1px solid ${autoFilled ? '#c9a84c' : theme.lineDark}`,
    background: autoFilled ? '#fef9ec' : theme.paper,
    borderRadius: 8, fontSize: 13.5, fontFamily: FONTS.sans,
    color: theme.ink, outline: 'none',
  };
}

// ── BatchPreview ─────────────────────────────────────────────────────────────

function BatchPreview({
  rows, onConfirm, onCancel, saving,
}: {
  rows: Record<string, string>[];
  onConfirm: (forms: FormData[]) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { theme } = useTheme();
  const forms: FormData[] = rows.map(row => {
    const { autoFilled: _, ...fields } = rowToForm(row);
    return { ...EMPTY_FORM, ...fields };
  });

  const valid = forms.filter(f => f.name && f.date);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>
          File Import
        </div>
        <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '6px 0 4px', fontWeight: 500 }}>
          Create {rows.length} Events
        </h3>
        <div style={{ fontSize: 13, color: theme.dim }}>
          Review the parsed events below. {rows.length - valid.length > 0 && (
            <span style={{ color: '#d97706' }}>{rows.length - valid.length} row(s) missing name or date will be skipped.</span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: theme.cream, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: theme.dim }}>
                {['Name', 'Type', 'Date', 'Venue', 'Call Time'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forms.map((f, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${theme.line}`, opacity: (!f.name || !f.date) ? 0.4 : 1 }}>
                  <td style={{ padding: '10px 12px' }}>{f.name || <span style={{ color: theme.dim }}>—</span>}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <Chip tone={EVENT_TYPE_CHIP[f.type] ?? 'neutral'}>{EVENT_TYPE_LABELS[f.type] ?? f.type}</Chip>
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: FONTS.mono, fontSize: 12 }}>{f.date || '—'}</td>
                  <td style={{ padding: '10px 12px', color: theme.dim }}>{f.venue || '—'}</td>
                  <td style={{ padding: '10px 12px', fontFamily: FONTS.mono, fontSize: 12 }}>{f.call_time ? fmtTime(f.call_time) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ padding: '16px 24px', borderTop: `1px solid ${theme.line}`, display: 'flex', gap: 10, justifyContent: 'flex-end', background: theme.cream }}>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button
          icon="check"
          onClick={() => onConfirm(valid)}
          disabled={valid.length === 0 || saving}
        >
          {saving ? 'Creating…' : `Create ${valid.length} Event${valid.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}

// ── ChangeSummaryModal ───────────────────────────────────────────────────────

function ChangeSummaryModal({
  changes, onConfirm, onCancel,
}: {
  changes: { field: string; from: string; to: string }[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  return (
    <div
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: theme.paper, borderRadius: 14, maxWidth: 460, width: '100%', border: `1px solid ${theme.line}`, overflow: 'hidden' }}
      >
        <div style={{ padding: '20px 24px', background: theme.cream, borderBottom: `1px solid ${theme.line}` }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Edit summary</div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, margin: '6px 0 0', fontWeight: 500 }}>Key fields changed</h3>
        </div>
        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 13, color: theme.dim, marginBottom: 16 }}>
            The following changes would normally trigger an email to signed-up members. Confirm to save.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {changes.map(c => (
              <div key={c.field} style={{ padding: '10px 14px', borderRadius: 8, background: '#fef9ec', border: '1px solid #e8d99a' }}>
                <div style={{ fontSize: 10.5, fontFamily: FONTS.mono, letterSpacing: 1, color: '#9a7228', textTransform: 'uppercase', marginBottom: 4 }}>{c.field}</div>
                <div style={{ fontSize: 13, color: theme.dim, textDecoration: 'line-through' }}>{c.from || '—'}</div>
                <div style={{ fontSize: 13, color: theme.ink, fontWeight: 500 }}>→ {c.to || '—'}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${theme.line}`, display: 'flex', gap: 10, justifyContent: 'flex-end', background: theme.cream }}>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button icon="check" onClick={onConfirm}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

function SignupsOverviewModal({
  event,
  onClose,
  onUpdated,
}: {
  event: DbEvent;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { theme } = useTheme();
  const signups = getEventSignups(String(event.event_id));
  const approved = signups.filter(s => s.status === 'approved');
  const pendingRoleRequests = signups.filter(
    s => s.status === 'pending' && s.type === 'non_performing_role',
  );
  const performingApproved = approved.filter(s => s.isPerforming);
  const nonPerformingApproved = approved.filter(s => !s.isPerforming);

  const byCommittee = approved.reduce<Record<string, number>>((acc, s) => {
    const key = s.committee || 'Unspecified';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const byVoice = performingApproved.reduce<Record<string, number>>((acc, s) => {
    const key = s.section || 'Unspecified';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const update = (memberId: number, roleName: string | null, status: 'approved' | 'rejected') => {
    updateSignupStatus(String(event.event_id), memberId, roleName, status);
    onUpdated();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.paper, borderRadius: 14, width: '100%', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${theme.line}` }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>Event signups</div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '6px 0 0', fontWeight: 500 }}>{displayName(event)}</h3>
        </div>

        <div style={{ padding: 24, display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <Card><div style={{ fontSize: 12, color: theme.dim }}>Performing (approved)</div><div style={{ fontSize: 26, fontFamily: FONTS.serif }}>{performingApproved.length}</div></Card>
            <Card><div style={{ fontSize: 12, color: theme.dim }}>Non-performing (approved)</div><div style={{ fontSize: 26, fontFamily: FONTS.serif }}>{nonPerformingApproved.length}</div></Card>
            <Card><div style={{ fontSize: 12, color: theme.dim }}>Pending cross-committee</div><div style={{ fontSize: 26, fontFamily: FONTS.serif }}>{pendingRoleRequests.length}</div></Card>
          </div>

          <Card>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1.5, color: theme.green, textTransform: 'uppercase', marginBottom: 10 }}>Approved signups by committee</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(byCommittee).map(([k, v]) => <Chip key={k} tone="neutral">{k}: {v}</Chip>)}
              {Object.keys(byCommittee).length === 0 && <span style={{ fontSize: 12.5, color: theme.dim }}>No approved signups yet.</span>}
            </div>
          </Card>

          <Card>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1.5, color: theme.green, textTransform: 'uppercase', marginBottom: 10 }}>Performing signups by voice section</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(byVoice).map(([k, v]) => <Chip key={k} tone="green">{k}: {v}</Chip>)}
              {Object.keys(byVoice).length === 0 && <span style={{ fontSize: 12.5, color: theme.dim }}>No performing signups yet.</span>}
            </div>
          </Card>

          <Card>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1.5, color: theme.green, textTransform: 'uppercase', marginBottom: 10 }}>Pending cross-committee role requests</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingRoleRequests.length === 0 && <div style={{ fontSize: 12.5, color: theme.dim }}>No pending requests.</div>}
              {pendingRoleRequests.map((req, idx) => (
                <div key={`${req.memberId}-${idx}`} style={{ border: `1px solid ${theme.line}`, borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 13 }}>
                    <strong>{req.memberName}</strong> ({req.committee || 'No committee'}) requested <strong>{req.roleName}</strong> under <strong>{req.roleCommittee}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="sm" variant="outline" onClick={() => update(req.memberId, req.roleName, 'rejected')}>Reject</Button>
                    <Button size="sm" onClick={() => update(req.memberId, req.roleName, 'approved')}>Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${theme.line}`, background: theme.cream, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// ── EventDrawer ──────────────────────────────────────────────────────────────

function EventDrawer({
  editing,
  onClose,
  onSaved,
}: {
  editing: DbEvent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { theme } = useTheme();
  const { user } = useRouter();

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [autoFilled, setAutoFilled] = useState<Set<AutoFilledKey>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Batch mode — multiple rows from CSV/Excel
  const [batchRows, setBatchRows] = useState<Record<string, string>[] | null>(null);

  // Change summary modal
  const [pendingChanges, setPendingChanges] = useState<{ field: string; from: string; to: string }[] | null>(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (editing) {
      const meta = getEventMeta(String(editing.event_id));
      setForm({
        name: editing.name ?? editing.notes ?? '',
        type: (Object.keys(EVENT_TYPE_LABELS).includes(editing.event_type?.toLowerCase() ?? '')
          ? editing.event_type!.toLowerCase()
          : 'rehearsal') as FormData['type'],
        date: editing.event_date ?? '',
        venue: editing.venue ?? '',
        call_time: (editing.call_time ?? editing.start_time ?? '').replace(/\+.*$/, '').slice(0, 5),
        attire: editing.attire ?? '',
        repertoire: editing.repertoire ?? [],
        signup_deadline: editing.signup_deadline ?? '',
        cast_size: editing.cast_size != null ? String(editing.cast_size) : '',
        file_url: editing.file_url ?? '',
        role_slots_text: roleSlotsToText(meta.roleSlots),
        major_event_enabled: meta.majorEvent.enabled,
        exam_required: meta.majorEvent.examRequired,
        ensemble_type: meta.majorEvent.ensembleType ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setAutoFilled(new Set());
    setBatchRows(null);
    setSaveError(null);
  }, [editing]);

  const set = (k: keyof FormData, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleUploadResult = (r: UploadResult) => {
    setUploading(false);
    if (r.fileUrl) set('file_url', r.fileUrl);
    if (r.parseError) { setSaveError(r.parseError); return; }

    // PDF parsed directly into form fields
    if (r.parsedForm) {
      setForm(prev => ({ ...prev, ...r.parsedForm!.fields }));
      setAutoFilled(new Set(r.parsedForm!.autoFilled));
      return;
    }

    if (!r.rows || r.rows.length === 0) return;

    if (r.isBulk) {
      setBatchRows(r.rows);
    } else {
      const { autoFilled: filled, ...fields } = rowToForm(r.rows[0]);
      setForm(prev => ({ ...prev, ...fields }));
      setAutoFilled(new Set(filled));
    }
  };

  const getProfileUuid = async (): Promise<string | null> => {
    if (user?.profileUuid) return user.profileUuid;
    const { data } = await supabase.from('profiles').select('id').eq('school_id', user?.id).maybeSingle();
    return data?.id ?? null;
  };

  const doSave = async () => {
    setSaving(true);
    setSaveError(null);
    const profileId = await getProfileUuid();

    const payload: Record<string, any> = {
      name: form.name,
      event_type: form.type,
      event_date: form.date,
      venue: form.venue || null,
      call_time: form.call_time || null,
      attire: form.attire || null,
      repertoire: form.repertoire.length > 0 ? form.repertoire : null,
      signup_deadline: form.signup_deadline || null,
      cast_size: form.cast_size ? parseInt(form.cast_size, 10) : null,
      file_url: form.file_url || null,
      notes: form.name,
      updated_by: profileId,
    };

    let error: any = null;
    let savedEventId: number | null = editing?.event_id ?? null;

    if (editing) {
      const { error: e } = await safeUpdateEventRow(editing.event_id, payload);
      error = e;
    } else {
      const { data: inserted, error: e } = await safeInsertEventRow({ ...payload, created_by: profileId });
      error = e;
      savedEventId = inserted?.event_id ?? null;
    }

    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    if (savedEventId != null) {
      setEventMeta(String(savedEventId), {
        roleSlots: parseRoleSlotsText(form.role_slots_text),
        majorEvent: {
          enabled: form.major_event_enabled,
          examRequired: form.exam_required,
          ensembleType: form.ensemble_type.trim(),
        },
      });
    }
    onSaved();
    onClose();
  };

  const handleSave = async () => {
    if (!form.name || !form.date) { setSaveError('Name and date are required.'); return; }

    // Check if key fields changed (edit mode only)
    if (editing) {
      const changes: { field: string; from: string; to: string }[] = [];
      const prevDate = editing.event_date ?? '';
      const prevCallTime = (editing.call_time ?? editing.start_time ?? '').replace(/\+.*$/, '').slice(0, 5);
      const prevCast = editing.cast_size != null ? String(editing.cast_size) : '';

      if (form.date !== prevDate) changes.push({ field: 'Date', from: fmtDate(prevDate), to: fmtDate(form.date) });
      if (form.call_time !== prevCallTime) changes.push({ field: 'Call time', from: fmtTime(prevCallTime), to: fmtTime(form.call_time) });
      if (form.cast_size !== prevCast) changes.push({ field: 'Cast size', from: prevCast, to: form.cast_size });

      if (changes.length > 0) {
        setPendingChanges(changes);
        return;
      }
    }

    await doSave();
  };

  const handleBatchConfirm = async (forms: FormData[]) => {
    setSaving(true);
    setSaveError(null);
    const profileId = await getProfileUuid();

    const rows = forms.map(f => ({
      name: f.name, event_type: f.type, event_date: f.date,
      venue: f.venue || null, call_time: f.call_time || null,
      attire: f.attire || null,
      repertoire: f.repertoire.length > 0 ? f.repertoire : null,
      signup_deadline: f.signup_deadline || null,
      cast_size: f.cast_size ? parseInt(f.cast_size, 10) : null,
      file_url: form.file_url || null,
      notes: f.name,
      created_by: profileId,
    }));

    const { error } = await safeInsertEventRows(rows);
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    onSaved();
    onClose();
  };

  const isEditing = !!editing;
  const title = isEditing ? 'Edit Event' : 'Create Event';

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40 }} />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 520, maxWidth: '96vw',
          background: theme.paper, zIndex: 50,
          boxShadow: '-16px 0 64px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', background: theme.greenDark, color: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, opacity: 0.65, textTransform: 'uppercase' }}>
                {isEditing ? `Event #${editing?.event_id}` : 'New event'}
              </div>
              <h2 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '6px 0 0', fontWeight: 500 }}>{title}</h2>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 22, padding: 4 }}>×</button>
          </div>
          {isEditing && editing?.updated_at && (
            <div style={{ marginTop: 10, fontSize: 11.5, opacity: 0.65 }}>
              Last updated {new Date(editing.updated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </div>
          )}
        </div>

        {/* Batch preview mode */}
        {batchRows ? (
          <BatchPreview
            rows={batchRows}
            onConfirm={handleBatchConfirm}
            onCancel={() => setBatchRows(null)}
            saving={saving}
          />
        ) : (
          /* Form */
          <div style={{ flex: 1, overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* File upload */}
            <FileUploadZone
              onResult={handleUploadResult}
              onClear={() => { set('file_url', ''); setAutoFilled(new Set()); }}
              fileUrl={form.file_url}
              uploading={uploading}
            />

            {autoFilled.size > 0 && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef9ec', border: '1px solid #e8d99a', fontSize: 12.5, color: '#9a7228' }}>
                <strong>Auto-filled:</strong> {[...autoFilled].join(', ')} — review highlighted fields before saving.
              </div>
            )}

            {/* Name + Type */}
            <FormField label="Event name *" autoFilled={autoFilled.has('name')}>
              <input
                value={form.name}
                onChange={e => { set('name', e.target.value); setAutoFilled(prev => { const s = new Set(prev); s.delete('name'); return s; }); }}
                placeholder="e.g. Bayang Barok — Flagship Concert"
                style={inputStyle(theme, autoFilled.has('name'))}
              />
            </FormField>

            <FormField label="Type">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(Object.keys(EVENT_TYPE_LABELS) as FormData['type'][]).map(t => (
                  <button
                    key={t}
                    onClick={() => set('type', t)}
                    style={{
                      padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${form.type === t ? theme.green : theme.lineDark}`,
                      background: form.type === t ? theme.green : theme.paper,
                      color: form.type === t ? '#fff' : theme.ink,
                      fontSize: 13, fontFamily: FONTS.sans, fontWeight: form.type === t ? 500 : 400,
                      textTransform: 'capitalize',
                    }}
                  >{EVENT_TYPE_LABELS[t]}</button>
                ))}
              </div>
            </FormField>

            {/* Date + Signup deadline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="Date *" autoFilled={autoFilled.has('date')}>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => { set('date', e.target.value); setAutoFilled(prev => { const s = new Set(prev); s.delete('date'); return s; }); }}
                  style={inputStyle(theme, autoFilled.has('date'))}
                />
              </FormField>
              <FormField label="Sign-up deadline" autoFilled={autoFilled.has('signup_deadline')}>
                <input
                  type="date"
                  value={form.signup_deadline}
                  onChange={e => { set('signup_deadline', e.target.value); setAutoFilled(prev => { const s = new Set(prev); s.delete('signup_deadline'); return s; }); }}
                  style={inputStyle(theme, autoFilled.has('signup_deadline'))}
                />
              </FormField>
            </div>

            {/* Call time + Cast size */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="Call time" autoFilled={autoFilled.has('call_time')}>
                <input
                  type="time"
                  value={form.call_time}
                  onChange={e => { set('call_time', e.target.value); setAutoFilled(prev => { const s = new Set(prev); s.delete('call_time'); return s; }); }}
                  style={inputStyle(theme, autoFilled.has('call_time'))}
                />
              </FormField>
              <FormField label="Cast size" autoFilled={autoFilled.has('cast_size')}>
                <input
                  type="number"
                  value={form.cast_size}
                  onChange={e => { set('cast_size', e.target.value); setAutoFilled(prev => { const s = new Set(prev); s.delete('cast_size'); return s; }); }}
                  placeholder="e.g. 36"
                  min={0}
                  style={inputStyle(theme, autoFilled.has('cast_size'))}
                />
              </FormField>
            </div>

            {/* Venue */}
            <FormField label="Venue" autoFilled={autoFilled.has('venue')}>
              <input
                value={form.venue}
                onChange={e => { set('venue', e.target.value); setAutoFilled(prev => { const s = new Set(prev); s.delete('venue'); return s; }); }}
                placeholder="e.g. Teresa Yuchengco Auditorium"
                style={inputStyle(theme, autoFilled.has('venue'))}
              />
            </FormField>

            {/* Attire */}
            <FormField label="Attire" autoFilled={autoFilled.has('attire')}>
              <input
                value={form.attire}
                onChange={e => { set('attire', e.target.value); setAutoFilled(prev => { const s = new Set(prev); s.delete('attire'); return s; }); }}
                placeholder="e.g. Formal Filipiniana — Green Skirt / Barong"
                style={inputStyle(theme, autoFilled.has('attire'))}
              />
            </FormField>

            {/* Repertoire */}
            <FormField
              label="Repertoire"
              autoFilled={autoFilled.has('repertoire')}
              hint={autoFilled.has('repertoire') ? undefined : undefined}
            >
              <RepertoireInput
                value={form.repertoire}
                onChange={v => { set('repertoire', v); setAutoFilled(prev => { const s = new Set(prev); s.delete('repertoire'); return s; }); }}
                autoFilled={autoFilled.has('repertoire')}
              />
            </FormField>

            <FormField
              label="Non-performing role slots"
              hint="One per line: Committee | Role | Limit (e.g. Logistics | Stage Manager | 2)"
            >
              <textarea
                value={form.role_slots_text}
                onChange={e => set('role_slots_text', e.target.value)}
                rows={4}
                placeholder={`Logistics | Stage Manager | 2\nPublicity | Booth Manning | 3`}
                style={{ ...inputStyle(theme, false), resize: 'vertical' }}
              />
            </FormField>

            <FormField label="Major production / competition / festival settings">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={form.major_event_enabled}
                    onChange={e => set('major_event_enabled', e.target.checked)}
                  />
                  Mark as major event
                </label>
                {form.major_event_enabled && (
                  <>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={form.exam_required}
                        onChange={e => set('exam_required', e.target.checked)}
                      />
                      Exams required
                    </label>
                    <input
                      value={form.ensemble_type}
                      onChange={e => set('ensemble_type', e.target.value)}
                      placeholder="Ensemble format (e.g. Octet, Quartet, SATB chamber)"
                      style={inputStyle(theme, false)}
                    />
                  </>
                )}
              </div>
            </FormField>

            {saveError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12.5, color: '#dc2626', whiteSpace: 'pre-wrap' }}>
                {saveError}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!batchRows && (
          <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', gap: 10, justifyContent: 'flex-end', background: theme.cream, flexShrink: 0 }}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button icon="check" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create event'}
            </Button>
          </div>
        )}
      </div>

      {pendingChanges && (
        <ChangeSummaryModal
          changes={pendingChanges}
          onConfirm={async () => { setPendingChanges(null); await doSave(); }}
          onCancel={() => setPendingChanges(null)}
        />
      )}
    </>
  );
}

// ── Mock fallback ─────────────────────────────────────────────────────────────

function mockDbEvents(): DbEvent[] {
  return (EVENTS as any[]).map((e, i) => ({
    event_id: -(i + 1),
    event_date: e.date ?? '',
    start_time: e.callTime ?? null,
    end_time: null,
    notes: e.description ?? null,
    event_type: (e.type ?? 'performance').toLowerCase(),
    is_castable: null,
    name: e.name ?? null,
    venue: e.venue ?? null,
    call_time: e.callTime ?? null,
    attire: e.attire ?? null,
    repertoire: e.repertoire ?? null,
    signup_deadline: e.signupDeadline ?? null,
    cast_size: e.castSize ?? null,
    file_url: null,
    created_by: null,
    created_at: null,
    updated_at: null,
    updated_by: null,
  }));
}

// ── AdminEvents (main screen) ────────────────────────────────────────────────

const thStyle = { padding: '13px 16px', textAlign: 'left' as const, fontWeight: 500 };
const tdStyle = { padding: '11px 16px', verticalAlign: 'middle' as const };

type FilterType = 'all' | 'rehearsal' | 'performance' | 'social' | 'competition' | 'festival' | 'request';

export function AdminEvents() {
  const { theme } = useTheme();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<DbEvent | null>(null);
  const [manageEvent, setManageEvent] = useState<DbEvent | null>(null);
  const [signupsVersion, setSignupsVersion] = useState(0);

  async function load() {
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('event_id, event_date, start_time, end_time, notes, event_type, is_castable, name, venue, call_time, attire, repertoire, signup_deadline, cast_size, file_url, created_by, created_at, updated_at, updated_by')
        .order('event_date', { ascending: true });

      if (error) {
        setEvents(mockDbEvents());
      } else {
        setEvents(data && data.length > 0 ? (data as DbEvent[]) : mockDbEvents());
      }
    } catch {
      setEvents(mockDbEvents());
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    initializeEventSignups().then(() => setSignupsVersion(v => v + 1));
  }, []);

  const filtered = events.filter(ev => {
    if (filter === 'all') return true;
    const t = (ev.event_type ?? '').toLowerCase();
    if (filter === 'rehearsal') return t === '' || t === 'rehearsal';
    return t === filter;
  });

  const byType = (t: string) => events.filter(e => (e.event_type ?? '').toLowerCase() === t).length;
  const counts: Record<FilterType, number> = {
    all: events.length,
    rehearsal: events.filter(e => { const t = (e.event_type ?? '').toLowerCase(); return t === '' || t === 'rehearsal'; }).length,
    performance: byType('performance'),
    social: byType('social'),
    competition: byType('competition'),
    festival: byType('festival'),
    request: byType('request'),
  };

  const openCreate = () => { setEditing(null); setDrawerOpen(true); };
  const openEdit = (ev: DbEvent) => { setEditing(ev); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setEditing(null); };
  const onSaved = () => { load(); setSignupsVersion(v => v + 1); };

  const filterTab = (key: FilterType, label: string) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      style={{
        padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
        border: `1px solid ${filter === key ? theme.green : theme.lineDark}`,
        background: filter === key ? theme.green : 'transparent',
        color: filter === key ? '#fff' : theme.ink,
        fontSize: 13, fontFamily: FONTS.sans,
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      {label}
      <span style={{
        background: filter === key ? 'rgba(255,255,255,0.25)' : theme.cream,
        color: filter === key ? '#fff' : theme.dim,
        borderRadius: 10, padding: '1px 7px', fontSize: 11, fontFamily: FONTS.mono,
      }}>{counts[key]}</span>
    </button>
  );

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Events"
        subtitle="Create and manage all rehearsals and performances"
        actions={<Button icon="plus" onClick={openCreate}>Create Event</Button>}
      />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {filterTab('all', 'All')}
        {filterTab('rehearsal', 'Rehearsals')}
        {filterTab('performance', 'Performances')}
        {filterTab('social', 'Social')}
        {filterTab('competition', 'Competitions')}
        {filterTab('festival', 'Festivals')}
        {filterTab('request', 'Requests')}
      </div>

      <Card pad={0}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: theme.dim, fontFamily: FONTS.mono, fontSize: 13, letterSpacing: 1 }}>
            Loading events…
          </div>
        ) : fetchError ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ color: '#dc2626', fontFamily: FONTS.mono, fontSize: 12, marginBottom: 8 }}>Could not load events</div>
            <div style={{ color: theme.dim, fontSize: 13, marginBottom: 20, maxWidth: 420, margin: '0 auto 20px' }}>{fetchError}</div>
            <Button variant="outline" icon="refresh" onClick={load}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <div style={{ color: theme.dim, fontSize: 14, marginBottom: 16 }}>No events found.</div>
            <Button onClick={openCreate} icon="plus">Create the first event</Button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
              <thead>
                <tr style={{ background: theme.cream, fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: theme.dim }}>
                  <th style={thStyle}>Event</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Venue</th>
                  <th style={thStyle}>Sign-up deadline</th>
                  <th style={thStyle}>Cast</th>
                  <th style={thStyle}>Signups</th>
                  <th style={{ ...thStyle, textAlign: 'right' as const }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ev => (
                  <tr
                    key={ev.event_id}
                    style={{ borderTop: `1px solid ${theme.line}`, cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = theme.cream)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => openEdit(ev)}
                  >
                    {(() => {
                      const signups = getEventSignups(String(ev.event_id));
                      const approved = signups.filter(s => s.status === 'approved');
                      const performingCount = approved.filter(s => s.isPerforming).length;
                      const nonPerformingCount = approved.filter(s => !s.isPerforming).length;
                      const pendingCount = signups.filter(s => s.status === 'pending').length;
                      return (
                        <>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{displayName(ev)}</div>
                      {ev.attire && <div style={{ fontSize: 11, color: theme.dim, marginTop: 2 }}>{ev.attire}</div>}
                    </td>
                    <td style={tdStyle}>
                      <Chip tone={EVENT_TYPE_CHIP[(ev.event_type ?? '').toLowerCase()] ?? 'neutral'}>
                        {displayType(ev)}
                      </Chip>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: FONTS.mono, fontSize: 12 }}>{fmtDate(ev.event_date)}</td>
                    <td style={{ ...tdStyle, color: ev.venue ? theme.ink : theme.dim }}>
                      {ev.venue ?? '—'}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: FONTS.mono, fontSize: 12, color: theme.dim }}>
                      {fmtDate(ev.signup_deadline)}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: FONTS.mono, fontSize: 12 }}>
                      {ev.cast_size != null ? ev.cast_size : '—'}
                    </td>
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 12, color: theme.ink }}>P: {performingCount} · NP: {nonPerformingCount}</span>
                        {pendingCount > 0 && <span style={{ fontSize: 11, color: '#d97706' }}>{pendingCount} pending</span>}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setManageEvent(ev); setSignupsVersion(v => v + 1); }}
                        style={{
                          background: 'transparent', border: `1px solid ${theme.lineDark}`,
                          borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
                          fontSize: 12, color: theme.ink, fontFamily: FONTS.sans, marginRight: 8,
                        }}
                      >
                        Manage
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(ev); }}
                        style={{
                          background: 'transparent', border: `1px solid ${theme.lineDark}`,
                          borderRadius: 7, padding: '5px 12px', cursor: 'pointer',
                          fontSize: 12, color: theme.ink, fontFamily: FONTS.sans,
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <Icon name="edit" size={13} /> Edit
                      </button>
                    </td>
                        </>
                      );
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {drawerOpen && (
        <EventDrawer editing={editing} onClose={closeDrawer} onSaved={onSaved} />
      )}
      {manageEvent && (
        <SignupsOverviewModal
          key={`${manageEvent.event_id}-${signupsVersion}`}
          event={manageEvent}
          onClose={() => setManageEvent(null)}
          onUpdated={() => {
            setSignupsVersion(v => v + 1);
          }}
        />
      )}
    </>
  );
}
