import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { motion } from 'motion/react';
import { Save, Loader2, RefreshCw, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const INITIAL_SESSION = {
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

export default function Admin() {
    const [formData, setFormData] = useState(INITIAL_SESSION);
    const [topicsStr, setTopicsStr] = useState(INITIAL_SESSION.topics.join(', '));
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSession();
    }, []);

    const fetchSession = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, 'sessions', 'current');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as typeof INITIAL_SESSION;
                let parsedDate = data.date;
                if (parsedDate && !/^\d{4}-\d{2}-\d{2}$/.test(parsedDate)) {
                    parsedDate = new Date().toISOString().split('T')[0];
                }
                setFormData({
                    ...INITIAL_SESSION,
                    ...data,
                    date: parsedDate
                });
                setTopicsStr(data.topics.join(', '));
            }
        } catch (e) {
            console.error("Error fetching session: ", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const docRef = doc(db, 'sessions', 'current');
            const dataToSave = {
                ...formData,
                topics: topicsStr.split(',').map(t => t.trim()).filter(t => t)
            };
            await setDoc(docRef, dataToSave);
            alert('Session saved successfully!');
        } catch (e) {
            console.error("Error saving session: ", e);
            alert("Error saving session. Please check console.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/30 p-6 md:p-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto"
            >
                <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-6">
                    <h1 className="font-serif text-3xl md:text-5xl tracking-tight">
                        Admin Panel
                    </h1>
                    <button
                        onClick={fetchSession}
                        disabled={loading}
                        className="flex items-center gap-2 text-sm tracking-wider uppercase bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-colors border border-white/10"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Refresh
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-8">

                    <section className="space-y-6 bg-white/[0.02] p-8 rounded-3xl border border-white/5">
                        <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">Session Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs tracking-wider uppercase text-white/50">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors [color-scheme:dark]"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs tracking-wider uppercase text-white/50">Time</label>
                                <input
                                    type="text"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs tracking-wider uppercase text-white/50">Location Name</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs tracking-wider uppercase text-white/50">Google Maps URL</label>
                                <input
                                    type="url"
                                    value={formData.locationUrl || ''}
                                    onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })}
                                    className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                                    placeholder="https://maps.app.goo.gl/..."
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6 bg-white/[0.02] p-8 rounded-3xl border border-white/5">
                        <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">Host Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs tracking-wider uppercase text-white/50">Name</label>
                                <input
                                    type="text"
                                    value={formData.host.name}
                                    onChange={(e) => setFormData({ ...formData, host: { ...formData.host, name: e.target.value } })}
                                    className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs tracking-wider uppercase text-white/50">Avatar URL</label>
                                <input
                                    type="url"
                                    value={formData.host.avatar}
                                    onChange={(e) => setFormData({ ...formData, host: { ...formData.host, avatar: e.target.value } })}
                                    className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                                    required
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs tracking-wider uppercase text-white/50">Bio</label>
                                <textarea
                                    value={formData.host.bio}
                                    onChange={(e) => setFormData({ ...formData, host: { ...formData.host, bio: e.target.value } })}
                                    className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors resize-none"
                                    rows={2}
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6 bg-white/[0.02] p-8 rounded-3xl border border-white/5">
                        <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">Topics</h2>

                        <div className="space-y-2">
                            <label className="text-xs tracking-wider uppercase text-white/50">Comma-separated topics</label>
                            <textarea
                                value={topicsStr}
                                onChange={(e) => setTopicsStr(e.target.value)}
                                className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors resize-none"
                                rows={2}
                                required
                            />
                        </div>
                    </section>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full md:w-auto px-12 py-4 rounded-full bg-white text-black hover:bg-white/90 transition-all duration-300 uppercase tracking-widest text-xs font-bold flex items-center justify-center gap-2 mx-auto"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "Saving..." : "Save Session Data"}
                    </button>

                </form>

                <div className="mt-8 pt-8 border-t border-white/10">
                    <button
                        onClick={() => navigate('/admin/share')}
                        className="w-full md:w-auto px-10 py-4 rounded-full border border-white/20 hover:bg-white/5 transition-all duration-300 uppercase tracking-widest text-xs flex items-center justify-center gap-2 mx-auto"
                    >
                        <Share2 className="w-4 h-4" />
                        Generar imagen para redes sociales
                    </button>
                </div>

            </motion.div>
        </div>
    );
}
