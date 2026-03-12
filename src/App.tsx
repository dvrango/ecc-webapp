import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Clock, Plus, X, Loader2, Minus, CheckCircle2 } from 'lucide-react';
import { collection, doc, onSnapshot, addDoc, getDoc, setDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from './lib/firebase';

const FALLBACK_SESSION = {
  date: new Date().toISOString().split('T')[0],
  time: "19:00 - 21:00",
  location: "The Coffee House, Downtown",
  locationUrl: "",
  host: {
    name: "Alex Rivera",
    avatar: "https://picsum.photos/seed/alex/200/200?grayscale",
    bio: "English teacher & coffee enthusiast.",
  },
  topics: ["Technology & AI", "Travel Stories", "Favorite Books"],
};

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
    // Listen to auth state
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user profile
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
    // Listen to session data
    const sessionRef = doc(db, 'sessions', 'current');
    const unsubSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setSessionData(docSnap.data());
      } else {
        setSessionData(FALLBACK_SESSION);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching session:", error);
      setSessionData(FALLBACK_SESSION);
      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubSession();
    };
  }, []);

  useEffect(() => {
    const activeSessionDate = sessionData ? sessionData.date : FALLBACK_SESSION.date;
    if (!activeSessionDate) return;
    
    // Listen to attendees for the current session date
    const q = query(collection(db, 'attendees'), where('eventDate', '==', activeSessionDate));
    const unsubAttendees = onSnapshot(q, (snapshot) => {
      const attendeesList: any[] = [];
      snapshot.forEach(doc => {
        attendeesList.push({ id: doc.id, ...doc.data() });
      });
      setAttendees(attendeesList);
    });

    return () => unsubAttendees();
  }, [sessionData]);

  const handleJoin = async (newAttendee: any, userId?: string) => {
    try {
      // Check if user already RSVP'd
      let alreadyRsvpd = false;
      if (userId) {
        const existingRSVP = attendees.find((a: any) => a.userId === userId);
        if (existingRSVP) {
           alreadyRsvpd = true;
           showToast("You are already on the guest list!");
        }
      }
      
      if (!alreadyRsvpd) {
        const activeSessionDate = sessionData ? sessionData.date : FALLBACK_SESSION.date;
        await addDoc(collection(db, 'attendees'), {
          ...newAttendee,
          userId: userId || null, // null for guests
          eventDate: activeSessionDate,
          createdAt: new Date().toISOString()
        });
        showToast("RSVP Confirmed! See you there.");
      }
      setIsJoinModalOpen(false);
    } catch (e) {
      console.error("Error adding attendee:", e);
      showToast("Error adding attendee. Please try again.");
    }
  };

  const handleCancelRSVP = async () => {
    if (!currentUser) return;
    try {
      const existingRSVP = attendees.find((a: any) => a.userId === currentUser.uid);
      if (existingRSVP) {
        await deleteDoc(doc(db, 'attendees', existingRSVP.id));
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
      alert("Signed out successfully");
    } catch (e) {
      console.error("Error signing out:", e);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  const currentSession = sessionData || FALLBACK_SESSION;
  const isAlreadyAttending = currentUser ? attendees.some((a: any) => a.userId === currentUser.uid) : false;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const isPastEvent = currentSession.date < todayStr;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/30">
      {/* Header */}
      <header className="px-6 py-12 md:py-20 max-w-5xl mx-auto relative">
        {/* User Profile Area */}
        <div className="absolute top-6 right-6 md:top-12 md:right-12">
          {currentUser && userProfile && (
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
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="font-mono text-xs tracking-[0.2em] text-white/50 uppercase mb-4">dgotechub</p>
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
                  <div>
                    <p className="text-sm font-medium">{formatDate(currentSession.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white/70" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{currentSession.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white/70" />
                  </div>
                  <div>
                    {currentSession.locationUrl ? (
                      <a 
                        href={currentSession.locationUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm font-medium hover:text-white/70 transition-colors underline underline-offset-4 decoration-white/30"
                      >
                        {currentSession.location}
                      </a>
                    ) : (
                      <p className="text-sm font-medium">{currentSession.location}</p>
                    )}
                  </div>
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
                  src={currentSession.host.avatar}
                  alt={currentSession.host.name}
                  className="w-16 h-16 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="font-serif text-xl">{currentSession.host.name}</p>
                  <p className="text-sm text-white/50 mt-1">{currentSession.host.bio}</p>
                </div>
              </div>
            </motion.section>

            {/* Topics */}
            <motion.section
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">Topics of the Week</h2>
              <ul className="space-y-3">
                {currentSession.topics.map((topic: string, i: number) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    {topic}
                  </li>
                ))}
              </ul>
            </motion.section>

          </div>

          {/* Right Column: Attendees */}
          <div className="md:col-span-7 md:pl-12">
            <motion.section
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase">Guest List ({attendees.length})</h2>
                {isPastEvent ? (
                   <span className="text-xs tracking-wider uppercase text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">Event Ended</span>
                ) : !currentUser && (
                  <button
                    onClick={() => setIsJoinModalOpen(true)}
                    className="text-xs tracking-wider uppercase flex items-center gap-2 hover:text-white/70 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Join
                  </button>
                )}
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
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={attendee.avatar}
                          alt={attendee.name}
                          className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <p className="font-serif text-lg">{attendee.name}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {attendee.interests.map((interest: string, i: number) => (
                          <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border border-white/10 text-white/60">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          </div>

        </div>
      </main>

      {/* Floating Action Button */}
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

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-8 left-1/2 z-50 bg-[#111] border border-white/20 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6 pb-32">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
          <p className="font-mono text-xs tracking-[0.2em] text-white/30">dgotechub</p>
          <div className="flex items-center gap-8">
            <a
              href="https://chat.whatsapp.com/CjgnLyPC28c8SNpKw2PVT7?mode=gi_t"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-wider uppercase text-white/40 hover:text-white/80 transition-colors"
            >
              WhatsApp
            </a>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <a
              href="https://discord.gg/X9CahZFn3t"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-wider uppercase text-white/40 hover:text-white/80 transition-colors"
            >
              Discord
            </a>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <a
              href="https://instagram.com/dgotechub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-wider uppercase text-white/40 hover:text-white/80 transition-colors"
            >
              Instagram
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function JoinModal({ onClose, onJoin }: { onClose: () => void, onJoin: (data: any, uid?: string) => void }) {
  const [mode, setMode] = useState<'guest' | 'login' | 'register'>('guest');
  
  const [name, setName] = useState('');
  const [interests, setInterests] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMatch, setErrorMatch] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMatch('');
    setIsSubmitting(true);

    try {
      if (mode === 'guest') {
        if (!name.trim()) return;
        const interestsArray = interests.split(',').map(i => i.trim()).filter(i => i);
        await onJoin({
          name,
          avatar: `https://picsum.photos/seed/${name.replace(/\\s+/g, '')}/200/200?grayscale`,
          interests: interestsArray.length > 0 ? interestsArray : ['Networking']
        });
      } else if (mode === 'register') {
        if (!name.trim() || !email.trim() || !password.trim()) return;
        
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create profile
        const interestsArray = interests.split(',').map(i => i.trim()).filter(i => i);
        const profileData = {
          name,
          avatar: `https://picsum.photos/seed/${name.replace(/\\s+/g, '')}/200/200?grayscale`,
          interests: interestsArray.length > 0 ? interestsArray : ['Networking']
        };
        
        await setDoc(doc(db, 'users', user.uid), profileData);
        
        // RSVP
        await onJoin(profileData, user.uid);
      } else if (mode === 'login') {
         if (!email.trim() || !password.trim()) return;
         
         const userCredential = await signInWithEmailAndPassword(auth, email, password);
         const user = userCredential.user;
         
         // Fetch profile
         const profileDoc = await getDoc(doc(db, 'users', user.uid));
         if (profileDoc.exists()) {
            await onJoin(profileDoc.data(), user.uid);
         } else {
            // Edge case: no profile for this user
            const fallbackProfile = {
              name: "Unknown User",
              avatar: `https://picsum.photos/seed/${user.uid}/200/200?grayscale`,
              interests: ['Networking']
            };
            await onJoin(fallbackProfile, user.uid);
         }
      }
    } catch (e: any) {
      console.error(e);
      setErrorMatch(e.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-serif text-3xl mb-2">
          {mode === 'guest' ? 'Join as Guest' : mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h3>
        <p className="text-sm text-white/50 mb-6">
          {mode === 'guest' && 'Add your details to the guest list for this session.'}
          {mode === 'login' && 'Sign in to RSVP quickly using your saved profile.'}
          {mode === 'register' && 'Save your details to RSVP faster next time.'}
        </p>
        
        {/* Mode toggles */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl">
           <button 
             onClick={() => setMode('guest')}
             className={`flex-1 py-2 text-xs uppercase tracking-wider rounded-lg transition-colors ${mode === 'guest' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
           >
             Guest
           </button>
           <button 
             onClick={() => setMode('register')}
             className={`flex-1 py-2 text-xs uppercase tracking-wider rounded-lg transition-colors ${mode === 'register' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
           >
             Register
           </button>
           <button 
             onClick={() => setMode('login')}
             className={`flex-1 py-2 text-xs uppercase tracking-wider rounded-lg transition-colors ${mode === 'login' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
           >
             Login
           </button>
        </div>

        {errorMatch && (
           <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {errorMatch}
           </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {(mode === 'guest' || mode === 'register') && (
            <div className="space-y-2">
              <label className="text-xs tracking-wider uppercase text-white/50">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                placeholder="e.g. Jane Doe"
                required
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div className="space-y-2">
              <label className="text-xs tracking-wider uppercase text-white/50">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                placeholder="hello@example.com"
                required
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
             <div className="space-y-2">
               <label className="text-xs tracking-wider uppercase text-white/50">Password</label>
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                 placeholder="••••••••"
                 required
               />
             </div>
          )}

          {(mode === 'guest' || mode === 'register') && (
            <div className="space-y-2">
              <label className="text-xs tracking-wider uppercase text-white/50">Interests (comma separated)</label>
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                placeholder="e.g. Tech, Movies, Travel"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 flex justify-center items-center rounded-full border border-white/20 hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-widest text-xs mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
               mode === 'login' ? 'Sign In and RSVP' : 
               mode === 'register' ? 'Create Account & RSVP' : 
               'Confirm Attendance'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
