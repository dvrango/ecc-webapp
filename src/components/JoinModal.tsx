import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { collection, doc, addDoc, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

interface JoinModalProps {
  onClose: () => void;
  onJoin: (data: any, uid?: string) => void;
  hideGuest?: boolean;
  eventContext?: { eventId: string; eventDate: string } | null;
}

export default function JoinModal({ onClose, onJoin, hideGuest = false, eventContext }: JoinModalProps) {
  const [mode, setMode] = useState<'guest' | 'login' | 'register'>(hideGuest ? 'register' : 'guest');

  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');
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
        await onJoin({
          name,
          avatar: `https://picsum.photos/seed/${name.replace(/\s+/g, '')}/200/200?grayscale`,
          instagram: instagram.replace('@', '').trim(),
        });
      } else if (mode === 'register') {
        if (!name.trim() || !email.trim() || !password.trim()) return;

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const profileData = {
          name,
          avatar: `https://picsum.photos/seed/${name.replace(/\s+/g, '')}/200/200?grayscale`,
          instagram: instagram.replace('@', '').trim(),
        };

        await setDoc(doc(db, 'users', user.uid), profileData);
        await onJoin(profileData, user.uid);
      } else if (mode === 'login') {
        if (!email.trim() || !password.trim()) return;

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        if (profileDoc.exists()) {
          await onJoin(profileDoc.data(), user.uid);
        } else {
          const fallbackProfile = {
            name: 'Unknown User',
            avatar: `https://picsum.photos/seed/${user.uid}/200/200?grayscale`,
            instagram: '',
          };
          await onJoin(fallbackProfile, user.uid);
        }
      }
    } catch (e: any) {
      console.error(e);
      setErrorMatch(e.message || 'An error occurred');
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

        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl">
          {!hideGuest && (
            <button
              onClick={() => setMode('guest')}
              className={`flex-1 py-2 text-xs uppercase tracking-wider rounded-lg transition-colors ${mode === 'guest' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              Guest
            </button>
          )}
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
              <label className="text-xs tracking-wider uppercase text-white/50">
                Instagram <span className="text-white/30 normal-case">(optional)</span>
              </label>
              <div className="flex items-center border-b border-white/20 pb-2 focus-within:border-white transition-colors">
                <span className="text-white/40 text-lg select-none">@</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value.replace('@', ''))}
                  className="flex-1 bg-transparent text-lg focus:outline-none ml-1"
                  placeholder="yourusername"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 flex justify-center items-center rounded-full border border-white/20 hover:bg-white hover:text-black transition-all duration-300 uppercase tracking-widest text-xs mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              'Sign In and RSVP'
            ) : mode === 'register' ? (
              'Create Account & RSVP'
            ) : (
              'Confirm Attendance'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
