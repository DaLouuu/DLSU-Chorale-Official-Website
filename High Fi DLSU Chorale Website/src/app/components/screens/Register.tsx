import { useState } from 'react';
import { useRouter, useTheme } from '../../App';
import { FONTS } from '../../theme';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { SectionTag } from '../ui/SectionTag';
import { Logo } from '../ui/Logo';

export function Register() {
  const { go } = useRouter();
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ email: '', name: '', section: 'Soprano', year: '1st Year', studentId: '' });

  const next = () => setStep(s => Math.min(3, s + 1));
  const prev = () => setStep(s => Math.max(1, s - 1));
  const field = (k: keyof typeof data) => ({
    value: data[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setData({ ...data, [k]: e.target.value }),
  });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: theme.cream, fontFamily: FONTS.sans }}>
      <div
        style={{
          width: 320,
          padding: 40,
          background: theme.greenDark,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={36} color="white" /> <span style={{ fontFamily: FONTS.serif, fontSize: 18 }}>DLSU Chorale</span>
        </div>
        <div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, opacity: 0.6, textTransform: 'uppercase' }}>New member</div>
          <h2 style={{ fontFamily: FONTS.serif, fontSize: 34, margin: '8px 0 0 0', fontWeight: 500 }}>Register</h2>
          <p style={{ fontSize: 13, opacity: 0.8, marginTop: 12 }}>Three quick steps. Your Section Head will verify before you get full access.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { n: 1, label: 'Sign in with Google' },
            { n: 2, label: 'Confirm your details' },
            { n: 3, label: 'Pick your voice section' },
          ].map(({ n, label }) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: step >= n ? 1 : 0.4 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: step > n ? theme.greenMid : step === n ? '#fff' : 'rgba(255,255,255,0.15)',
                  color: step > n ? theme.greenDark : step === n ? theme.greenDark : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONTS.mono,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {step > n ? '✓' : n}
              </div>
              <span style={{ fontSize: 13.5 }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', fontSize: 11, opacity: 0.6, fontFamily: FONTS.mono }}>
          Already registered?{' '}
          <a onClick={() => go('login')} style={{ color: theme.greenMid, cursor: 'pointer' }}>
            Sign in
          </a>
        </div>
      </div>
      <div style={{ flex: 1, padding: '60px 80px', overflow: 'auto' }}>
        <div style={{ maxWidth: 520 }}>
          {step === 1 && (
            <>
              <h3 style={{ fontFamily: FONTS.serif, fontSize: 32, margin: 0, fontWeight: 500 }}>Step 1 — Sign in with your DLSU Google account</h3>
              <p style={{ color: theme.dim, marginTop: 10 }}>We authenticate members through DLSU Single Sign-On. Only {"@dlsu.edu.ph"} emails may register.</p>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setData({ ...data, email: 'new_member@dlsu.edu.ph', name: 'New Member' });
                  next();
                }}
                style={{ marginTop: 24, width: 320, justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path
                    fill="#34A853"
                    d="M24 47c6.2 0 11.4-2 15.2-5.5l-7-5.5c-2 1.4-4.6 2.2-8.2 2.2-6.3 0-11.7-4.2-13.6-10l-7.4 5.8C6.8 41.3 14.7 47 24 47z"
                  />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.5-.1-3-.4-4.5H24v9h12.7c-.5 2.7-2.1 5-4.5 6.5l7 5.5c4.1-3.8 6.3-9.3 6.3-16.5z" />
                  <path fill="#FBBC04" d="M10.7 28.5c-.4-1.3-.7-2.7-.7-4.5s.2-3.2.7-4.5l-7.4-5.8C1.6 17 1 20.4 1 24s.6 7 2.3 10.3l7.4-5.8z" />
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.4 1.3 8.4 3.3l6.3-6.3C34.8 3.2 29.8 1 24 1 14.7 1 6.8 6.7 3.3 14.7l7.4 5.8C12.3 14.1 17.7 9.5 24 9.5z" />
                </svg>
                Continue with Google
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <h3 style={{ fontFamily: FONTS.serif, fontSize: 32, margin: 0, fontWeight: 500 }}>Step 2 — Your details</h3>
              <p style={{ color: theme.dim, marginTop: 10 }}>Pulled from your Google profile. Edit if needed.</p>
              <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
                <Field label="Full name" {...field('name')} />
                <Field label="DLSU email" {...field('email')} readOnly />
                <Field label="Student ID number" placeholder="e.g. 12100234" {...field('studentId')} />
                <Field label="Year level" select options={['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate']} {...field('year')} />
              </div>
              <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
                <Button variant="outline" onClick={prev}>
                  Back
                </Button>
                <Button onClick={next}>Continue</Button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h3 style={{ fontFamily: FONTS.serif, fontSize: 32, margin: 0, fontWeight: 500 }}>Step 3 — Pick your voice section</h3>
              <p style={{ color: theme.dim, marginTop: 10 }}>
                This decides your rehearsal schedule and your Section Head. You can't change it later without Maestro approval.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
                {['Soprano', 'Alto', 'Tenor', 'Bass'].map(s => (
                  <button
                    key={s}
                    onClick={() => setData({ ...data, section: s })}
                    style={{
                      padding: '18px 20px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: data.section === s ? theme.greenSoft : '#fff',
                      border: `1.5px solid ${data.section === s ? theme.green : theme.line}`,
                      borderRadius: 12,
                      fontFamily: FONTS.sans,
                    }}
                  >
                    <SectionTag section={s} />
                    <div style={{ fontFamily: FONTS.serif, fontSize: 22, marginTop: 8, color: theme.ink }}>{s}</div>
                    <div style={{ fontSize: 12, color: theme.dim, marginTop: 4 }}>
                      {s === 'Soprano' && 'Tues/Thurs · 6PM'}
                      {s === 'Alto' && 'Tues/Thurs · 6PM'}
                      {s === 'Tenor' && 'Mon/Wed · 6PM'}
                      {s === 'Bass' && 'Mon/Wed · 6PM'}
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
                <Button variant="outline" onClick={prev}>
                  Back
                </Button>
                <Button onClick={() => go('pending')}>Submit for verification</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
