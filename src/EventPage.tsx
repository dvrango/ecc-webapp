import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Calendar, MapPin, Clock, Plus, Minus, Loader2, Share2, Check } from 'lucide-react';
import { collection, doc, onSnapshot, addDoc, query, where, deleteDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { formatDate, isFuture } from './lib/utils';
import JoinModal from './components/JoinModal';
import Toast from './components/Toast';

interface EventDoc {
  date: string;
  time: string;
  location: string;
  locationUrl?: string;
  host: { name: string; avatar: string; bio: string; userId?: string };
  topics: string[];
  status: 'proposed' | 'confirmed';
  hostUserId: string | null;
}

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDoc | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data());
          }
        } catch (e) {
          console.error('Error fetching user profile:', e);
        }
      } else {
        setUserProfile(null);
      }
    });

    if (!id) return;

    const eventRef = doc(db, 'events', id);
    const unsubEvent = onSnapshot(eventRef, (snap) => {
      if (snap.exists()) {
        setEvent(snap.data() as EventDoc);
      }
      setLoading(false);
    });

    const attendeesQ = query(collection(db, 'attendees'), where('eventId', '==', id));
    const unsubAttendees = onSnapshot(attendeesQ, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setAttendees(list);
    });

    return () => {
      unsubAuth();
      unsubEvent();
      unsubAttendees();
    };
  }, [id]);

  const handleJoin = async (profile: any, userId?: string) => {
    try {
      if (!event || !id) return;

      if (userId) {
        const existing = attendees.find((a) => a.userId === userId);
        if (existing) {
          showToast('You are already on the guest list!');
          setIsJoinModalOpen(false);
          return;
        }
      }

      await addDoc(collection(db, 'attendees'), {
        ...profile,
        userId: userId || null,
        eventId: id,
        eventDate: event.date,
        createdAt: new Date().toISOString(),
      });
      showToast('RSVP Confirmed! See you there.');
      setIsJoinModalOpen(false);
    } catch (e) {
      console.error('Error adding attendee:', e);
      showToast('Error adding attendee. Please try again.');
    }
  };

  const handleCancelRSVP = async () => {
    if (!currentUser || !id) return;
    try {
      const existing = attendees.find((a) => a.userId === currentUser.uid);
      if (existing) {
        await deleteDoc(doc(db, 'attendees', existing.id));
        showToast("RSVP Canceled. We'll miss you!");
      }
    } catch (e) {
      console.error('Error canceling RSVP:', e);
      showToast('Error canceling RSVP. Please try again.');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Link copied!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <p className="font-serif text-3xl text-white/60">Event not found.</p>
          <Link to="/events" className="text-xs uppercase tracking-wider text-white/40 hover:text-white/80 transition-colors">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const isPastEvent = !isFuture(event.date);
  const isAlreadyAttending = currentUser ? attendees.some((a) => a.userId === currentUser.uid) : false;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/30">
      <header className="px-6 py-12 md:py-20 max-w-5xl mx-auto relative">
        {/* Share button */}
        <div className="absolute top-6 right-6 md:top-12 md:right-12">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-xs tracking-wider uppercase px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Share2 className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-white/40 uppercase hover:text-white/80 transition-colors mb-10"
          >
            <ArrowLeft className="w-3 h-3" />
            All Events
          </Link>
          <p className="font-mono text-xs tracking-[0.2em] text-white/50 uppercase mb-4">kyzen circle</p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight font-light">
            English<br />
            <span className="italic text-white/70">Conversation</span><br />
            Club.
          </h1>
          {event.status === 'proposed' && (
            <span className="inline-block mt-4 text-[10px] uppercase tracking-widest text-white/40 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              Pending confirmation
            </span>
          )}
        </motion.div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">

          {/* Left Column: Event Details */}
          <div className="md:col-span-5 space-y-16">

            {/* When & Where */}
            <motion.section
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">
                {isPastEvent ? 'Event Details' : 'When & Where'}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white/70" />
                  </div>
                  <p className="text-sm font-medium">{formatDate(event.date)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white/70" />
                  </div>
                  <p className="text-sm font-medium">{event.time}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white/70" />
                  </div>
                  {event.locationUrl ? (
                    <a
                      href={event.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:text-white/70 transition-colors underline underline-offset-4 decoration-white/30"
                    >
                      {event.location}
                    </a>
                  ) : (
                    <p className="text-sm font-medium">{event.location}</p>
                  )}
                </div>
              </div>
            </motion.section>

            {/* Host */}
            <motion.section
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">
                {isPastEvent ? 'Host' : "This Session's Host"}
              </h2>
              <div className="flex items-center gap-6 bg-white/5 p-6 rounded-2xl border border-white/5">
                <img
                  src={event.host.avatar}
                  alt={event.host.name}
                  className="w-16 h-16 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="font-serif text-xl">{event.host.name}</p>
                  <p className="text-sm text-white/50 mt-1">{event.host.bio}</p>
                </div>
              </div>
            </motion.section>

            {/* Topics */}
            {event.topics && event.topics.length > 0 && (
              <motion.section
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">Topics</h2>
                <ul className="space-y-3">
                  {event.topics.map((topic, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </motion.section>
            )}
          </div>

          {/* Right Column: Attendees */}
          <div className="md:col-span-7 md:pl-12">
            <motion.section
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase">
                  {isPastEvent ? `Who Attended (${attendees.length})` : `Guest List (${attendees.length})`}
                </h2>
                {isPastEvent ? (
                  <span className="text-xs tracking-wider uppercase text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                    Event Ended
                  </span>
                ) : !currentUser ? (
                  <button
                    onClick={() => setIsJoinModalOpen(true)}
                    className="text-xs tracking-wider uppercase flex items-center gap-2 hover:text-white/70 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Join
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {attendees.map((attendee) => (
                    <motion.div
                      key={attendee.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={attendee.avatar}
                          alt={attendee.name}
                          className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-serif text-lg leading-tight">{attendee.name}</p>
                          {attendee.instagram && (
                            <a
                              href={`https://instagram.com/${attendee.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-white/40 hover:text-white/80 transition-colors"
                            >
                              @{attendee.instagram}
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {attendees.length === 0 && !isPastEvent && (
                <p className="text-sm text-white/30 py-4">Be the first to RSVP.</p>
              )}
            </motion.section>
          </div>
        </div>
      </main>

      {/* Floating RSVP Button */}
      <AnimatePresence>
        {!isPastEvent && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-40 flex gap-4"
          >
            {!isAlreadyAttending ? (
              <button
                onClick={() =>
                  currentUser && userProfile
                    ? handleJoin(userProfile, currentUser.uid)
                    : setIsJoinModalOpen(true)
                }
                className="bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                {currentUser && userProfile ? 'Quick RSVP' : 'Join the Session'}
              </button>
            ) : (
              <button
                onClick={handleCancelRSVP}
                className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-white/20 hover:scale-105 transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
              >
                <Minus className="w-4 h-4" />
                Cancel RSVP
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toastMessage} />

      <AnimatePresence>
        {isJoinModalOpen && (
          <JoinModal
            onClose={() => setIsJoinModalOpen(false)}
            onJoin={handleJoin}
            hideGuest={isPastEvent}
            eventContext={id ? { eventId: id, eventDate: event.date } : null}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
