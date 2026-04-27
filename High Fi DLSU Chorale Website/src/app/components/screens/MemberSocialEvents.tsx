import { useState, useEffect } from 'react';
import { useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';

type SocialEvent = {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  slots: number;
  signedUp: number;
  mySignup?: boolean;
};

declare global {
  interface Window {
    SOCIAL_EVENTS: SocialEvent[];
  }
}

export function MemberSocialEvents() {
  const { theme } = useTheme();
  const app = useApp();
  const [events, setEvents] = useState(window.SOCIAL_EVENTS);
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 768;

  const toggleSignup = (id: string) => {
    setEvents(prev =>
      prev.map(e =>
        e.id === id
          ? {
              ...e,
              signedUp: e.mySignup ? e.signedUp - 1 : e.signedUp + 1,
              mySignup: !e.mySignup,
            }
          : e
      )
    );
    const event = events.find(e => e.id === id);
    if (event?.mySignup) {
      app.showToast('Removed from sign-ups');
    } else {
      app.showToast(`Signed up — ${event?.name}`);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Module 6"
        title="Social Events"
        subtitle="Team building, parties, and bonding activities. Sign up to join the fun!"
      />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 18 }}>
        {events.map(e => (
          <Card key={e.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5, color: theme.green, textTransform: 'uppercase' }}>
                  {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <h3 style={{ fontFamily: FONTS.serif, fontSize: 22, margin: '6px 0 0', fontWeight: 500 }}>{e.name}</h3>
              </div>
              {e.mySignup && <Chip tone="green" icon="check">Signed up</Chip>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, fontSize: 13, color: theme.dim, marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Time</div>
                <div style={{ color: theme.ink, marginTop: 2 }}>{e.time}</div>
              </div>
              <div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Venue</div>
                <div style={{ color: theme.ink, marginTop: 2 }}>{e.venue}</div>
              </div>
            </div>

            <p style={{ fontSize: 13.5, color: theme.dim, lineHeight: 1.6, marginBottom: 16 }}>{e.description}</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: theme.dim }}>
                <strong style={{ color: theme.ink, fontSize: 14 }}>{e.signedUp}</strong> / {e.slots} signed up
              </div>
              <Button variant={e.mySignup ? 'outline' : 'primary'} size="sm" onClick={() => toggleSignup(e.id)}>
                {e.mySignup ? 'Withdraw' : 'Sign up'}
              </Button>
            </div>

            <div style={{ height: 6, background: theme.line, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (e.signedUp / e.slots) * 100)}%`, height: '100%', background: theme.green }} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
