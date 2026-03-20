import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Download, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { forwardRef } from 'react';
import html2canvas from 'html2canvas';

// Instagram Story: 1080 × 1920
const CARD_W = 1080;
const CARD_H = 1920;
const PREVIEW_SCALE = 0.35;

const PERKS = [
    { icon: '🔥', title: 'Sal de tu zona de confort', desc: 'Un reto real que te hace crecer.' },
    { icon: '🗣️', title: 'Gana fluidez hablando', desc: 'No hay mejor práctica que liderar.' },
    { icon: '💡', title: 'Desarrolla tu liderazgo', desc: 'Guía, modera y conecta personas.' },
    { icon: '🎙️', title: 'Tú pones los temas', desc: 'La sesión va a donde tú la lleves.' },
];

export default function HostCard() {
    const exportRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const navigate = useNavigate();

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
            link.download = `ecc-host-recruitment.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error(e);
            alert('Error al generar la imagen.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/30">

            {/* Hidden full-size card for export */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}>
                <HostStoryCard ref={exportRef} />
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

                <h1 className="text-xs tracking-[0.2em] text-white/50 uppercase truncate text-center">Host Recruitment · Instagram Story</h1>

                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-2 text-sm tracking-wider uppercase bg-white text-black hover:bg-white/90 px-3 sm:px-6 py-2 rounded-full transition-colors font-bold disabled:opacity-50 shrink-0"
                >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span className="hidden sm:inline">{downloading ? 'Generando...' : 'Descargar PNG'}</span>
                </button>
            </div>

            {/* Main content */}
            <div className="flex flex-col items-center py-12 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-6 w-full"
                >
                    <p className="text-white/30 text-xs tracking-widest uppercase">
                        Preview · 1080 × 1920 px · Instagram Story
                    </p>

                    {/* Preview */}
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
                            <HostStoryCard />
                        </div>
                    </div>

                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="mt-2 flex items-center gap-3 px-6 sm:px-10 py-4 rounded-full bg-white text-black font-bold uppercase tracking-widest text-xs sm:text-sm hover:bg-white/90 transition-all disabled:opacity-50"
                    >
                        {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        {downloading ? 'Generando...' : (
                            <>
                                <span className="sm:hidden">Descargar PNG</span>
                                <span className="hidden sm:inline">Descargar PNG (1080 × 1920)</span>
                            </>
                        )}
                    </button>
                </motion.div>
            </div>
        </div>
    );
}

const HostStoryCard = forwardRef<HTMLDivElement>((_, ref) => (
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

            {/* TOP — label + big call to action */}
            <div>
                <p style={{
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: '28px',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    marginBottom: '52px',
                }}>
                    English Conversation Club
                </p>

                <h1 style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '138px',
                    lineHeight: '0.90',
                    fontWeight: 400,
                    color: '#ffffff',
                    letterSpacing: '-3px',
                    margin: 0,
                }}>
                    ¿Quieres<br />
                    ser el<br />
                    <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.55)' }}>próximo</em><br />
                    Host?
                </h1>

                <p style={{
                    fontSize: '36px',
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: '48px',
                    lineHeight: '1.4',
                    fontWeight: 300,
                    maxWidth: '800px',
                }}>
                    Cada sesión necesita una persona que guíe, anime y conecte a todos.
                </p>
            </div>

            {/* MIDDLE — perks */}
            <div>
                <div style={{ width: '64px', height: '2px', backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: '48px' }} />
                <p style={{
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '22px',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    marginBottom: '36px',
                }}>
                    Ventajas de ser host
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
                    {PERKS.map((perk, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '32px' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, fontSize: '34px',
                            }}>
                                {perk.icon}
                            </div>
                            <div>
                                <p style={{ fontSize: '40px', color: '#ffffff', fontWeight: 500, margin: 0, letterSpacing: '-0.5px' }}>
                                    {perk.title}
                                </p>
                                <p style={{ fontSize: '28px', color: 'rgba(255,255,255,0.38)', margin: '6px 0 0 0', fontWeight: 300 }}>
                                    {perk.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BOTTOM — CTA */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '48px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '22px', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '20px' }}>
                        ¿Te animas?
                    </p>
                    <p style={{
                        fontFamily: '"Playfair Display", Georgia, serif',
                        fontSize: '52px', color: '#ffffff', fontWeight: 400, margin: 0,
                    }}>
                        Escríbenos por DM
                    </p>
                    <p style={{ fontSize: '28px', color: 'rgba(255,255,255,0.4)', marginTop: '10px', fontWeight: 300 }}>
                        o en el grupo · ¡Te esperamos!
                    </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '26px', letterSpacing: '0.05em' }}>Free Entry</p>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '26px', letterSpacing: '0.05em', marginTop: '8px' }}>All Levels</p>
                    <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '22px', letterSpacing: '0.15em', fontFamily: 'ui-monospace, "Courier New", monospace', marginTop: '24px' }}>dgotechub</p>
                </div>
            </div>

        </div>
    </div>
));
