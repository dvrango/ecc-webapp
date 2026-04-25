import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, MapPin, Clock, Users, Plus } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';
import { formatDate, isFuture } from './lib/utils';
import { Loader2 } from 'lucide-react';

interface EventDoc {
  id: string;
  date: string;
  time: string;
  location: string;
  locationUrl?: string;
  host: { name: string; avatar: string; bio: string };
  topics: string[];
  status: 'proposed' | 'confirmed';
  hostUserId: string | null;
  createdAt: string;
}

export default function AgendaPage() {
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsSnap, attendeesSnap] = await Promise.all([
          getDocs(query(collection(db, 'events'), orderBy('date', 'asc'))),
          getDocs(collection(db, 'attendees')),
        ]);

        const eventsList: EventDoc[] = eventsSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<EventDoc, 'id'>),
        }));

        const counts: Record<string, number> = {};
        attendeesSnap.forEach((doc) => {
          const eventId = doc.data().eventId;
          if (eventId) {
            counts[eventId] = (counts[eventId] || 0) + 1;
          }
        });

        setEvents(eventsList);
        setAttendeeCounts(counts);
      } catch (e) {
        console.error('Error fetching events:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  const upcoming = events.filter((e) => isFuture(e.date));
  const past = events.filter((e) => !isFuture(e.date));

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/30">
      <header className="px-6 py-12 md:py-20 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-white/40 uppercase hover:text-white/80 transition-colors mb-10"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </Link>
          <p className="font-mono text-xs tracking-[0.2em] text-white/50 uppercase mb-4">kyzen circle</p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight font-light">
            English<br />
            <span className="italic text-white/70">Nights.</span>
          </h1>
          <p className="mt-6 text-sm text-white/40">
            {upcoming.length} upcoming {upcoming.length === 1 ? 'session' : 'sessions'}
          </p>
        </motion.div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-32 space-y-16">

        {/* Upcoming Events */}
        <section className="space-y-6">
          <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">
            Upcoming
          </h2>

          {upcoming.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/[0.05] p-8 rounded-2xl text-center space-y-4">
              <p className="font-serif text-2xl text-white/70">No sessions scheduled yet.</p>
              <p className="text-sm text-white/40">Be the first to propose one.</p>
              <Link
                to="/host"
                className="inline-flex items-center gap-2 mt-4 bg-white text-black px-6 py-3 rounded-full text-xs uppercase tracking-wider font-bold hover:scale-105 transition-transform"
              >
                <Plus className="w-3 h-3" />
                Propose a Session
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((event, index) => (
                <Fragment key={event.id}>
                  <EventCard
                    event={event}
                    attendeeCount={attendeeCounts[event.id] || 0}
                    index={index}
                  />
                </Fragment>
              ))}
            </div>
          )}
        </section>

        {/* Past Events */}
        {past.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">
              Past Sessions
            </h2>
            <div className="space-y-4 opacity-50">
              {past.slice().reverse().map((event, index) => (
                <Fragment key={event.id}>
                  <EventCard
                    event={event}
                    attendeeCount={attendeeCounts[event.id] || 0}
                    index={index}
                  />
                </Fragment>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Floating host CTA */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <Link
          to="/host"
          className="bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Quiero ser anfitrión
        </Link>
      </div>

      <footer className="border-t border-white/10 py-10 px-6 pb-32">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
          <p className="font-mono text-xs tracking-[0.2em] text-white/30">kyzen circle</p>
          <div className="flex items-center gap-8 flex-wrap justify-center">
            <a
              href="https://chat.whatsapp.com/CjgnLyPC28c8SNpKw2PVT7?mode=gi_t"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-wider uppercase text-white/40 hover:text-white/80 transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function EventCard({
  event,
  attendeeCount,
  index,
}: {
  event: EventDoc;
  attendeeCount: number;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: 'easeOut' }}
    >
      <Link
        to={`/events/${event.id}`}
        className="block bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 group"
      >
        <div className="flex items-start gap-5">
          {/* Date badge */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl border border-white/10 bg-white/[0.03] flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest text-white/40">
              {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span className="font-serif text-2xl leading-none">
              {new Date(event.date + 'T12:00:00').getDate()}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-serif text-xl leading-tight group-hover:text-white/90 transition-colors">
                  {formatDate(event.date)}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {event.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {event.status === 'proposed' && (
                  <span className="text-[10px] uppercase tracking-widest text-white/40 bg-white/5 border border-white/10 px-2 py-1 rounded-full">
                    Pending
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-white/50">
                  <Users className="w-3 h-3" />
                  {attendeeCount}
                </span>
              </div>
            </div>

            {/* Host row */}
            <div className="flex items-center gap-2 mt-4">
              <img
                src={event.host.avatar}
                alt={event.host.name}
                className="w-6 h-6 rounded-full object-cover grayscale"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs text-white/50">{event.host.name}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
