import React, { useState, useEffect } from 'react';
import { doc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { motion } from 'motion/react';
import { Save, Loader2, RefreshCw, Share2, LogOut, Users, CheckCircle2, Trash2, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from './lib/utils';

const BLANK_FORM = {
  date: '',
  time: '19:00 - 21:00',
  location: '',
  locationUrl: '',
  host: {
    name: '',
    avatar: '',
    bio: '',
  },
};

export default function Admin() {
  const [formData, setFormData] = useState(BLANK_FORM);
  const [topicsStr, setTopicsStr] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [confirmedEvents, setConfirmedEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchEvents();
    }
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (e: any) {
      setLoginError(e.message || 'Login failed');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'events'), orderBy('date', 'asc')));
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPendingEvents(all.filter((e: any) => e.status === 'proposed'));
      setConfirmedEvents(all.filter((e: any) => e.status === 'confirmed'));
    } catch (e) {
      console.error('Error fetching events:', e);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const topics = topicsStr.split(',').map(t => t.trim()).filter(Boolean);

      const avatar = formData.host.avatar.trim() ||
        `https://picsum.photos/seed/${formData.host.name.replace(/\s+/g, '') || 'host'}/200/200?grayscale`;

      if (editingEventId) {
        await updateDoc(doc(db, 'events', editingEventId), {
          date: formData.date,
          time: formData.time,
          location: formData.location,
          locationUrl: formData.locationUrl,
          host: { ...formData.host, avatar },
          topics,
        });
      } else {
        await addDoc(collection(db, 'events'), {
          date: formData.date,
          time: formData.time,
          location: formData.location,
          locationUrl: formData.locationUrl,
          host: {
            ...formData.host,
            avatar,
            userId: currentUser?.uid || null,
          },
          topics,
          status: 'confirmed',
          hostUserId: currentUser?.uid || null,
          createdAt: new Date().toISOString(),
        });
      }

      setEditingEventId(null);
      setFormData(BLANK_FORM);
      setTopicsStr('');
      await fetchEvents();
      alert(editingEventId ? '¡Evento actualizado!' : '¡Evento creado!');
    } catch (e: any) {
      console.error('Error saving event:', e);
      alert('Error al guardar el evento: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEventId(event.id);
    setFormData({
      date: event.date,
      time: event.time,
      location: event.location,
      locationUrl: event.locationUrl || '',
      host: {
        name: event.host?.name || '',
        avatar: event.host?.avatar || '',
        bio: event.host?.bio || '',
      },
    });
    setTopicsStr(event.topics?.join(', ') || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setFormData(BLANK_FORM);
    setTopicsStr('');
  };

  const handleConfirmEvent = async (eventId: string) => {
    try {
      await updateDoc(doc(db, 'events', eventId), { status: 'confirmed' });
      await fetchEvents();
    } catch (e) {
      console.error('Error confirming event:', e);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('¿Eliminar este evento?')) return;
    try {
      await deleteDoc(doc(db, 'events', eventId));
      if (editingEventId === eventId) handleCancelEdit();
      await fetchEvents();
    } catch (e) {
      console.error('Error deleting event:', e);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  const ADMIN_UID = 'w8xExc8G1dN9WaRVMC7TRz6pqm13';

  if (currentUser && currentUser.uid !== ADMIN_UID) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="font-serif text-3xl text-white/60">Sin autorización.</p>
          <p className="text-sm text-white/30">Esta cuenta no tiene acceso al panel de administración.</p>
          <button
            onClick={handleSignOut}
            className="text-xs uppercase tracking-wider text-white/40 hover:text-white/80 transition-colors border border-white/10 px-4 py-2 rounded-full"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-3xl p-8"
        >
          <h1 className="font-serif text-3xl mb-2">Admin Login</h1>
          <p className="text-sm text-white/50 mb-8">Sign in to access the admin panel.</p>
          {loginError && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs tracking-wider uppercase text-white/50">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs tracking-wider uppercase text-white/50">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full py-4 rounded-full bg-white text-black hover:bg-white/90 transition-all uppercase tracking-widest text-xs font-bold flex items-center justify-center gap-2"
            >
              {loginSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

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
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm tracking-wider uppercase bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-colors border border-white/10"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Event Form */}
        <form onSubmit={handleSave} className="space-y-8">

          <section className="space-y-6 bg-white/[0.02] p-8 rounded-3xl border border-white/5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase">
                {editingEventId ? `Editando evento · ${formatDate(formData.date)}` : 'Nuevo evento'}
              </h2>
              {editingEventId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40 hover:text-white/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancelar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs tracking-wider uppercase text-white/50">Fecha *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors [color-scheme:dark]"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs tracking-wider uppercase text-white/50">Horario</label>
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="19:00 - 21:00"
                  className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs tracking-wider uppercase text-white/50">Lugar *</label>
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
                  value={formData.locationUrl}
                  onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })}
                  className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>
            </div>
          </section>

          <section className="space-y-6 bg-white/[0.02] p-8 rounded-3xl border border-white/5">
            <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">Anfitrión</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs tracking-wider uppercase text-white/50">Nombre *</label>
                <input
                  type="text"
                  value={formData.host.name}
                  onChange={(e) => setFormData({ ...formData, host: { ...formData.host, name: e.target.value } })}
                  className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs tracking-wider uppercase text-white/50">Avatar URL <span className="normal-case text-white/30">(opcional)</span></label>
                <input
                  type="url"
                  value={formData.host.avatar}
                  onChange={(e) => setFormData({ ...formData, host: { ...formData.host, avatar: e.target.value } })}
                  placeholder="https://... (se genera automático si está vacío)"
                  className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs tracking-wider uppercase text-white/50">Bio</label>
                <textarea
                  value={formData.host.bio}
                  onChange={(e) => setFormData({ ...formData, host: { ...formData.host, bio: e.target.value } })}
                  className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors resize-none"
                  rows={2}
                />
              </div>
            </div>
          </section>

          <section className="space-y-6 bg-white/[0.02] p-8 rounded-3xl border border-white/5">
            <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4">Temas</h2>
            <div className="space-y-2">
              <label className="text-xs tracking-wider uppercase text-white/50">Separados por coma</label>
              <textarea
                value={topicsStr}
                onChange={(e) => setTopicsStr(e.target.value)}
                placeholder="Tecnología, viajes, películas..."
                className="w-full bg-transparent border-b border-white/20 pb-2 text-lg focus:outline-none focus:border-white transition-colors resize-none"
                rows={2}
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto px-12 py-4 rounded-full bg-white text-black hover:bg-white/90 transition-all duration-300 uppercase tracking-widest text-xs font-bold flex items-center justify-center gap-2 mx-auto"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingEventId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Guardando...' : editingEventId ? 'Guardar cambios' : 'Crear evento'}
          </button>

        </form>

        {/* Events Management */}
        <div className="mt-12 space-y-8">

          {/* Pending proposals */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase">Propuestas pendientes</h2>
            <button
              onClick={fetchEvents}
              disabled={eventsLoading}
              className="flex items-center gap-2 text-xs tracking-wider uppercase bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors border border-white/10"
            >
              {eventsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Refresh
            </button>
          </div>

          {pendingEvents.length === 0 ? (
            <p className="text-sm text-white/30">No hay propuestas pendientes.</p>
          ) : (
            <div className="space-y-3">
              {pendingEvents.map((event) => (
                <div key={event.id} className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-serif text-lg leading-tight">{formatDate(event.date)}</p>
                    <p className="text-sm text-white/50 mt-0.5">Host: {event.host?.name} · {event.location}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEditEvent(event)}
                      className="text-xs uppercase tracking-wider border border-white/20 px-3 py-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleConfirmEvent(event.id)}
                      className="flex items-center gap-1.5 text-xs uppercase tracking-wider bg-white text-black px-4 py-2 rounded-full font-bold hover:scale-105 transition-transform"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="flex items-center gap-1.5 text-xs uppercase tracking-wider border border-white/20 px-3 py-2 rounded-full hover:bg-red-500/10 hover:border-red-500/30 transition-colors text-white/50 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Confirmed events */}
          {confirmedEvents.length > 0 && (
            <>
              <h2 className="text-xs tracking-[0.2em] text-white/50 uppercase border-b border-white/10 pb-4 pt-4">Eventos confirmados</h2>
              <div className="space-y-3">
                {confirmedEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`bg-white/[0.02] border p-5 rounded-2xl flex items-center justify-between gap-4 transition-colors ${
                      editingEventId === event.id ? 'border-white/30 bg-white/[0.05]' : 'border-white/[0.05]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-serif text-lg leading-tight">{formatDate(event.date)}</p>
                      <p className="text-sm text-white/50 mt-0.5">Host: {event.host?.name} · {event.location}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] uppercase tracking-widest text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1.5 rounded-full">
                        Confirmado
                      </span>
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="text-xs uppercase tracking-wider border border-white/20 px-3 py-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="flex items-center gap-1.5 text-xs uppercase tracking-wider border border-white/20 px-3 py-2 rounded-full hover:bg-red-500/10 hover:border-red-500/30 transition-colors text-white/50 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/admin/share')}
            className="w-full sm:w-auto px-10 py-4 rounded-full border border-white/20 hover:bg-white/5 transition-all duration-300 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Imagen de sesión
          </button>
          <button
            onClick={() => navigate('/admin/host-card')}
            className="w-full sm:w-auto px-10 py-4 rounded-full border border-white/20 hover:bg-white/5 transition-all duration-300 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            Buscar host
          </button>
        </div>

      </motion.div>
    </div>
  );
}
