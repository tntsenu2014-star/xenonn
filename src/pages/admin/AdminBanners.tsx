import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Loader2, List } from 'lucide-react';
import { Banner } from '../../types';
import { getBanners, addBanner, updateBanner, deleteBanner } from '../../services/db';
import { toast } from 'sonner';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setIsLoading(true);
    const data = await getBanners(false);
    setBanners(data);
    setIsLoading(false);
  };

  const openModal = (banner: Banner | null = null) => {
    setEditingBanner(banner);
    setTitle(banner?.title || '');
    setImageUrl(banner?.imageUrl || '');
    setLinkUrl(banner?.linkUrl || '');
    setOrder(banner?.order || banners.length + 1);
    setIsActive(banner?.isActive ?? true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const bannerData: any = { 
        title, 
        imageUrl, 
        linkUrl,
        order: Number(order), 
        isActive 
      };

      if (editingBanner) {
        await updateBanner(editingBanner.id, bannerData);
        toast.success("Banner updated!");
      } else {
        await addBanner(bannerData);
        toast.success("Banner added!");
      }
      setIsModalOpen(false);
      loadBanners();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await deleteBanner(id);
      loadBanners();
      toast.success("Banner deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete banner");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
      <AdminSidebar />
      <div className="flex-grow p-4 md:p-8 overflow-x-hidden">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-4 mb-8 sm:mb-0">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">Home Banners</h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage home screen slideshow</p>
            </div>
            <button 
              onClick={() => openModal()}
              className="bg-blue-600 text-white font-black px-6 py-4 sm:py-3 rounded-2xl flex items-center justify-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 w-full sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Banner</span>
            </button>
          </div>

          <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Image</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Banner Details</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Order</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">LOADING BANNERS...</p>
                      </td>
                    </tr>
                  ) : banners.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <ImageIcon className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">NO BANNERS FOUND</p>
                      </td>
                    </tr>
                  ) : (
                    banners.map((banner) => (
                      <tr key={banner.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="h-20 w-40 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
                            {banner.imageUrl ? (
                              <img src={banner.imageUrl} alt="banner" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-gray-300" />
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="font-black text-gray-900 font-sans text-lg tracking-tight">{banner.title}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate max-w-[200px]">
                            URL: {banner.imageUrl}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-black ring-1 ring-blue-100">
                            #{banner.order}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            banner.isActive ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                          }`}>
                            {banner.isActive ? 'Active' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => openModal(banner)}
                              className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(banner.id)}
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
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-black text-gray-900 text-xl tracking-tight uppercase">
                {editingBanner ? 'Edit Banner' : 'New Banner'}
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
                <label className="block text-sm font-bold text-gray-700 mb-1">Banner Title (Admin Use)</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                   className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Summer Promo 01"
                   required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
                <input 
                  type="text" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Direct image link"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Link URL (Optional)</label>
                <input 
                  type="text" 
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. /order?game=freefire"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Display Order</label>
                  <input 
                    type="number" 
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
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
                    <span>Save Banner</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
