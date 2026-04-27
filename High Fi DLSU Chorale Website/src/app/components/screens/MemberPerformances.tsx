import { useState, useEffect } from 'react';
import { useTheme, useApp, useRouter } from '../../App';

function useViewportWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}
import { notifyEventSignup } from '../../utils/email';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { SOCIAL_EVENTS } from '../../data';

// ── Types ────────────────────────────────────────────────────────────────────

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

type UnifiedEvent = {
  id: string;
  name: string;
  category: 'Performance' | 'Social' | 'Competition' | 'Festival' | 'Request' | 'Rehearsal';
  date: string;
  time: string;
  venue: string;
  attire?: string;
  description: string;
  repertoire?: string[];
  slots: number;
  signedUp: number;
  signupDeadline?: string;
  mySignup?: any;
  image?: string;
  forms?: { waiver?: FormConfig; excuse?: FormConfig };
};

type FilterCategory = 'all' | 'Performance' | 'Social' | 'Competition' | 'Festival' | 'Request';

const CATEGORY_STYLE: Record<string, { bg: string; color: string; tone: 'green' | 'blue' | 'amber' | 'red' | 'neutral' }> = {
  Performance: { bg: '#dcfce7', color: '#16a34a', tone: 'green' },
  Social:      { bg: '#dbeafe', color: '#2563eb', tone: 'blue' },
  Competition: { bg: '#ede9fe', color: '#7c3aed', tone: 'blue' },
  Festival:    { bg: '#fef3c7', color: '#d97706', tone: 'amber' },
  Request:     { bg: '#fee2e2', color: '#dc2626', tone: 'red' },
  Rehearsal:   { bg: '#f3f4f6', color: '#6b7280', tone: 'neutral' },
};

function normalize(e: any, defaultCategory?: string): UnifiedEvent {
  return {
    id: String(e.id),
    name: e.name,
    category: (e.type || defaultCategory || 'Performance') as UnifiedEvent['category'],
    date: e.date,
    time: e.callTime || e.time || '',
    venue: e.venue || '',
    attire: e.attire,
    description: e.description || '',
    repertoire: e.repertoire,
    slots: e.castSize ?? e.slots ?? 0,
    signedUp: e.signedUp ?? 0,
    signupDeadline: e.signupDeadline,
    mySignup: e.mySignup ?? null,
    image: e.image,
    forms: e.forms,
  };
}

// ── SignUpFormModal ────────────────────────────────────────────────────────────

function SignUpFormModal({
  event,
  onClose,
  onSubmit,
}: {
  event: UnifiedEvent;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { theme } = useTheme();
  const forms = event.forms || {};
  const activeForms = [
    forms.waiver?.enabled ? { key: 'waiver', ...forms.waiver } : null,
    forms.excuse?.enabled ? { key: 'excuse', ...forms.excuse } : null,
  ].filter((x): x is FormConfig & { key: string } => x !== null);

  const [step, setStep] = useState(0);
  const form = activeForms[step];
  const [values, setValues] = useState<Record<string, any>>({});
  const setVal = (fid: string, v: any) => setValues(x => ({ ...x, [step + '_' + fid]: v }));
  const val = (fid: string) => values[step + '_' + fid] || '';

  const canAdvance = form.fields.every(
    f => !f.required || (f.type === 'checkbox' ? val(f.id) === true : String(val(f.id)).trim()),
  );

  const next = () => {
    if (step < activeForms.length - 1) setStep(step + 1);
    else onSubmit();
  };

  const modalInput = {
    width: '100%', padding: '11px 14px',
    border: `1px solid ${theme.lineDark}`, borderRadius: 10,
    fontSize: 14, fontFamily: FONTS.sans,
    background: theme.paper, color: theme.ink,
    outline: 'none', boxSizing: 'border-box' as const,
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,32,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, padding: 24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: theme.paper, color: theme.ink, borderRadius: 14, width: 620, maxHeight: '85vh', overflowY: 'auto', border: `1px solid ${theme.line}` }}
      >
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${theme.line}`, background: theme.cream }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase' }}>
            Sign-up · {event.name}
          </div>
          <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: '6px 0 0', fontWeight: 500 }}>{form.title}</h3>
          {form.description && <p style={{ fontSize: 13, color: theme.dim, margin: '6px 0 0', lineHeight: 1.5 }}>{form.description}</p>}
          {activeForms.length > 1 && (
            <div style={{ marginTop: 12, fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1, color: theme.dim }}>
              Step {step + 1} of {activeForms.length}
            </div>
          )}
        </div>
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {form.fields.map(f => (
            <div key={f.id}>
              {f.type !== 'checkbox' && (
                <label style={{ fontSize: 11.5, fontFamily: FONTS.mono, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                  {f.label} {f.required && <span style={{ color: theme.red }}>*</span>}
                </label>
              )}
              {f.type === 'text' && <input value={val(f.id)} onChange={e => setVal(f.id, e.target.value)} style={modalInput} />}
              {f.type === 'number' && <input type="number" value={val(f.id)} onChange={e => setVal(f.id, e.target.value)} style={modalInput} />}
              {f.type === 'date' && <input type="date" value={val(f.id)} onChange={e => setVal(f.id, e.target.value)} style={modalInput} />}
              {f.type === 'textarea' && <textarea value={val(f.id)} onChange={e => setVal(f.id, e.target.value)} rows={3} style={{ ...modalInput, resize: 'vertical', fontFamily: FONTS.sans }} />}
              {f.type === 'file' && <input type="file" onChange={e => setVal(f.id, e.target.files?.[0]?.name || '')} style={{ ...modalInput, padding: 8 }} />}
              {f.type === 'checkbox' && (
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, lineHeight: 1.5, cursor: 'pointer', padding: 12, background: theme.cream, borderRadius: 8, border: `1px solid ${theme.line}` }}>
                  <input type="checkbox" checked={val(f.id) === true} onChange={e => setVal(f.id, e.target.checked)} style={{ marginTop: 3 }} />
                  <span>{f.label} {f.required && <span style={{ color: theme.red }}>*</span>}</span>
                </label>
              )}
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 28px', borderTop: `1px solid ${theme.line}`, display: 'flex', justifyContent: 'space-between', gap: 10, background: theme.cream }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!canAdvance} onClick={next} icon={step < activeForms.length - 1 ? undefined : 'check'}>
            {step < activeForms.length - 1 ? 'Next form →' : 'Submit & confirm sign-up'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── EventCard ─────────────────────────────────────────────────────────────────

function EventCard({ event: e, theme, onSignUp }: { event: UnifiedEvent; theme: any; onSignUp: () => void }) {
  const cs = CATEGORY_STYLE[e.category] ?? CATEGORY_STYLE.Rehearsal;
  const hasForm = e.forms?.waiver?.enabled || e.forms?.excuse?.enabled;

  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      {e.image ? (
        <div
          style={{
            height: 160,
            backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.48), transparent 55%), url(${e.image})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            position: 'relative', display: 'flex', alignItems: 'flex-end',
            color: '#fff', padding: '14px 18px',
          }}
        >
          <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 999, background: cs.bg, color: cs.color, fontSize: 11, fontFamily: FONTS.mono, letterSpacing: 0.5 }}>
                {e.category}
              </span>
              {hasForm && <Chip tone="amber">Forms required</Chip>}
            </div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 20, fontWeight: 500, marginTop: 8, lineHeight: 1.2 }}>{e.name}</div>
          </div>
          {e.mySignup && (
            <div style={{ position: 'absolute', top: 12, right: 14 }}>
              <Chip tone="green" icon="check">Signed up</Chip>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '14px 18px', background: cs.bg, borderBottom: `1px solid ${theme.line}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, background: cs.bg, color: cs.color, fontSize: 11, fontFamily: FONTS.mono, border: `1px solid ${cs.color}40` }}>
            {e.category}
          </span>
          <div style={{ fontFamily: FONTS.serif, fontSize: 17, fontWeight: 500, color: theme.ink }}>{e.name}</div>
          {e.mySignup && <div style={{ marginLeft: 'auto' }}><Chip tone="green" icon="check">Signed up</Chip></div>}
        </div>
      )}

      <div style={{ padding: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: theme.dim }}>Date</div>
            <div style={{ color: theme.ink, fontSize: 13, marginTop: 2 }}>
              {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
          {e.time && (
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: theme.dim }}>
                {e.category === 'Social' ? 'Time' : 'Call time'}
              </div>
              <div style={{ color: theme.ink, fontSize: 13, marginTop: 2 }}>{e.time}</div>
            </div>
          )}
          {e.venue && (
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: theme.dim }}>Venue</div>
              <div style={{ color: theme.ink, fontSize: 13, marginTop: 2 }}>{e.venue}</div>
            </div>
          )}
          {e.attire && (
            <div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: theme.dim }}>Attire</div>
              <div style={{ color: theme.ink, fontSize: 13, marginTop: 2 }}>{e.attire}</div>
            </div>
          )}
        </div>

        {e.description && (
          <div style={{ fontSize: 12.5, color: theme.dim, lineHeight: 1.5, marginBottom: 12 }}>{e.description}</div>
        )}

        {hasForm && (
          <div style={{ padding: 10, background: theme.amberSoft, border: `1px solid ${theme.amber}`, borderRadius: 8, marginBottom: 12 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: theme.amber, textTransform: 'uppercase', marginBottom: 3, fontWeight: 600 }}>
              ⚠ Required forms
            </div>
            <div style={{ fontSize: 12.5, color: theme.ink, lineHeight: 1.5 }}>
              {e.forms?.waiver?.enabled && <div>• {e.forms.waiver.title}</div>}
              {e.forms?.excuse?.enabled && <div>• {e.forms.excuse.title}</div>}
            </div>
          </div>
        )}

        {e.repertoire && e.repertoire.length > 0 && (
          <div style={{ padding: 10, background: theme.cream, borderRadius: 8, marginBottom: 12 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase', marginBottom: 4 }}>Repertoire</div>
            {e.repertoire.map((p, i) => (
              <div key={i} style={{ fontSize: 12, fontFamily: FONTS.serif, fontStyle: 'italic', color: theme.ink }}>{p}</div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11.5, color: theme.dim }}>
            <div>
              <strong style={{ color: theme.ink }}>{e.signedUp}</strong>
              {e.slots > 0 && <span> / {e.slots} slots</span>}
            </div>
            {e.signupDeadline && (
              <div style={{ marginTop: 2, fontFamily: FONTS.mono, fontSize: 10.5 }}>
                CLOSES {new Date(e.signupDeadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
              </div>
            )}
          </div>
          <Button variant={e.mySignup ? 'outline' : 'primary'} onClick={onSignUp}>
            {e.mySignup ? 'Withdraw' : hasForm ? 'Sign up + forms' : 'Sign up'}
          </Button>
        </div>

        {e.slots > 0 && (
          <div style={{ marginTop: 10, height: 4, background: theme.line, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (e.signedUp / e.slots) * 100)}%`, height: '100%', background: cs.color }} />
          </div>
        )}
      </div>
    </Card>
  );
}

// ── MemberPerformances (unified Events screen) ────────────────────────────────

export function MemberPerformances() {
  const app = useApp();
  const { theme } = useTheme();
  const { user } = useRouter();
  const vw = useViewportWidth();
  const isMobile = vw < 768;
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL as string ?? '';
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [signupEvent, setSignupEvent] = useState<UnifiedEvent | null>(null);
  const [socialSignups, setSocialSignups] = useState<Record<string, boolean>>(
    Object.fromEntries(SOCIAL_EVENTS.map(s => [s.id, !!s.mySignup])),
  );
  const [socialCounts, setSocialCounts] = useState<Record<string, number>>(
    Object.fromEntries(SOCIAL_EVENTS.map(s => [s.id, s.signedUp])),
  );

  const allEvents: UnifiedEvent[] = [
    ...app.events.map(e => normalize(e)),
    ...SOCIAL_EVENTS.map(s => normalize({
      ...s,
      mySignup: socialSignups[s.id] ? 'Signed up' : null,
      signedUp: socialCounts[s.id] ?? s.signedUp,
      castSize: s.slots,
    }, 'Social')),
  ];

  const today = new Date().toISOString().slice(0, 10);

  const visibleEvents = allEvents
    .filter(e => {
      if (filter !== 'all' && e.category !== filter) return false;
      if (timeFilter === 'upcoming') return e.date >= today;
      if (timeFilter === 'past') return e.date < today;
      if (timeFilter === 'signed') return !!e.mySignup;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const catCounts = (['Performance', 'Social', 'Competition', 'Festival', 'Request'] as FilterCategory[]).reduce(
    (acc, cat) => ({ ...acc, [cat]: allEvents.filter(e => e.category === cat).length }),
    {} as Record<FilterCategory, number>,
  );

  const hasRequiredForm = (e: UnifiedEvent) => e.forms?.waiver?.enabled || e.forms?.excuse?.enabled;

  const handleSignUp = (e: UnifiedEvent) => {
    if (e.category === 'Social') {
      const wasSignedUp = !!socialSignups[e.id];
      setSocialSignups(prev => ({ ...prev, [e.id]: !wasSignedUp }));
      setSocialCounts(prev => ({ ...prev, [e.id]: (prev[e.id] ?? 0) + (wasSignedUp ? -1 : 1) }));
      app.showToast(wasSignedUp ? 'Removed from sign-up' : `Signed up — ${e.name}`);
      if (adminEmail) notifyEventSignup({ adminEmail, memberName: user?.name ?? '', section: user?.section ?? '', eventName: e.name, eventDate: e.date, withdrew: wasSignedUp });
      return;
    }
    if (e.mySignup) {
      app.signUpEvent(e.id);
      app.showToast('Removed from roster');
      if (adminEmail) notifyEventSignup({ adminEmail, memberName: user?.name ?? '', section: user?.section ?? '', eventName: e.name, eventDate: e.date, withdrew: true });
      return;
    }
    if (hasRequiredForm(e)) {
      setSignupEvent(e);
    } else {
      app.signUpEvent(e.id);
      app.showToast(`Signed up — ${e.name}`);
      if (adminEmail) notifyEventSignup({ adminEmail, memberName: user?.name ?? '', section: user?.section ?? '', eventName: e.name, eventDate: e.date });
    }
  };

  const filterBtn = (k: string, label: string, active: boolean) => (
    <button
      key={k}
      onClick={() => setTimeFilter(k)}
      style={{
        padding: '8px 16px', borderRadius: 999, fontSize: 12.5,
        background: active ? theme.ink : 'transparent',
        color: active ? '#fff' : theme.ink,
        border: `1px solid ${active ? theme.ink : theme.lineDark}`,
        cursor: 'pointer', fontFamily: FONTS.sans,
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <PageHeader
        eyebrow="Module 5"
        title="Events"
        subtitle="All upcoming Chorale events — performances, social activities, competitions, and more."
      />

      {/* Time filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {filterBtn('upcoming', 'Upcoming', timeFilter === 'upcoming')}
        {filterBtn('signed', 'My sign-ups', timeFilter === 'signed')}
        {filterBtn('past', 'Past', timeFilter === 'past')}
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {([
          { k: 'all', l: 'All' },
          { k: 'Performance', l: 'Performances' },
          { k: 'Social', l: 'Social' },
          { k: 'Competition', l: 'Competitions' },
          { k: 'Festival', l: 'Festivals' },
          { k: 'Request', l: 'Requests' },
        ] as { k: FilterCategory; l: string }[])
          .filter(f => f.k === 'all' || (catCounts[f.k] ?? 0) > 0)
          .map(f => {
            const cs = f.k !== 'all' ? CATEGORY_STYLE[f.k] : null;
            const active = filter === f.k;
            const count = f.k === 'all' ? allEvents.length : (catCounts[f.k] ?? 0);
            return (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 12,
                  background: active ? (cs?.bg ?? theme.ink) : 'transparent',
                  color: active ? (cs?.color ?? '#fff') : theme.dim,
                  border: `1px solid ${active ? (cs?.color ?? theme.ink) : theme.line}`,
                  cursor: 'pointer', fontFamily: FONTS.sans,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {f.l}
                <span style={{
                  background: active ? 'rgba(0,0,0,0.1)' : theme.cream,
                  borderRadius: 10, padding: '0 6px',
                  fontSize: 10.5, fontFamily: FONTS.mono,
                  color: active ? 'inherit' : theme.dim,
                }}>{count}</span>
              </button>
            );
          })}
      </div>

      {visibleEvents.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: theme.dim, fontSize: 14 }}>
          No events found.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 18 }}>
          {visibleEvents.map(e => (
            <EventCard key={e.id} event={e} theme={theme} onSignUp={() => handleSignUp(e)} />
          ))}
        </div>
      )}

      {signupEvent && (
        <SignUpFormModal
          event={signupEvent}
          onClose={() => setSignupEvent(null)}
          onSubmit={() => {
            app.signUpEvent(signupEvent.id);
            app.showToast(`Signed up — ${signupEvent.name}`);
            if (adminEmail) notifyEventSignup({ adminEmail, memberName: user?.name ?? '', section: user?.section ?? '', eventName: signupEvent.name, eventDate: signupEvent.date });
            setSignupEvent(null);
          }}
        />
      )}
    </>
  );
}
