import { useState } from 'react';
import { useTheme, useApp, useRouter } from '../../App';
import { FONTS } from '../../theme';
import { PageHeader } from '../ui/PageHeader';
import { Calendar } from '../ui/Calendar';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';

declare global {
  interface Window {
    CLASS_SCHEDULES: any[];
  }
}

export function MemberCalendar() {
  const { theme } = useTheme();
  const { user } = useRouter();
  const app = useApp();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
  };

  const handleSignup = () => {
    if (selectedEvent) {
      app.signUpEvent(selectedEvent.id);
      app.showToast(`Signed up for ${selectedEvent.title}`);
      setSelectedEvent(null);
    }
  };

  const userSchedule = window.CLASS_SCHEDULES?.find(s => s.memberId === user.id);

  const checkConflict = (eventDate: string, eventTime: string) => {
    if (!userSchedule || !eventTime) return null;

    const date = new Date(eventDate);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventMinutes = hours * 60 + minutes;

    for (const cls of userSchedule.classes) {
      if (cls.days.includes(dayOfWeek)) {
        const [startH, startM] = cls.startTime.split(':').map(Number);
        const [endH, endM] = cls.endTime.split(':').map(Number);
        const classStart = startH * 60 + startM;
        const classEnd = endH * 60 + endM;

        if (eventMinutes >= classStart && eventMinutes <= classEnd) {
          return cls;
        }
      }
    }
    return null;
  };

  return (
    <>
      <PageHeader
        eyebrow="Module 8"
        title="Calendar"
        subtitle="View all upcoming events, performances, rehearsals, and social events."
      />

      <Calendar role="member" onEventClick={handleEventClick} />

      {userSchedule && (
        <Card style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Icon name="calendar" size={20} stroke={theme.green} />
            <div>
              <h3 style={{ fontFamily: FONTS.serif, fontSize: 18, margin: 0, fontWeight: 500 }}>Your Class Schedule</h3>
              <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>{userSchedule.term}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {userSchedule.classes.map((cls: any, i: number) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 2fr 1fr 120px',
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
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedEvent && (
        <div
          onClick={() => setSelectedEvent(null)}
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
              <div
                style={{
                  fontSize: 11,
                  fontFamily: FONTS.mono,
                  letterSpacing: 1,
                  color: selectedEvent.color,
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                {selectedEvent.type}
              </div>
              <h3 style={{ fontFamily: FONTS.serif, fontSize: 24, margin: 0, fontWeight: 500 }}>
                {selectedEvent.title}
              </h3>
            </div>

            <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 16px', fontSize: 14 }}>
                <Icon name="calendar" size={18} stroke={theme.dim} />
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>
                    {selectedEvent.time || 'Time TBA'}
                  </div>
                </div>

                {selectedEvent.venue && (
                  <>
                    <Icon name="mapPin" size={18} stroke={theme.dim} />
                    <div>{selectedEvent.venue}</div>
                  </>
                )}

                {selectedEvent.section && (
                  <>
                    <Icon name="users" size={18} stroke={theme.dim} />
                    <div>{selectedEvent.section}</div>
                  </>
                )}
              </div>

              {selectedEvent.time && checkConflict(selectedEvent.date, selectedEvent.time) && (
                <div style={{ padding: 14, background: theme.redSoft, borderRadius: 8, borderLeft: `3px solid ${theme.red}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon name="alertTriangle" size={18} stroke={theme.red} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: theme.red }}>Schedule Conflict</div>
                      <div style={{ fontSize: 12, color: theme.ink, marginTop: 4 }}>
                        This event conflicts with {checkConflict(selectedEvent.date, selectedEvent.time)?.code} -{' '}
                        {checkConflict(selectedEvent.date, selectedEvent.time)?.name}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedEvent.mySignup ? (
                <div style={{ padding: 14, background: theme.greenSoft, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="check" size={18} stroke={theme.green} />
                  <div style={{ fontSize: 13, color: theme.greenDeep }}>You're signed up for this event</div>
                </div>
              ) : selectedEvent.type === 'performance' ? (
                <Button icon="userPlus" onClick={handleSignup}>
                  Sign up for this event
                </Button>
              ) : null}
            </div>

            <div
              style={{
                padding: '16px 28px',
                borderTop: `1px solid ${theme.line}`,
                background: theme.cream,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
