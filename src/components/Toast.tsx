import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

export default function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          className="fixed top-8 left-1/2 z-50 bg-[#111] border border-white/20 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 whitespace-nowrap"
        >
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium tracking-wide">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
