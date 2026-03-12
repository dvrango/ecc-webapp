import { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { motion } from 'motion/react';
import { Download, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';

const FALLBACK_SESSION = {
    date: new Date().toISOString().split('T')[0],
    time: "19:00 - 21:00",
    location: "The Coffee House, Downtown",
    host: { name: "Alex Rivera", bio: "English teacher & coffee enthusiast." },
    topics: ["Technology & AI", "Travel Stories", "Favorite Books"],
};

// Instagram Story: 1080 × 1920
const CARD_W = 1080;
const CARD_H = 1920;
const PREVIEW_SCALE = 0.35;

export default function ShareCard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    // This ref points to the OFF-SCREEN full-size card used for export
    const exportRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => { fetchSession(); }, []);

    const fetchSession = async () => {
        setLoading(true);
        try {
            const snap = await getDoc(doc(db, 'sessions', 'current'));
            setSession(snap.exists() ? snap.data() : FALLBACK_SESSION);
        } catch {
            setSession(FALLBACK_SESSION);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr ?? '';
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const handleDownload = async () => {
        if (!exportRef.current) return;
        setDownloading(true);
        try {
            await document.fonts.ready;
            const canvas = await html2canvas(exportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#000000',
                logging: false,
                width: CARD_W,
                height: CARD_H,
            });
            const link = document.createElement('a');
            link.download = `ecc-story-${session?.date ?? 'session'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error(e);
            alert("Error al generar la imagen.");
        } finally {
            setDownloading(false);
        }
    };

    const s = session ?? FALLBACK_SESSION;
    const topics: string[] = Array.isArray(s.topics) ? s.topics : [];

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/30">

            {/* Hidden full-size card for export — off screen, no transform */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}>
                <StoryCard ref={exportRef} s={s} topics={topics} formatDate={formatDate} />
            </div>

            {/* Top bar */}
            <div className="sticky top-0 z-10 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 px-3 sm:px-6 py-4 flex items-center justify-between gap-2">
                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors uppercase tracking-wider shrink-0"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                </button>

                <h1 className="text-xs tracking-[0.2em] text-white/50 uppercase truncate text-center">Instagram Story</h1>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={fetchSession}
                        disabled={loading}
                        className="flex items-center gap-2 text-sm tracking-wider uppercase bg-white/5 hover:bg-white/10 px-3 sm:px-4 py-2 rounded-full transition-colors border border-white/10"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={downloading || loading}
                        className="flex items-center gap-2 text-sm tracking-wider uppercase bg-white text-black hover:bg-white/90 px-3 sm:px-6 py-2 rounded-full transition-colors font-bold disabled:opacity-50"
                    >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span className="hidden sm:inline">{downloading ? "Generando..." : "Descargar PNG"}</span>
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-col items-center py-12 px-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-white/30" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-6 w-full"
                    >
                        <p className="text-white/30 text-xs tracking-widest uppercase">
                            Preview · 1080 × 1920 px · Instagram Story
                        </p>

                        {/* Preview: scaled-down visual only, not used for export */}
                        <div
                            style={{
                                width: `${CARD_W * PREVIEW_SCALE}px`,
                                height: `${CARD_H * PREVIEW_SCALE}px`,
                                overflow: 'hidden',
                                borderRadius: '20px',
                                boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 40px 120px rgba(0,0,0,0.9)',
                                flexShrink: 0,
                                position: 'relative',
                            }}
                        >
                            <div style={{
                                width: `${CARD_W}px`,
                                height: `${CARD_H}px`,
                                transform: `scale(${PREVIEW_SCALE})`,
                                transformOrigin: 'top left',
                            }}>
                                <StoryCard s={s} topics={topics} formatDate={formatDate} />
                            </div>
                        </div>

                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="mt-2 flex items-center gap-3 px-6 sm:px-10 py-4 rounded-full bg-white text-black font-bold uppercase tracking-widest text-xs sm:text-sm hover:bg-white/90 transition-all disabled:opacity-50"
                        >
                            {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                            {downloading ? "Generando..." : <><span className="sm:hidden">Descargar PNG</span><span className="hidden sm:inline">Descargar PNG (1080 × 1920)</span></>}
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

// The card design — rendered twice: once scaled for preview, once full-size off-screen for export
import { forwardRef } from 'react';

const StoryCard = forwardRef<HTMLDivElement, {
    s: any;
    topics: string[];
    formatDate: (d: string) => string;
}>(({ s, topics, formatDate }, ref) => (
    <div
        ref={ref}
        style={{
            width: `${CARD_W}px`,
            height: `${CARD_H}px`,
            backgroundColor: '#000000',
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden',
        }}
    >
        {/* Grid texture */}
        <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
        }} />

        {/* Top accent */}
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
        }} />

        {/* Bottom accent */}
        <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
        }} />

        {/* Content */}
        <div style={{
            position: 'relative',
            padding: '100px 88px',
            height: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
        }}>

            {/* TOP — label + big title */}
            <div>
                <p style={{
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: '28px',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    marginBottom: '52px',
                }}>
                    Weekly Meetup
                </p>

                <h1 style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '130px',
                    lineHeight: '0.92',
                    fontWeight: 400,
                    color: '#ffffff',
                    letterSpacing: '-3px',
                    margin: 0,
                }}>
                    English<br />
                    <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.55)' }}>Conversation</em><br />
                    Club.
                </h1>
            </div>

            {/* MIDDLE — session info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                <div style={{ width: '64px', height: '2px', backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: '8px' }} />
                <InfoRow icon="📅" text={formatDate(s.date)} />
                <InfoRow icon="🕐" text={s.time} />
                <InfoRow icon="📍" text={s.location} />
            </div>

            {/* BOTTOM — topics + host */}
            <div>
                {topics.length > 0 && (
                    <div style={{ marginBottom: '72px' }}>
                        <p style={{
                            color: 'rgba(255,255,255,0.3)',
                            fontSize: '22px',
                            letterSpacing: '0.25em',
                            textTransform: 'uppercase',
                            marginBottom: '28px',
                        }}>
                            Topics
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                            {topics.map((t, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                                    <span style={{ fontSize: '38px', color: 'rgba(255,255,255,0.75)', fontWeight: 300 }}>{t}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Host */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '48px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '22px', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '16px' }}>Host</p>
                        <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '52px', color: '#ffffff', fontWeight: 400, margin: 0 }}>
                            {s.host?.name}
                        </p>
                        <p style={{ fontSize: '28px', color: 'rgba(255,255,255,0.4)', marginTop: '10px' }}>
                            {s.host?.bio}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '26px', letterSpacing: '0.05em' }}>Free Entry</p>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '26px', letterSpacing: '0.05em', marginTop: '8px' }}>All Levels</p>
                        <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '22px', letterSpacing: '0.15em', fontFamily: 'ui-monospace, "Courier New", monospace', marginTop: '24px' }}>dgotechub</p>
                    </div>
                </div>
            </div>

        </div>
    </div>
));

function InfoRow({ icon, text }: { icon: string; text: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: '36px',
            }}>
                {icon}
            </div>
            <span style={{ color: '#ffffff', fontSize: '48px', fontWeight: 400, letterSpacing: '-0.5px' }}>{text}</span>
        </div>
    );
}
