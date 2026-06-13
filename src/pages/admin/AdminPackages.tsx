import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Loader2, Gem } from 'lucide-react';
import { Package } from '../../types';
import { getPackages, addPackage, updatePackage, deletePackage } from '../../services/db';
import { GAMES } from '../../constants';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function AdminPackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState(GAMES[0].id);
  const [diamonds, setDiamonds] = useState(0);
  const [price, setPrice] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPackages(false);
      setPackages(data);
    } catch (err: any) {
      console.error(err);
      try {
        const parsed = JSON.parse(err.message);
        setError(parsed.error || "Permission denied");
      } catch {
        setError("Failed to fetch packages. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  const openModal = (pkg: Package | null = null) => {
    setEditingPackage(pkg);
    setName(pkg?.name || '');
    setGameId(pkg?.gameId || GAMES[0].id);
    setDiamonds(pkg?.diamonds || 0);
    setPrice(pkg?.price || 0);
    setImageUrl(pkg?.imageUrl || '');
    setIsActive(pkg?.isActive ?? true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const pkgData: any = { 
        name, 
        gameId,
        diamonds, 
        price: Number(price), 
        imageUrl,
        isActive, 
        createdAt: Date.now() 
      };
      if (editingPackage) {
        await updatePackage(editingPackage.id, pkgData);
      } else {
        await addPackage(pkgData);
      }
      setIsModalOpen(false);
      fetchData();
      toast.success(editingPackage ? "Package updated!" : "Package added!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error saving package");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this package?')) {
      try {
        await deletePackage(id);
        fetchData();
        toast.success("Package deleted");
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Error deleting package");
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
      <AdminSidebar />
      <div className="flex-grow p-4 md:p-8 overflow-x-hidden">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Manage Packages</h1>
            <p className="text-sm text-gray-500 font-medium">Add, edit or disable diamond packages.</p>
          </div>
          <button 
            onClick={() => openModal()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all font-sans"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Package
          </button>
        </header>


        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center text-red-600 font-sans">
             <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center mr-4">
               <ImageIcon className="h-5 w-5 text-red-600" />
             </div>
             <div>
               <p className="font-bold text-sm">Error Loading Packages</p>
               <p className="text-xs opacity-80">{error}</p>
             </div>
             <button 
              onClick={() => fetchData()}
              className="ml-auto px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors"
             >
               Retry
             </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 md:p-20">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Fetching data...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-5 font-sans">Preview</th>
                      <th className="px-8 py-5 font-sans">Package</th>
                      <th className="px-8 py-5 font-sans text-center">Diamonds</th>
                      <th className="px-8 py-5 font-sans">Price</th>
                      <th className="px-8 py-5 font-sans text-center">Status</th>
                      <th className="px-8 py-5 text-right font-sans">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {packages.map((pkg) => (
                      <tr key={pkg.id} className="group hover:bg-blue-50/50 transition-colors whitespace-nowrap">
                        <td className="px-8 py-5">
                          <div className="bg-white border border-gray-100 h-14 w-14 rounded-2xl flex items-center justify-center text-gray-400 overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                            {pkg.imageUrl ? (
                              <img 
                                src={pkg.imageUrl} 
                                alt={pkg.name} 
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-contain p-1" 
                              />
                            ) : (
                              <Gem className="h-6 w-6 text-gray-200" />
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="font-black text-gray-900 font-sans text-lg tracking-tight">{pkg.name}</div>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[10px] bg-gray-100 text-gray-500 font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                              {GAMES.find(g => g.id === pkg.gameId)?.name || 'Unknown'}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ID: {pkg.id.slice(0, 8)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black ring-1 ring-blue-100 italic">
                            {pkg.diamonds}
                          </span>
                        </td>
                        <td className="px-8 py-5 font-black text-gray-900 tracking-tighter text-lg font-sans">
                          <span className="text-xs text-gray-400 font-bold mr-1 italic">LKR</span>
                          {pkg.price.toLocaleString()}
                        </td>
                        <td className="px-8 py-5 text-center border-emerald-50">
                          <button 
                            onClick={async () => {
                              try {
                                await updatePackage(pkg.id, { ...pkg, isActive: !pkg.isActive });
                                toast.success(`Package ${!pkg.isActive ? 'active' : 'disabled'}`);
                                fetchData();
                              } catch (err) {
                                toast.error("Toggle failed");
                              }
                            }}
                            className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            pkg.isActive 
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}>
                            {pkg.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="px-8 py-5 text-right space-x-1">
                          <button 
                            onClick={() => openModal(pkg)}
                            className="inline-flex p-3 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(pkg.id)}
                            className="inline-flex p-3 rounded-xl text-gray-400 hover:text-red-600 hover:bg-white hover:shadow-sm transition-all"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Grid View */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <div key={pkg.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4 font-sans">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="bg-gray-50 border border-gray-100 h-12 w-12 rounded-2xl flex items-center justify-center text-gray-400 overflow-hidden shrink-0">
                        {pkg.imageUrl ? (
                          <img src={pkg.imageUrl} alt={pkg.name} className="h-full w-full object-contain p-1" />
                        ) : (
                          <Gem className="h-5 w-5 text-gray-200" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-gray-900 tracking-tight break-words">{pkg.name}</h3>
                        <p className="text-[10px] bg-gray-100 text-gray-500 font-black px-2 py-0.5 rounded uppercase tracking-tighter inline-block mt-1">
                          {GAMES.find(g => g.id === pkg.gameId)?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        try {
                          await updatePackage(pkg.id, { ...pkg, isActive: !pkg.isActive });
                          toast.success(`Package ${!pkg.isActive ? 'active' : 'disabled'}`);
                          fetchData();
                        } catch (err) {
                          toast.error("Toggle failed");
                        }
                      }}
                      className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                      pkg.isActive 
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                      {pkg.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-2">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Diamonds</p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black ring-1 ring-blue-100 italic">
                        {pkg.diamonds}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Price</p>
                      <p className="font-black text-gray-900 tracking-tighter">
                        <span className="text-xs text-gray-400 font-bold mr-1 italic">LKR</span>
                        {pkg.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    <button 
                      onClick={() => openModal(pkg)}
                      className="flex-1 inline-flex items-center justify-center py-2.5 rounded-xl bg-gray-50 text-gray-600 font-bold text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(pkg.id)}
                      className="flex-1 inline-flex items-center justify-center py-2.5 rounded-xl bg-gray-50 text-gray-600 font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-8 shadow-2xl"
            >
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900">
                  {editingPackage ? 'Edit Package' : 'New Package'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
             </div>
             
             <form onSubmit={handleSave} className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Target Game</label>
                 <select 
                   value={gameId}
                   onChange={(e) => setGameId(e.target.value)}
                   className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                   required
                 >
                   {GAMES.filter(g => !g.comingSoon).map(game => (
                     <option key={game.id} value={game.id}>{game.name}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Package Name</label>
                 <input 
                   type="text" 
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                   placeholder="Weekly Membership"
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
                 <div className="flex space-x-2">
                   <div className="h-11 w-11 flex-shrink-0 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                     {imageUrl ? (
                       <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                     ) : (
                       <ImageIcon className="h-5 w-5 text-gray-300" />
                     )}
                   </div>
                   <input 
                     type="url" 
                     value={imageUrl}
                     onChange={(e) => setImageUrl(e.target.value)}
                     className="flex-grow h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                     placeholder="https://example.com/image.png"
                   />
                 </div>
                 <p className="text-[10px] text-gray-400 mt-1">Paste a URL for the package icon/image.</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Diamonds</label>
                   <input 
                     type="number" 
                     value={diamonds}
                     onChange={(e) => setDiamonds(Number(e.target.value))}
                     className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                     placeholder="100"
                     required
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Price (LKR)</label>
                   <input 
                     type="number" 
                     value={price}
                     onChange={(e) => setPrice(Number(e.target.value))}
                     className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                     placeholder="15000"
                     required
                   />
                 </div>
               </div>
               
               <div className="flex items-center py-2">
                 <input 
                  type="checkbox" 
                  id="is_active" 
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                 />
                 <label htmlFor="is_active" className="ml-2 text-sm font-bold text-gray-700">Set as Active</label>
               </div>

               <div className="pt-4 flex space-x-3">
                 <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-sm font-bold rounded-xl text-gray-600 hover:bg-gray-50 bg-white transition-all"
                 >
                   Cancel
                 </button>
                 <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-blue-600 text-sm font-bold rounded-xl text-white hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center"
                 >
                   {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Package'}
                 </button>
               </div>
             </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
