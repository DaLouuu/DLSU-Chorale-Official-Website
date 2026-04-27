import { useTheme, useApp } from '../../App';
import { useEffect, useState } from 'react';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

type Announcement = {
  id: string;
  date: string;
  author: string;
  title: string;
  body: string;
  pinned?: boolean;
};

type AnnouncementCardProps = {
  a: Announcement;
  variant?: 'paper' | 'cream' | 'green' | 'dark';
};

function AnnouncementCard({ a, variant = 'paper' }: AnnouncementCardProps) {
  const { theme } = useTheme();
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 640;

  return (
    <Card variant={variant}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, flexDirection: isMobile ? 'column' : 'row', gap: 4 }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 1, color: theme.dim, textTransform: 'uppercase' }}>{a.date}</div>
        <div style={{ fontSize: 11.5, color: theme.dim }}>{a.author}</div>
      </div>
      <h3 style={{ fontFamily: FONTS.serif, fontSize: 19, margin: '2px 0 8px', fontWeight: 500, lineHeight: 1.25 }}>{a.title}</h3>
      <p style={{ fontSize: 13.5, lineHeight: 1.55, color: variant === 'green' ? theme.greenDeep : theme.ink, margin: 0 }}>{a.body}</p>
    </Card>
  );
}

export function MemberAnnouncements() {
  const app = useApp();
  const { theme } = useTheme();
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = vw < 768;
  const announcements = app.announcements as Announcement[];
  const pinned = announcements.filter(a => a.pinned);
  const rest = announcements.filter(a => !a.pinned);

  return (
    <>
      <PageHeader
        eyebrow="From the Chorale FB group"
        title="Announcements"
        subtitle="Pinned + recent posts syndicated from the Chorale's private Facebook group."
        actions={<Button variant="outline" icon="refresh">Refresh feed</Button>}
      />
      {pinned.length > 0 && (
        <>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.green, textTransform: 'uppercase', marginBottom: 10 }}>
            📌 Pinned
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 28 }}>
            {pinned.map(a => (
              <AnnouncementCard key={a.id} a={a} variant="green" />
            ))}
          </div>
        </>
      )}
      <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: 2, color: theme.dim, textTransform: 'uppercase', marginBottom: 10 }}>Recent</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rest.map(a => (
          <AnnouncementCard key={a.id} a={a} />
        ))}
      </div>
    </>
  );
}
