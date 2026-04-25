import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Loader2, ArrowLeft } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  avatar: string;
  instagram?: string;
  sessionCount: number;
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const [usersSnap, attendeesSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'attendees')),
        ]);

        // Count sessions per userId
        const sessionCounts: Record<string, number> = {};
        attendeesSnap.forEach((doc) => {
          const uid = doc.data().userId;
          if (uid) {
            sessionCounts[uid] = (sessionCounts[uid] || 0) + 1;
          }
        });

        const membersList: Member[] = usersSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          avatar: doc.data().avatar,
          instagram: doc.data().instagram || '',
          sessionCount: sessionCounts[doc.id] || 0,
        }));

        // Sort by most sessions attended
        membersList.sort((a, b) => b.sessionCount - a.sessionCount);

        setMembers(membersList);
      } catch (e) {
        console.error('Error fetching members:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const filtered = filter.trim()
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(filter.toLowerCase()) ||
          (m.instagram && m.instagram.toLowerCase().includes(filter.toLowerCase()))
      )
    : members;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/30">
      {/* Header */}
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
            Our<br />
            <span className="italic text-white/70">Members.</span>
          </h1>
          <p className="mt-6 text-sm text-white/40">{members.length} registered members</p>
        </motion.div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-32">
        {/* Search / Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by name or interest..."
            className="w-full max-w-sm bg-transparent border-b border-white/20 pb-2 text-sm focus:outline-none focus:border-white transition-colors placeholder:text-white/30"
          />
        </motion.div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.04 }}
                className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="font-serif text-lg leading-tight">{member.name}</p>
                    {member.instagram ? (
                      <a
                        href={`https://instagram.com/${member.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-white/40 hover:text-white/80 transition-colors"
                      >
                        @{member.instagram}
                      </a>
                    ) : (
                      <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">
                        {member.sessionCount === 0
                          ? 'New member'
                          : member.sessionCount === 1
                          ? '1 session'
                          : `${member.sessionCount} sessions`}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <p className="text-white/30 text-sm mt-8">No members match your search.</p>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
          <p className="font-mono text-xs tracking-[0.2em] text-white/30">kyzen circle</p>
          <div className="flex items-center gap-8">
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
