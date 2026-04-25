import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from './lib/firebase';

const PERKS = [
  { icon: '🔥', title: 'Sal de tu zona de confort', desc: 'Un reto real que te hace crecer cada vez.' },
  { icon: '🗣️', title: 'Gana fluidez hablando', desc: 'No hay mejor práctica que liderar la sesión.' },
  { icon: '💡', title: 'Desarrolla tu liderazgo', desc: 'Guía, modera y conecta a las personas.' },
  { icon: '🎙️', title: 'Tú pones los temas', desc: 'La conversación va a donde tú la lleves.' },
];

export default function HostPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    name: '',
    bio: '',
    date: '',
    time: '',
    location: '',
    topics: '',
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            const profile = profileDoc.data();
            setUserProfile(profile);
            setForm((f) => ({ ...f, name: profile.name || '' }));
          }
        } catch (e) {
          console.error('Error fetching profile:', e);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.date || !form.bio.trim()) {
      setError('Please fill in your name, a short bio, and your preferred date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const avatar =
        userProfile?.avatar ||
        `https://picsum.photos/seed/${form.name.replace(/\s+/g, '')}/200/200?grayscale`;

      await addDoc(collection(db, 'events'), {
        date: form.date,
        time: form.time.trim() || '19:00 - 21:00',
        location: form.location.trim() || 'TBD',
        locationUrl: '',
        host: {
          name: form.name.trim(),
          avatar,
          bio: form.bio.trim(),
          userId: currentUser?.uid || null,
        },
        topics: form.topics
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        status: 'proposed',
        hostUserId: currentUser?.uid || null,
        createdAt: new Date().toISOString(),
      });

      setSubmitted(true);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error submitting proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/30">
      <header className="px-6 py-12 md:py-20 max-w-3xl mx-auto">
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
          <h1 className="font-serif text-5xl md:text-7xl leading-[0.9] tracking-tight font-light">
            Be the<br />
            <span className="italic text-white/70">next Host.</span>
          </h1>
          <p className="mt-6 text-base text-white/50 leading-relaxed max-w-xl">
            Every English Night needs someone to guide the room, spark the conversation, and make people feel welcome. It's not complicated — and the growth you'll get from it is real.
          </p>
        </motion.div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pb-32 space-y-20">

        {/* Perks */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">
            Why Host?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PERKS.map((perk, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl"
              >
                <span className="text-3xl">{perk.icon}</span>
                <p className="font-serif text-xl mt-3">{perk.title}</p>
                <p className="text-sm text-white/50 mt-1 leading-relaxed">{perk.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border-t border-white/10 pt-8"
        >
          <p className="text-sm text-white/40 italic text-center">
            "Los anfitriones anteriores dicen que es la experiencia que más los hizo crecer en comunicación."
          </p>
        </motion.div>

        {/* Form or Success */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">
            Proponer una sesión
          </h2>

          {submitted ? (
            <SuccessState />
          ) : (
            <>
              {!currentUser && (
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl text-sm text-white/50">
                  <Link to="/" className="underline underline-offset-4 text-white/70 hover:text-white transition-colors">
                    Inicia sesión
                  </Link>{' '}
                  para pre-rellenar tu información automáticamente.
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs tracking-wider uppercase text-white/50">
                      Tu nombre <span className="text-white/30 normal-case">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                      placeholder="e.g. María García"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs tracking-wider uppercase text-white/50">
                      Fecha preferida <span className="text-white/30 normal-case">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      min={today}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs tracking-wider uppercase text-white/50">
                    Una frase sobre ti <span className="text-white/30 normal-case">*</span>
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    rows={2}
                    className="w-full bg-transparent border-b border-white/20 pb-2 text-base focus:outline-none focus:border-white transition-colors resize-none"
                    placeholder="Ej: Estudiante de ingeniería, amante del café y los idiomas."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs tracking-wider uppercase text-white/50">
                      Horario <span className="text-white/30 normal-case">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.time}
                      onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                      className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                      placeholder="19:00 - 21:00"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs tracking-wider uppercase text-white/50">
                      Lugar <span className="text-white/30 normal-case">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                      placeholder="Café del centro, TBD..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs tracking-wider uppercase text-white/50">
                    Temas de conversación <span className="text-white/30 normal-case">(opcional, separados por coma)</span>
                  </label>
                  <input
                    type="text"
                    value={form.topics}
                    onChange={(e) => setForm((f) => ({ ...f, topics: e.target.value }))}
                    className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                    placeholder="Tecnología, viajes, películas..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 flex justify-center items-center rounded-full bg-white text-black font-bold uppercase tracking-widest text-sm hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Proponer mi sesión'}
                </button>
              </form>
            </>
          )}
        </motion.section>
      </main>
    </div>
  );
}

function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/[0.05] p-10 rounded-2xl text-center space-y-6"
    >
      <span className="text-5xl">🎉</span>
      <div className="space-y-2">
        <p className="font-serif text-3xl">¡Propuesta recibida!</p>
        <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto">
          Confirmaremos tu sesión y aparecerá en la agenda. Únete al grupo de WhatsApp para coordinar los detalles.
        </p>
      </div>
      <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
        <a
          href="https://chat.whatsapp.com/CjgnLyPC28c8SNpKw2PVT7?mode=gi_t"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-black px-6 py-3 rounded-full text-xs uppercase tracking-wider font-bold hover:scale-105 transition-transform"
        >
          Unirse a WhatsApp
        </a>
        <Link
          to="/events"
          className="border border-white/20 text-white px-6 py-3 rounded-full text-xs uppercase tracking-wider hover:bg-white/10 transition-colors"
        >
          Ver la agenda
        </Link>
      </div>
    </motion.div>
  );
}
