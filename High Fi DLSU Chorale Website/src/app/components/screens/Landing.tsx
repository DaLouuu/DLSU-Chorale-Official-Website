import { useState, useEffect } from 'react';
import { useRouter, useTheme } from '../../App';
import { FONTS } from '../../theme';
import logo from '../../../imports/dlsu-chorale-logo.png';
import b2b2 from '../../../imports/choir-b2b-2.png';
import { Moon, Sun, Calendar, LogIn } from 'lucide-react';

function useViewportWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

export function Landing() {
  const { go } = useRouter();
  const { theme, mode, setMode } = useTheme();
  const vw = useViewportWidth();
  const isMobile = vw < 768;
  const isSmall = vw < 480;

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        background: theme.cream,
        fontFamily: FONTS.sans,
        color: theme.ink,
      }}
    >
      {/* Dark mode toggle */}
      <button
        onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 100,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: `1px solid ${theme.line}`,
          background: theme.paper,
          color: theme.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      {/* Mobile: photo strip at top */}
      {isMobile && (
        <div
          style={{
            height: '35vh',
            minHeight: 180,
            background: `linear-gradient(0deg, rgba(8,50,24,0.7), rgba(8,50,24,0.15)), url("${b2b2}") center/cover`,
            display: 'flex',
            alignItems: 'flex-end',
            padding: '20px 24px',
            color: '#fff',
          }}
        >
          <div>
            <div style={{ fontFamily: FONTS.serif, fontSize: 16, fontStyle: 'italic', lineHeight: 1.3, maxWidth: 320, opacity: 0.95 }}>
              "Animo La Salle — a song we carry, not one we perform."
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, marginTop: 8, opacity: 0.75, textTransform: 'uppercase' }}>
              Bayang Barok · Teresa Yuchengco Auditorium
            </div>
          </div>
        </div>
      )}

      {/* Left: hero copy */}
      <div
        style={{
          flex: isMobile ? 'none' : '1 1 50%',
          padding: isMobile ? (isSmall ? '32px 20px 40px' : '40px 32px 48px') : '56px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isMobile ? 'flex-start' : 'space-between',
          background: theme.cream,
          minWidth: isMobile ? 0 : 420,
          gap: isMobile ? 28 : 0,
        }}
      >
        {/* Logo / brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isSmall ? 12 : 18 }}>
          <img
            src={logo}
            alt="DLSU Chorale"
            style={{ height: isSmall ? 40 : 48, width: 'auto' }}
          />
          <div style={{ borderLeft: `1px solid ${theme.lineDark}`, paddingLeft: isSmall ? 12 : 18 }}>
            <div
              style={{
                fontFamily: FONTS.serif,
                fontSize: isSmall ? 16 : 20,
                letterSpacing: 0.3,
                lineHeight: 1.15,
                color: theme.ink,
              }}
            >
              De La Salle University
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 9.5,
                letterSpacing: 2.5,
                color: theme.green,
                marginTop: 5,
                textTransform: 'uppercase',
              }}
            >
              Est. 1977 · Attendance Portal
            </div>
          </div>
        </div>

        {/* Headline + CTA */}
        <div style={{ maxWidth: 560 }}>
          <h1
            style={{
              fontFamily: FONTS.serif,
              fontSize: isSmall ? 44 : isMobile ? 54 : 64,
              fontWeight: 500,
              lineHeight: 1.02,
              letterSpacing: -1,
              margin: 0,
              color: theme.greenDark,
            }}
          >
            Animo,
            <br />
            <em style={{ fontStyle: 'italic', color: theme.green }}>in every voice.</em>
          </h1>
          <p
            style={{
              fontSize: isSmall ? 14 : 15,
              color: theme.dim,
              lineHeight: 1.55,
              marginTop: 18,
              maxWidth: 420,
            }}
          >
            The DLSU Chorale attendance and member management portal.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 28,
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => go('rfid')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: isSmall ? '12px 20px' : '14px 28px',
                fontSize: isSmall ? 14 : 15,
                height: isSmall ? 46 : 52,
                borderRadius: 10,
                fontWeight: 500,
                fontFamily: FONTS.sans,
                cursor: 'pointer',
                letterSpacing: 0.1,
                whiteSpace: 'nowrap',
                background: theme.green,
                color: '#fff',
                border: `1px solid ${theme.green}`,
              }}
            >
              <Calendar size={isSmall ? 17 : 19} />
              Mark Attendance
            </button>

            <button
              onClick={() => go('login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: isSmall ? '12px 20px' : '14px 28px',
                fontSize: isSmall ? 14 : 15,
                height: isSmall ? 46 : 52,
                borderRadius: 10,
                fontWeight: 500,
                fontFamily: FONTS.sans,
                cursor: 'pointer',
                letterSpacing: 0.1,
                whiteSpace: 'nowrap',
                background: 'transparent',
                color: theme.greenDark,
                border: `1.5px solid ${theme.greenDark}`,
              }}
            >
              <LogIn size={isSmall ? 17 : 19} />
              Login
            </button>
          </div>
        </div>

        {/* Footer note — desktop only */}
        {!isMobile && (
          <div style={{ fontSize: 11, color: theme.dim, fontFamily: FONTS.mono, letterSpacing: 0.3 }}>
            DLSU Chorale · Attendance System · {new Date().getFullYear()}
          </div>
        )}
      </div>

      {/* Right: photo — desktop only */}
      {!isMobile && (
        <div
          style={{
            flex: '1 1 50%',
            minWidth: 0,
            background: `linear-gradient(0deg, rgba(8,50,24,0.6), rgba(8,50,24,0.1)), url("${b2b2}") center/cover`,
            position: 'relative',
            color: '#fff',
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ padding: vw < 1100 ? 28 : 40 }}>
            <div
              style={{
                fontFamily: FONTS.serif,
                fontSize: vw < 1100 ? 22 : 28,
                fontStyle: 'italic',
                lineHeight: 1.2,
                maxWidth: 420,
              }}
            >
              "Animo La Salle — a song we carry, not one we perform."
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 11,
                letterSpacing: 2,
                marginTop: 16,
                opacity: 0.85,
                textTransform: 'uppercase',
              }}
            >
              Bayang Barok · Teresa Yuchengco Auditorium
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
