import { useState } from 'react';
import { useTheme, useApp } from '../../App';
import { FONTS } from '../../theme';
import { Icon } from './Icon';
import { Chip } from './Chip';

declare global {
  interface Window {
    REHEARSALS: any[];
    SOCIAL_EVENTS: any[];
    CLASS_SCHEDULES: any[];
  }
}

type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  time?: string;
  type: 'performance' | 'social' | 'rehearsal' | 'sectional';
  color: string;
  mySignup?: boolean | string | null;
  venue?: string;
  section?: string;
};

export function Calendar({ role = 'member', onEventClick }: { role?: 'member' | 'admin'; onEventClick?: (event: CalendarEvent) => void }) {
  const { theme } = useTheme();
  const app = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date('2026-04-24'));

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const getAllEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    app.events.forEach(e => {
      events.push({
        id: e.id,
        date: e.date,
        title: e.name,
        time: e.callTime,
        type: 'performance',
        color: theme.green,
        mySignup: e.mySignup,
        venue: e.venue,
      });
    });

    if (window.SOCIAL_EVENTS) {
      window.SOCIAL_EVENTS.forEach((e: any) => {
        events.push({
          id: e.id,
          date: e.date,
          title: e.name,
          time: e.time,
          type: 'social',
          color: theme.blue,
          mySignup: e.mySignup,
          venue: e.venue,
        });
      });
    }

    if (window.REHEARSALS) {
      window.REHEARSALS.forEach((r: any) => {
        events.push({
          id: r.id,
          date: r.date,
          title: r.type,
          time: r.time,
          type: r.type === 'Sectional' ? 'sectional' : 'rehearsal',
          color: r.type === 'Sectional' ? theme.amber : theme.greenDeep,
          venue: r.venue,
          section: r.section,
        });
      });
    }

    return events;
  };

  const allEvents = getAllEvents();

  const getEventsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allEvents.filter(e => e.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const today = new Date('2026-04-24');
  const isToday = (day: number) => {
    return year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
  };

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} style={{ padding: 8 }} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDate(day);
    const isCurrentDay = isToday(day);

    days.push(
      <div
        key={day}
        style={{
          padding: 8,
          minHeight: 100,
          background: isCurrentDay ? theme.greenSoft : theme.paper,
          border: `1px solid ${isCurrentDay ? theme.green : theme.line}`,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: isCurrentDay ? 600 : 500,
            color: isCurrentDay ? theme.green : theme.ink,
            marginBottom: 4,
          }}
        >
          {day}
        </div>
        {dayEvents.map(event => (
          <div
            key={event.id}
            onClick={() => onEventClick?.(event)}
            style={{
              fontSize: 10.5,
              padding: '4px 6px',
              background: event.color + '20',
              borderLeft: `3px solid ${event.color}`,
              borderRadius: 4,
              cursor: onEventClick ? 'pointer' : 'default',
              lineHeight: 1.3,
            }}
          >
            <div style={{ fontWeight: 600, color: event.color, marginBottom: 2 }}>
              {event.time} {event.type === 'performance' ? '🎭' : event.type === 'social' ? '🎉' : event.type === 'sectional' ? '🎵' : '🎼'}
            </div>
            <div style={{ color: theme.ink, fontSize: 10 }}>{event.title}</div>
            {role === 'member' && event.mySignup && (
              <div style={{ marginTop: 2 }}>
                <Chip tone="green" style={{ fontSize: 8, padding: '2px 4px' }}>Joined</Chip>
              </div>
            )}
            {event.section && (
              <div style={{ fontSize: 9, color: theme.dim, marginTop: 2 }}>{event.section}</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background: theme.paper, borderRadius: 12, border: `1px solid ${theme.line}`, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: theme.cream,
          borderBottom: `1px solid ${theme.line}`,
        }}
      >
        <button
          onClick={previousMonth}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            color: theme.ink,
          }}
        >
          <Icon name="chevronLeft" size={20} />
        </button>

        <div style={{ fontFamily: FONTS.serif, fontSize: 20, fontWeight: 500 }}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>

        <button
          onClick={nextMonth}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            color: theme.ink,
          }}
        >
          <Icon name="chevronRight" size={20} />
        </button>
      </div>

      <div style={{ padding: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 8,
            marginBottom: 8,
          }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: theme.dim,
                textAlign: 'center',
                padding: 8,
                fontFamily: FONTS.mono,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {day}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 8,
          }}
        >
          {days}
        </div>
      </div>

      <div
        style={{
          padding: '12px 20px',
          background: theme.cream,
          borderTop: `1px solid ${theme.line}`,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          fontSize: 11.5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: theme.green, borderRadius: 3 }} />
          <span>Performance</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: theme.blue, borderRadius: 3 }} />
          <span>Social Event</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: theme.greenDeep, borderRadius: 3 }} />
          <span>Rehearsal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, background: theme.amber, borderRadius: 3 }} />
          <span>Sectional</span>
        </div>
      </div>
    </div>
  );
}
