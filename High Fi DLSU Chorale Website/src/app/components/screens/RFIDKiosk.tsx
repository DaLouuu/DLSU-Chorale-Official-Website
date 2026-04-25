import { useState, useEffect } from 'react';
import { useRouter, useTheme } from '../../App';
import { FONTS } from '../../theme';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { MEMBERS } from '../../data';

function useViewportWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

function Stat({ label, value, of }: { label: string; value: string | number; of?: string | number }) {
  return (
    <div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, opacity: 0.7, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: FONTS.serif, fontSize: 26, lineHeight: 1, marginTop: 4 }}>
        {value}
        {of && <span style={{ fontSize: 13, opacity: 0.5 }}> / {of}</span>}
      </div>
    </div>
  );
}

export function RFIDKiosk() {
  const { go } = useRouter();
  const { theme } = useTheme();
  const vw = useViewportWidth();
  const isMobile = vw < 768;
  const isSmall = vw < 480;

  const [state, setState] = useState<'idle' | 'success' | 'error'>('idle');
  const [memberName, setMemberName] = useState('');
  const [wordInput, setWordInput] = useState('');
  const [checkedInMember, setCheckedInMember] = useState<string | null>(null);
  const [attendanceCount, setAttendanceCount] = useState(38);

  const correctWord = 'ASCEND';
  const totalExpected = 64;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (wordInput.toUpperCase() !== correctWord) {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
      return;
    }

    const member = MEMBERS.find(m =>
      m.name.toLowerCase() === memberName.trim().toLowerCase() ||
      String(m.id) === memberName.trim()
    );

    if (!member) {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
      return;
    }

    setCheckedInMember(member.name);
    setAttendanceCount(prev => prev + 1);
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
        backgroundImage: `linear-gradient(135deg, rgba(8,50,24,0.92), rgba(17,94,43,0.82)), url("assets/choir-b2b-1.png")`,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, opacity: 0.6, textTransform: 'uppercase' }}>
                Checked in
              </div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 20, lineHeight: 1 }}>
                {attendanceCount}<span style={{ fontSize: 12, opacity: 0.5 }}> / {totalExpected}</span>
              </div>
            </div>
            <button
              onClick={() => go('landing')}
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
                Rehearsal
              </div>
              <div style={{ fontFamily: FONTS.serif, fontSize: 22, marginTop: 8, lineHeight: 1.15 }}>
                SATB full ensemble
              </div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>Music Studio A · 18:00 call</div>
            </div>
            <div
              style={{
                marginTop: 28,
                paddingTop: 22,
                borderTop: '1px solid rgba(255,255,255,0.15)',
                display: 'grid',
                gap: 14,
              }}
            >
              <Stat label="Checked in" value={attendanceCount} of={totalExpected} />
              <Stat label="On time" value="32" />
              <Stat label="Late" value="6" />
              <Stat label="Remaining" value={totalExpected - attendanceCount} />
            </div>
          </div>
          <button
            onClick={() => go('landing')}
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
                Check In
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
                  background: theme.greenSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="check" size={isSmall ? 48 : 60} stroke={theme.greenDeep} />
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
              Attendance Marked · Present
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
              <div
                style={{
                  width: isSmall ? 90 : 110,
                  height: isSmall ? 90 : 110,
                  borderRadius: '50%',
                  background: theme.redSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="alert" size={isSmall ? 44 : 54} stroke={theme.red} />
              </div>
            </div>
            <h2
              style={{
                fontFamily: FONTS.serif,
                fontSize: isSmall ? 28 : isMobile ? 36 : 42,
                margin: '20px 0 6px',
                fontWeight: 500,
              }}
            >
              Incorrect Information
            </h2>
            <div style={{ fontSize: 14, opacity: 0.8, maxWidth: 360, margin: '0 auto' }}>
              Either your name/ID or the word of the day is incorrect. Please try again.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
