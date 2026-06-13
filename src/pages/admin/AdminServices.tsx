import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Sparkles, Loader2 } from 'lucide-react';
import { Service } from '../../types';
import { getServices, addService, updateService, deleteService } from '../../services/db';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    const data = await getServices(false);
    setServices(data);
    setIsLoading(false);
  };

  const openModal = (service: Service | null = null) => {
    setEditingService(service);
    setTitle(service?.title || '');
    setDescription(service?.description || '');
    setImageUrl(service?.imageUrl || '');
    setBannerUrl(service?.bannerUrl || '');
    setIsActive(service?.isActive ?? true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const serviceData: any = { 
        title, 
        description,
        imageUrl,
        bannerUrl,
        isActive 
      };

      if (editingService) {
        await updateService(editingService.id, serviceData);
        toast.success("Service updated!");
      } else {
        await addService(serviceData);
        toast.success("Service added!");
      }
      setIsModalOpen(false);
      loadServices();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await deleteService(id);
      loadServices();
      toast.success("Service deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete service");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
      <AdminSidebar />
      <div className="flex-grow p-4 md:p-8 overflow-x-hidden">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-4 mb-8 sm:mb-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">Services</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage more services</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 text-white font-black px-6 py-4 sm:py-3 rounded-2xl flex items-center justify-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 w-full sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Service</span>
        </button>
      </div>

      <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Service Details</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">LOADING SERVICES...</p>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <Sparkles className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">NO SERVICES FOUND</p>
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-black text-gray-900 font-sans text-lg tracking-tight">{service.title}</div>
                      <div className="text-[12px] text-gray-500 max-w-sm truncate mt-1">
                        {service.description}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        service.isActive ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                      }`}>
                        {service.isActive ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => openModal(service)}
                          className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(service.id)}
                          className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                   {editingService ? 'Edit Service' : 'New Service'}
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
                  <label className="block text-sm font-bold text-gray-700 mb-1">Service Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    placeholder="e.g. Graphic Design"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-24 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium"
                    placeholder="Service description"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Thumbnail Image URL (Shown on Home)</label>
                  <input 
                    type="text" 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Direct image link for thumbnail"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Banner Image URL (Shown in Page)</label>
                  <input 
                    type="text" 
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Direct image link for wide banner"
                  />
                </div>

                <div className="flex items-center pt-2">
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
                      <span>Save Service</span>
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
