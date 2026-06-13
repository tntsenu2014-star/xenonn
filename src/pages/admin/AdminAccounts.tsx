import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Loader2, User, Trophy, Star, MapPin } from 'lucide-react';
import { AccountListing } from '../../types';
import { getAccountListings, addAccountListing, updateAccountListing, deleteAccountListing } from '../../services/db';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState<AccountListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountListing | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [level, setLevel] = useState(0);
  const [rank, setRank] = useState('');
  const [ffId, setFfId] = useState('');
  const [rareItems, setRareItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImage, setNewImage] = useState('');
  const [region, setRegion] = useState('Global');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAccountListings(false, true);
      setAccounts(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch accounts. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const openModal = (acc: AccountListing | null = null) => {
    setEditingAccount(acc);
    setTitle(acc?.title || '');
    setDescription(acc?.description || '');
    setPrice(acc?.price || 0);
    setLevel(acc?.level || 0);
    setRank(acc?.rank || '');
    setFfId(acc?.ffId || '');
    setRareItems(acc?.rareItems || []);
    setImages(acc?.images || []);
    setRegion(acc?.region || 'Global');
    setIsActive(acc?.isActive ?? true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const accData: any = { 
        title, 
        description,
        price: Number(price), 
        level: Number(level),
        rank,
        ffId,
        rareItems,
        images,
        region,
        isSold: editingAccount?.isSold || false,
        isActive, 
      };
      if (editingAccount) {
        await updateAccountListing(editingAccount.id, accData);
      } else {
        await addAccountListing(accData);
        toast.success("Account created successfully!");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error saving account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this account listing?')) {
      try {
        await deleteAccountListing(id);
        toast.success("Account deleted");
        fetchData();
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Error deleting account");
      }
    }
  };

  const addRareItem = () => {
    if (!newItem.trim()) return;
    if (rareItems.includes(newItem.trim())) {
      toast.error("Tag already added");
      return;
    }
    setRareItems([...rareItems, newItem.trim()]);
    setNewItem('');
    toast.success("Tag added");
  };

  const removeRareItem = (item: string) => {
    setRareItems(rareItems.filter(i => i !== item));
  };

  const addImageUrl = () => {
    if (!newImage.trim()) return;
    if (images.includes(newImage.trim())) {
      toast.error("Image URL already added");
      return;
    }
    // Basic URL validation
    if (!newImage.startsWith('http') && !newImage.startsWith('data:image')) {
      toast.error("Invalid URL format");
      return;
    }
    setImages([...images, newImage.trim()]);
    setNewImage('');
    toast.success("Image added");
  };

  const removeImage = (url: string) => {
    setImages(images.filter(i => i !== url));
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
      <AdminSidebar />
      <div className="flex-grow p-4 md:p-8 overflow-x-hidden">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">FF Account Listings</h1>
            <p className="text-sm text-gray-500 font-medium">Manage FF account listings for sale.</p>
          </div>
          <button 
            onClick={() => openModal()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all font-sans"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Account
          </button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 md:p-20">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Fetching accounts...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {accounts.map((acc) => (
              <div key={acc.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 relative overflow-hidden group">
                {acc.isSold && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full z-10">
                    Sold
                  </div>
                )}
                
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                  {acc.images[0] ? (
                    <img src={acc.images[0]} alt={acc.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-lg">
                    {acc.images.length} Photos
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight">{acc.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className="flex items-center text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                      <User className="h-3 w-3 mr-1" />
                      Lv.{acc.level}
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                      <Trophy className="h-3 w-3 mr-1" />
                      {acc.rank}
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                      <MapPin className="h-3 w-3 mr-1" />
                      {acc.region}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</p>
                    <p className="text-2xl font-black text-gray-900 tracking-tighter">
                      <span className="text-xs text-gray-400 font-bold mr-1 italic">LKR</span>
                      {acc.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openModal(acc)}
                      className="p-2.5 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(acc.id)}
                      className="p-2.5 bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                   <button 
                    onClick={async () => {
                      try {
                        await updateAccountListing(acc.id, { ...acc, isActive: !acc.isActive });
                        toast.success(`Account listing ${!acc.isActive ? 'visible' : 'hidden'}`);
                        fetchData();
                      } catch (err) {
                        toast.error("Failed to update visibility");
                      }
                    }}
                    className={`flex-1 text-[10px] font-black uppercase tracking-widest py-2 rounded-xl border transition-all ${
                      acc.isActive 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                        : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                    }`}
                   >
                     {acc.isActive ? 'Visible' : 'Hidden'}
                   </button>
                   <button 
                    onClick={async () => {
                      try {
                        await updateAccountListing(acc.id, { ...acc, isSold: !acc.isSold });
                        toast.success(`Account marked as ${!acc.isSold ? 'sold' : 'available'}`);
                        fetchData();
                      } catch (err) {
                        toast.error("Failed to update status");
                      }
                    }}
                    className={`flex-1 text-[10px] font-black uppercase tracking-widest py-2 rounded-xl border transition-all ${
                      acc.isSold 
                        ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                        : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
                    }`}
                   >
                     {acc.isSold ? 'Sold' : 'Available'}
                   </button>
                </div>
              </div>
            ))}
          </div>
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
              className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900">
                  {editingAccount ? 'Edit Account' : 'New Account Listing'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-400">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Listing Title</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="High End ID - 10 Evo Guns"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                      placeholder="Account details, weapon skins, etc."
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Price (LKR)</label>
                      <input 
                        type="number" 
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Region</label>
                      <input 
                        type="text" 
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Level</label>
                      <input 
                        type="number" 
                        value={level}
                        onChange={(e) => setLevel(Number(e.target.value))}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Rank</label>
                      <input 
                        type="text" 
                        value={rank}
                        onChange={(e) => setRank(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Heroic/Grandmaster"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Free Fire ID (FF ID)</label>
                    <input 
                      type="text" 
                      value={ffId}
                      onChange={(e) => setFfId(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="e.g. 1234567890"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Account Images (URLs)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addImageUrl();
                          }
                        }}
                        className="flex-grow h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Image URL"
                      />
                      <button 
                        type="button" 
                        onClick={addImageUrl}
                        className="h-11 px-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {images.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden group border border-gray-100">
                          <img src={url} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removeImage(url)}
                            className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Rare Items Tags</label>
                    <div className="flex gap-2">
                       <input 
                        type="text" 
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addRareItem();
                          }
                        }}
                        className="flex-grow h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Evo AK, Blue Dino..."
                      />
                      <button 
                        type="button" 
                        onClick={addRareItem}
                        className="h-11 px-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                      >
                         <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {rareItems.map((item, i) => (
                        <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-black ring-1 ring-blue-100">
                          {item}
                          <button type="button" onClick={() => removeRareItem(item)} className="ml-1.5 text-blue-400 hover:text-blue-600">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-4">
                     <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="acc_active" 
                          checked={isActive} 
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600" 
                        />
                        <label htmlFor="acc_active" className="ml-2 text-sm font-bold text-gray-700">Listing Visible</label>
                     </div>
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 flex space-x-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 text-sm font-bold rounded-xl text-gray-600 hover:bg-gray-50 bg-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-blue-600 text-sm font-bold rounded-xl text-white hover:bg-blue-700 shadow-lg flex items-center justify-center"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : (editingAccount ? 'Update Listing' : 'Create Listing')}
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
