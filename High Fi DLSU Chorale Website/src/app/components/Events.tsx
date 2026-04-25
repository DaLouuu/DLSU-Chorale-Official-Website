import { Calendar, MapPin } from 'lucide-react';

const events = [
  {
    title: 'Spring Concert 2026',
    date: 'May 15, 2026',
    time: '7:00 PM',
    venue: 'DLSU Teresa Yuchengco Auditorium',
    description: 'An evening of classical and contemporary choral masterpieces',
  },
  {
    title: 'Choral Festival Participation',
    date: 'June 22-25, 2026',
    time: 'Various',
    venue: 'Cultural Center of the Philippines',
    description: 'International Choral Festival featuring ensembles from around the world',
  },
  {
    title: 'Christmas Concert',
    date: 'December 10, 2026',
    time: '6:00 PM',
    venue: 'Manila Cathedral',
    description: 'Traditional holiday celebration with sacred and festive repertoire',
  },
];

export function Events() {
  return (
    <section id="events" className="py-24 px-6 bg-muted/30">
      <div className="container mx-auto max-w-5xl">
        <h2
          style={{ fontFamily: 'var(--font-serif)' }}
          className="text-5xl md:text-6xl mb-12 text-center"
        >
          Upcoming Events
        </h2>
        <div className="space-y-8">
          {events.map((event, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-8 hover:shadow-lg transition-shadow"
            >
              <h3
                style={{ fontFamily: 'var(--font-serif)' }}
                className="text-3xl mb-4"
              >
                {event.title}
              </h3>
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{event.date} • {event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{event.venue}</span>
                </div>
              </div>
              <p className="text-lg">{event.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
