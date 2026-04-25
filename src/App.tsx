import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Clock, Plus, Loader2, Minus } from 'lucide-react';
import { collection, doc, onSnapshot, addDoc, getDoc, query, where, deleteDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { formatDate } from './lib/utils';
import JoinModal from './components/JoinModal';
import Toast from './components/Toast';

export default function App() {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
          console.error("Error fetching user profile:", e);
        }
      } else {
        setUserProfile(null);
      }
    });

    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      const today = new Date().toISOString().split('T')[0];
      const allEvents = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      const next = allEvents
        .filter(e => e.status === 'confirmed' && e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
      setSessionData(next);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubEvents();
    };
  }, []);

  useEffect(() => {
    if (!sessionData?.id) {
      setAttendees([]);
      return;
    }
    const q = query(collection(db, 'attendees'), where('eventId', '==', sessionData.id));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
      setAttendees(list);
    });
    return () => unsub();
  }, [sessionData?.id]);

  const handleJoin = async (newAttendee: any, userId?: string) => {
    try {
      if (!sessionData) return;

      if (userId) {
        const existing = attendees.find((a: any) => a.userId === userId);
        if (existing) {
          showToast("You are already on the guest list!");
          setIsJoinModalOpen(false);
          return;
        }
      }

      await addDoc(collection(db, 'attendees'), {
        ...newAttendee,
        userId: userId || null,
        eventId: sessionData.id,
        eventDate: sessionData.date,
        createdAt: new Date().toISOString()
      });
      showToast("RSVP Confirmed! See you there.");
      setIsJoinModalOpen(false);
    } catch (e) {
      console.error("Error adding attendee:", e);
      showToast("Error adding attendee. Please try again.");
    }
  };

  const handleCancelRSVP = async () => {
    if (!currentUser) return;
    try {
      const existing = attendees.find((a: any) => a.userId === currentUser.uid);
      if (existing) {
        await deleteDoc(doc(db, 'attendees', existing.id));
        showToast("RSVP Canceled. We'll miss you!");
      }
    } catch (e) {
      console.error("Error canceling RSVP:", e);
      showToast("Error canceling RSVP. Please try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Error signing out:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  const isAlreadyAttending = currentUser ? attendees.some((a: any) => a.userId === currentUser.uid) : false;
  const todayStr = new Date().toISOString().split('T')[0];
  const isPastEvent = sessionData ? sessionData.date < todayStr : false;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/30">
      {/* Header */}
      <header className="px-6 py-12 md:py-20 max-w-5xl mx-auto relative">
        {/* User Profile Area */}
        <div className="absolute top-6 right-6 md:top-12 md:right-12">
          {currentUser && userProfile ? (
            <div className="flex items-center gap-4 bg-white/5 pr-4 pl-2 py-2 rounded-full border border-white/10">
              <div className="flex items-center gap-2">
                <img src={userProfile.avatar} alt="You" className="w-8 h-8 rounded-full grayscale object-cover" />
                <span className="text-sm font-medium hidden sm:block">{userProfile.name}</span>
              </div>
              <div className="w-[1px] h-4 bg-white/20" />
              <button
                onClick={handleSignOut}
                className="text-xs tracking-wider uppercase flex items-center gap-2 hover:text-white/70 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="text-xs tracking-wider uppercase px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
            >
              Sign In / Register
            </button>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="font-mono text-xs tracking-[0.2em] text-white/50 uppercase mb-4">kyzen circle</p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight font-light">
            English<br />
            <span className="italic text-white/70">Conversation</span><br />
            Club.
          </h1>
        </motion.div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">

          {/* Left Column: Session Details */}
          <div className="md:col-span-5 space-y-16">

            {!sessionData ? (
              <motion.section
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">Next Session</h2>
                <div className="bg-white/[0.02] border border-white/[0.05] p-8 rounded-2xl space-y-4">
                  <p className="font-serif text-2xl leading-snug text-white/80">
                    We're planning the next session.
                  </p>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Come back soon — we'll have the date, location, and topics ready for you here.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href="https://chat.whatsapp.com/CjgnLyPC28c8SNpKw2PVT7?mode=gi_t"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs tracking-wider uppercase text-white/50 hover:text-white/90 transition-colors border border-white/10 px-4 py-2 rounded-full hover:border-white/30"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </motion.section>
            ) : isPastEvent ? (
              <motion.section
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">Next Session</h2>
                <div className="bg-white/[0.02] border border-white/[0.05] p-8 rounded-2xl space-y-4">
                  <p className="font-serif text-2xl leading-snug text-white/80">
                    We're planning the next session.
                  </p>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Come back soon — we'll have the date, location, and topics ready for you here.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href="https://chat.whatsapp.com/CjgnLyPC28c8SNpKw2PVT7?mode=gi_t"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs tracking-wider uppercase text-white/50 hover:text-white/90 transition-colors border border-white/10 px-4 py-2 rounded-full hover:border-white/30"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </motion.section>
            ) : (
              <>
                {/* When & Where */}
                <motion.section
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="space-y-6"
                >
                  <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">Next Session</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-white/70" />
                      </div>
                      <p className="text-sm font-medium">{formatDate(sessionData.date)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white/70" />
                      </div>
                      <p className="text-sm font-medium">{sessionData.time}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-white/70" />
                      </div>
                      {sessionData.locationUrl ? (
                        <a
                          href={sessionData.locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-white/70 transition-colors underline underline-offset-4 decoration-white/30"
                        >
                          {sessionData.location}
                        </a>
                      ) : (
                        <p className="text-sm font-medium">{sessionData.location}</p>
                      )}
                    </div>
                  </div>
                </motion.section>

                {/* Host */}
                <motion.section
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">This Week's Host</h2>
                  <div className="flex items-center gap-6 bg-white/5 p-6 rounded-2xl border border-white/5">
                    <img
                      src={sessionData.host.avatar}
                      alt={sessionData.host.name}
                      className="w-16 h-16 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="font-serif text-xl">{sessionData.host.name}</p>
                      <p className="text-sm text-white/50 mt-1">{sessionData.host.bio}</p>
                    </div>
                  </div>
                </motion.section>

                {/* Topics */}
                {sessionData.topics && sessionData.topics.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">Topics of the Week</h2>
                    <ul className="space-y-3">
                      {sessionData.topics.map((topic: string, i: number) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </motion.section>
                )}
              </>
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
                  <span className="text-xs tracking-wider uppercase text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">Event Ended</span>
                ) : !currentUser && sessionData ? (
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
                  {attendees.map((attendee: any) => (
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

              {attendees.length === 0 && sessionData && !isPastEvent && (
                <p className="text-sm text-white/30 py-4">Be the first to RSVP.</p>
              )}
            </motion.section>
          </div>

        </div>
      </main>

      {/* Floating Action Button */}
      <AnimatePresence>
        {sessionData && !isPastEvent && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-40 flex gap-4"
          >
            {!isAlreadyAttending ? (
              <button
                onClick={() => currentUser && userProfile ? handleJoin(userProfile, currentUser.uid) : setIsJoinModalOpen(true)}
                className="bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-wider text-sm shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                {currentUser && userProfile ? "Quick RSVP" : "Join the Session"}
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

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6 pb-32">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
          <p className="font-mono text-xs tracking-[0.2em] text-white/30">kyzen circle</p>
          <div className="flex items-center gap-8 flex-wrap justify-center">
            <Link
              to="/events"
              className="text-xs tracking-wider uppercase text-white/40 hover:text-white/80 transition-colors"
            >
              Events
            </Link>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <Link
              to="/host"
              className="text-xs tracking-wider uppercase text-white/40 hover:text-white/80 transition-colors"
            >
              Become a Host
            </Link>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <Link
              to="/members"
              className="text-xs tracking-wider uppercase text-white/40 hover:text-white/80 transition-colors"
            >
              Members
            </Link>
            <span className="w-1 h-1 rounded-full bg-white/20" />
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

      {/* Join Modal */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <JoinModal
            onClose={() => setIsJoinModalOpen(false)}
            onJoin={handleJoin}
            hideGuest={isPastEvent}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
