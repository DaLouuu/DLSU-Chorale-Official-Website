import { useState, useEffect } from 'react';
import { useRouter, useTheme } from '../../App';
import { FONTS } from '../../theme';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { EVENTS, MEMBERS } from '../../data';
import { supabase } from '../../supabase';
import choirB2b1 from '../../../imports/choir-b2b-1.png';

// Minutes past call time before a check-in counts as "late" instead of
// "present". No RFID hardware anymore — this kiosk IS the attendance record,
// so a check-in here is what actually lands in attendance_logs (and, via the
// auto-charge trigger, what a late/absent fee gets calculated from).
const LATE_GRACE_MINUTES = 15;

function computeLogStatus(callTime: string | null | undefined): 'present' | 'late' {
  if (!callTime) return 'present';
  const [h, m] = callTime.split(':').map(Number);
  if (Number.isNaN(h)) return 'present';
  const cutoff = new Date();
  cutoff.setHours(h, (m || 0) + LATE_GRACE_MINUTES, 0, 0);
  return new Date() > cutoff ? 'late' : 'present';
}

function useViewportWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

// Whatever's on today — rehearsal or performance — or the next upcoming one
// if nothing's scheduled today. Reads EVENTS directly (real Supabase data by
// the time this mounts, since the app's loading screen already waits on
// initializePublicData()), so this always reflects today's real calendar
// instead of a fixed/stale placeholder.
function getTodayOrNextEvent() {
  if (!EVENTS || EVENTS.length === 0) return null;
  const todayStr = new Date().toISOString().slice(0, 10);
  const sorted = [...(EVENTS as any[])].sort((a, b) =>
    String(a.date).localeCompare(String(b.date)) || String(a.callTime ?? '').localeCompare(String(b.callTime ?? ''))
  );
  return sorted.find(e => e.date === todayStr) ?? sorted.find(e => e.date > todayStr) ?? null;
}


export function RFIDKiosk() {
  const { go, previousRoute } = useRouter();
  const { theme } = useTheme();
  // Wherever the kiosk was actually launched from — a dashboard, role-select,
  // or the public login page — is where exiting should return to.
  const exitRoute = previousRoute;
  const vw = useViewportWidth();
  const isMobile = vw < 768;
  const isSmall = vw < 480;
  const [event] = useState(() => getTodayOrNextEvent());
  const todayStr = new Date().toISOString().slice(0, 10);

  const [state, setState] = useState<'idle' | 'success' | 'error' | 'locked'>('idle');
  const [memberName, setMemberName] = useState('');
  const [wordInput, setWordInput] = useState('');
  const [checkedInMember, setCheckedInMember] = useState<string | null>(null);
  const [checkedInStatus, setCheckedInStatus] = useState<'present' | 'late' | 'already'>('present');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [lockSeconds, setLockSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const MAX_ATTEMPTS = 3;
  const LOCK_DURATION = 30;
  const correctWord = 'ASCEND';

  useEffect(() => {
    if (lockSeconds <= 0) return;
    const t = setTimeout(() => {
      setLockSeconds(s => {
        if (s <= 1) { setState('idle'); setFailCount(0); }
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [lockSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'locked' || submitting) return;

    const nameVal = memberName.trim();
    const wordVal = wordInput.trim().toUpperCase();

    const wordOk = wordVal === correctWord;
    const member = MEMBERS.find(m =>
      m.name.toLowerCase() === nameVal.toLowerCase() ||
      String(m.id) === nameVal
    ) as any;

    if (!wordOk || !member) {
      const next = failCount + 1;
      setFailCount(next);
      if (next >= MAX_ATTEMPTS) {
        setState('locked');
        setLockSeconds(LOCK_DURATION);
      } else {
        setErrorMessage(null);
        setState('error');
        setTimeout(() => setState('idle'), 2000);
      }
      return;
    }

    if (!event || event.date !== todayStr) {
      setErrorMessage('No event scheduled for today — nothing to check into.');
      setState('error');
      setTimeout(() => setState('idle'), 2500);
      return;
    }

    const eventId = (event as any)._eventId ?? Number(event.id);
    const memberUuid = member._uuid ?? null;

    if (!memberUuid || !eventId) {
      console.warn('[Kiosk] Missing member profile link or event id — attendance not recorded.');
      setErrorMessage("Your account isn't linked to a profile yet — contact an admin before checking in.");
      setState('error');
      setTimeout(() => setState('idle'), 2500);
      return;
    }

    setSubmitting(true);
    let status: 'present' | 'late' | 'already' = 'present';
    let recorded = false;

    const { data: existingLog } = await supabase
      .from('attendance_logs')
      .select('log_id')
      .eq('account_id_fk', memberUuid)
      .eq('event_id_fk', eventId)
      .maybeSingle();

    if (existingLog) {
      status = 'already';
      recorded = true;
    } else {
      status = computeLogStatus((event as any).callTime);
      const { error: logErr } = await supabase.from('attendance_logs').insert({
        account_id_fk: memberUuid,
        event_id_fk: eventId,
        log_status: status,
        log_method: 'kiosk',
      });
      recorded = !logErr;
      if (logErr) console.warn('[Kiosk] Could not record attendance:', logErr.message);
    }
    setSubmitting(false);

    if (!recorded) {
      setErrorMessage('Could not record attendance — please try again, or notify an admin if this keeps happening.');
      setState('error');
      setTimeout(() => setState('idle'), 2500);
      return;
    }

    setFailCount(0);
    setCheckedInMember(member.name);
    setCheckedInStatus(status);
    setState('success');
    setTimeout(() => {
      setState('idle');
      setMemberName('');
      setWordInput('');
      setCheckedInMember(null);
    }, 3000);
  };

  const inputStyle = {
    width: '100%',
    padding: isSmall ? '12px' : '14px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10,
    color: '#fff',
    fontFamily: FONTS.sans,
    fontSize: isSmall ? 14 : 15,
    textAlign: 'center' as const,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: theme.greenDark,
        fontFamily: FONTS.sans,
        color: '#fff',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        backgroundImage: `linear-gradient(135deg, rgba(8,50,24,0.82), rgba(17,94,43,0.7)), url(${choirB2b1})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* ── Side / top rail ── */}
      {isMobile ? (
        /* Mobile: compact header bar */
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(12px)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo size={28} color="white" />
            <div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 14 }}>DLSU Chorale</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, opacity: 0.7, textTransform: 'uppercase' }}>
                Attendance Kiosk
              </div>
            </div>
          </div>
          <button
            onClick={() => go(exitRoute as any)}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ← Exit
          </button>
        </div>
      ) : (
        /* Desktop: side rail */
        <div
          style={{
            width: vw < 1024 ? 240 : 300,
            padding: vw < 1024 ? 24 : 32,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(12px)',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Logo size={36} color="white" />
              <div>
                <div style={{ fontFamily: FONTS.serif, fontSize: 16 }}>DLSU Chorale</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9.5, letterSpacing: 2, opacity: 0.7, textTransform: 'uppercase' }}>
                  Attendance Kiosk
                </div>
              </div>
            </div>
            <div style={{ marginTop: 32 }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, opacity: 0.6, textTransform: 'uppercase' }}>
                {event ? (event.date === todayStr ? "Today's " : 'Next ') + (event.type ?? 'Event') : 'Today'}
              </div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 22, marginTop: 8, lineHeight: 1.15 }}>
                {event ? event.name : 'Nothing scheduled'}
              </div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
                {event
                  ? `${event.venue || 'Venue TBA'} · ${event.callTime || '—'} call${event.date !== todayStr ? ` · ${new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`
                  : 'Check the admin dashboard to schedule one'}
              </div>
            </div>
          </div>
          <button
            onClick={() => go(exitRoute as any)}
            style={{
              width: '100%',
              padding: 10,
              background: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            ← Exit kiosk
          </button>
        </div>
      )}

      {/* ── Center form area ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isSmall ? '28px 20px' : isMobile ? '32px 24px' : '48px',
          minHeight: isMobile ? 0 : undefined,
        }}
      >
        {state === 'idle' && (
          <div
            style={{
              textAlign: 'center',
              width: '100%',
              maxWidth: isSmall ? 340 : 480,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: isSmall ? 11 : 12,
                letterSpacing: 3,
                opacity: 0.75,
                textTransform: 'uppercase',
              }}
            >
              Ready
            </div>
            <h1
              style={{
                fontFamily: FONTS.serif,
                fontSize: isSmall ? 44 : isMobile ? 56 : 68,
                fontWeight: 500,
                margin: '8px 0 0 0',
                letterSpacing: -1,
                lineHeight: 1,
              }}
            >
              Mark your
              <br />
              <em>attendance.</em>
            </h1>

            <form
              onSubmit={handleSubmit}
              style={{ marginTop: isSmall ? 32 : 44, width: '100%' }}
            >
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    fontSize: 10.5,
                    fontFamily: FONTS.mono,
                    letterSpacing: 2,
                    opacity: 0.7,
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  Your Name or ID Number
                </label>
                <input
                  value={memberName}
                  onChange={e => setMemberName(e.target.value)}
                  placeholder="e.g., Althea Marquez or 12100234"
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: isSmall ? 20 : 28 }}>
                <label
                  style={{
                    fontSize: 10.5,
                    fontFamily: FONTS.mono,
                    letterSpacing: 2,
                    opacity: 0.7,
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  Word of the Day
                </label>
                <input
                  value={wordInput}
                  onChange={e => setWordInput(e.target.value)}
                  placeholder="Type the word…"
                  required
                  style={{
                    ...inputStyle,
                    fontFamily: FONTS.mono,
                    fontSize: isSmall ? 16 : 18,
                    letterSpacing: 4,
                    textTransform: 'uppercase',
                  }}
                />
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8, fontFamily: FONTS.mono }}>
                  Ask your Section Head for today's word
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: '#fff',
                  color: theme.greenDark,
                  border: '1px solid #fff',
                  fontSize: isSmall ? 14 : undefined,
                }}
              >
                <Icon name="check" size={16} />
                {submitting ? 'Checking in…' : 'Check In'}
              </Button>
            </form>
          </div>
        )}

        {state === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: isSmall ? 90 : 110,
                  height: isSmall ? 90 : 110,
                  borderRadius: '50%',
                  background: checkedInStatus === 'late' ? theme.amberSoft : theme.greenSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="check" size={isSmall ? 48 : 60} stroke={checkedInStatus === 'late' ? theme.amber : theme.greenDeep} />
              </div>
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 12,
                letterSpacing: 3,
                opacity: 0.75,
                textTransform: 'uppercase',
                marginTop: 24,
              }}
            >
              {checkedInStatus === 'already' ? 'Already Checked In' : checkedInStatus === 'late' ? 'Attendance Marked · Late' : 'Attendance Marked · Present'}
            </div>
            <h2
              style={{
                fontFamily: FONTS.serif,
                fontSize: isSmall ? 36 : isMobile ? 46 : 54,
                fontWeight: 500,
                margin: '8px 0 6px',
                letterSpacing: -0.5,
              }}
            >
              Welcome, {checkedInMember?.split(' ')[0]}.
            </h2>
            <div style={{ fontSize: 14, opacity: 0.8 }}>
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}

        {state === 'error' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: isSmall ? 90 : 110, height: isSmall ? 90 : 110, borderRadius: '50%', background: theme.redSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="alert" size={isSmall ? 44 : 54} stroke={theme.red} />
              </div>
            </div>
            <h2 style={{ fontFamily: FONTS.serif, fontSize: isSmall ? 28 : isMobile ? 36 : 42, margin: '20px 0 6px', fontWeight: 500 }}>
              {errorMessage ? 'Cannot Check In' : 'Incorrect Information'}
            </h2>
            <div style={{ fontSize: 14, opacity: 0.8, maxWidth: 360, margin: '0 auto' }}>
              {errorMessage ?? `Name/ID or word of the day is wrong. ${MAX_ATTEMPTS - failCount} attempt${MAX_ATTEMPTS - failCount !== 1 ? 's' : ''} remaining.`}
            </div>
          </div>
        )}

        {state === 'locked' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: isSmall ? 90 : 110, height: isSmall ? 90 : 110, borderRadius: '50%', background: theme.redSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="alert" size={isSmall ? 44 : 54} stroke={theme.red} />
              </div>
            </div>
            <h2 style={{ fontFamily: FONTS.serif, fontSize: isSmall ? 28 : isMobile ? 36 : 42, margin: '20px 0 6px', fontWeight: 500 }}>
              Too Many Attempts
            </h2>
            <div style={{ fontSize: 14, opacity: 0.8, maxWidth: 360, margin: '0 auto' }}>
              This kiosk is locked. Please wait {lockSeconds} second{lockSeconds !== 1 ? 's' : ''} before trying again.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
