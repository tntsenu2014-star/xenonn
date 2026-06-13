import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Calendar, Loader2 } from 'lucide-react';
import { Event } from '../../types';
import { getEvents, addEvent, updateEvent, deleteEvent } from '../../services/db';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [date, setDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    const data = await getEvents(false);
    setEvents(data);
    setIsLoading(false);
  };

  const openModal = (event: Event | null = null) => {
    setEditingEvent(event);
    setTitle(event?.title || '');
    setDescription(event?.description || '');
    setImageUrl(event?.imageUrl || '');
    setDate(event?.date || '');
    setIsActive(event?.isActive ?? true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const eventData: any = { 
        title, 
        description,
        imageUrl,
        date,
        isActive 
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        toast.success("Event updated!");
      } else {
        await addEvent(eventData);
        toast.success("Event added!");
      }
      setIsModalOpen(false);
      loadEvents();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await deleteEvent(id);
      loadEvents();
      toast.success("Event deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete event");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
      <AdminSidebar />
      <div className="flex-grow p-4 md:p-8 overflow-x-hidden">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-4 mb-8 sm:mb-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">Events</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage upcoming events</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 text-white font-black px-6 py-4 sm:py-3 rounded-2xl flex items-center justify-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 w-full sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          <span className="uppercase tracking-widest text-xs">Add New Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">LOADING EVENTS...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
            <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">NO EVENTS FOUND</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className={`bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all ${!event.isActive && 'opacity-75 grayscale-[0.5]'}`}>
              <div className="aspect-video w-full bg-gray-100 relative">
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    <Calendar className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${
                    event.isActive ? 'bg-emerald-500/90 text-white' : 'bg-gray-500/90 text-white'
                  }`}>
                    {event.isActive ? 'Active' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center text-blue-600 font-bold text-xs uppercase tracking-widest mb-3">
                  <Calendar className="w-4 h-4 mr-2" />
                  {event.date}
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-3 group-hover:text-blue-600 transition-colors uppercase">{event.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">
                  {event.description}
                </p>
                <div className="flex items-center justify-end space-x-2 border-t border-gray-50 pt-6">
                  <button 
                    onClick={() => openModal(event)}
                    className="p-3 text-blue-600 bg-blue-50 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(event.id)}
                    className="p-3 text-red-600 bg-red-50 rounded-2xl hover:bg-red-600 hover:text-white transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-black text-gray-900 text-xl tracking-tight uppercase">
                  {editingEvent ? 'Edit Event' : 'New Event'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-8 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Event Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Weekend Flash Sale"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-24 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Event details"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                    <input 
                      type="text" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      placeholder="e.g. Oct 24th, 2026"
                      required
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isActive ? 'bg-emerald-600 border-emerald-600' : 'border-gray-200 group-hover:border-gray-300'}`}>
                        {isActive && <div className="text-white font-bold text-xs">✓</div>}
                      </div>
                      <span className="ml-3 text-sm font-bold text-gray-700">Set as Active</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Image URL (Optional)</label>
                  <input 
                    type="text" 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Direct image link"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-14 rounded-2xl font-black text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-14 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-100 uppercase tracking-widest text-xs"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <span>Save Event</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
