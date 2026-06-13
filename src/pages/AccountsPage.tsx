import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getAccountListings } from '../services/db';
import { AccountListing } from '../types';
import { Loader2, Search, Filter, User, Trophy, MapPin, ArrowRight, ShieldCheck, Zap, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton';

export default function AccountsPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AccountListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const data = await getAccountListings(true, true);
        setAccounts(data);
      } catch (err) {
        setError("Failed to load accounts. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = (acc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (acc.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (acc.rareItems || []).some(item => item && typeof item === 'string' && item.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeFilter === 'all') return matchesSearch;
    const rank = acc.rank || '';
    if (activeFilter === 'heroic') return matchesSearch && rank.toLowerCase().includes('heroic');
    if (activeFilter === 'master') return matchesSearch && rank.toLowerCase().includes('master');
    if (activeFilter === 'grandmaster') return matchesSearch && rank.toLowerCase().includes('grandmaster');
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#070708] font-sans pb-20">
      {/* Header Section */}
      <div className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5 dark:bg-blue-600/5 blur-3xl rounded-full translate-y-[-50%]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-6 border border-blue-100 dark:border-blue-800"
            >
              <Zap className="h-3 w-3 fill-current" />
              <span>Premium IDs</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter mb-6 leading-tight uppercase"
            >
              BUY FF <span className="text-blue-600 dark:text-blue-500">ACCOUNTS</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 dark:text-gray-400 font-medium text-lg mb-10 leading-relaxed"
            >
              The safest marketplace to buy verified Free Fire accounts. Handpicked listings with rare items and high ranks.
            </motion.p>

            {/* Search & Filter Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto bg-white dark:bg-[#0d0d0f] p-2 rounded-[1.5rem] shadow-2xl shadow-blue-500/10 border border-gray-100 dark:border-white/5"
            >
              <div className="flex-grow flex items-center px-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent focus-within:border-blue-500/50 transition-colors">
                <Search className="h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search level, rank, evo guns..." 
                  className="w-full h-12 bg-transparent border-none outline-none px-3 text-gray-700 dark:text-gray-200 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                 {['all', 'heroic', 'master', 'grandmaster'].map(filter => (
                   <button 
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeFilter === filter 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                   >
                     {filter}
                   </button>
                 ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] p-6 border border-gray-100 dark:border-white/5 shadow-sm">
                <Skeleton className="w-full aspect-video rounded-3xl mb-6" />
                <Skeleton className="h-8 w-3/4 mb-4" />
                <div className="flex gap-2 mb-6">
                  <Skeleton className="h-6 w-16 rounded-lg" />
                  <Skeleton className="h-6 w-16 rounded-lg" />
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-10 w-24 rounded-xl" />
                  <Skeleton className="h-12 w-24 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
           <div className="text-center py-20 bg-red-50 dark:bg-red-900/10 rounded-[3rem] border border-red-100 dark:border-red-900/30">
              <Info className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <p className="text-red-700 dark:text-red-400 font-bold">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 text-sm font-black text-red-600 underline">Try again</button>
           </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="text-center py-20">
            <Search className="h-16 w-16 text-gray-200 dark:text-white/10 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-gray-400 dark:text-white/20 tracking-tighter">NO ACCOUNTS FOUND</h3>
            <p className="text-gray-400 dark:text-gray-500 font-medium mt-2">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredAccounts.map((acc, idx) => (
              <motion.div 
                key={acc.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (idx % 3) * 0.1 }}
                className={`group relative bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] p-4 sm:p-5 border border-gray-100 dark:border-white/5 shadow-xl shadow-gray-100/50 dark:shadow-none hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col h-full ${acc.isSold ? 'opacity-75 grayscale-[0.5]' : ''}`}
              >
                {/* Image Gallery Preview */}
                <div className="relative aspect-[4/3] sm:aspect-[16/10] rounded-[1.8rem] sm:rounded-[2rem] overflow-hidden mb-5 sm:mb-6 bg-gray-100 dark:bg-black/40">
                  {acc.isSold && (
                    <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-red-500/50 border-2 border-red-400/50 rotate-[-5deg]"
                      >
                        Sold Out
                      </motion.div>
                    </div>
                  )}
                  <img 
                    src={acc.images[0] || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80'} 
                    alt={acc.title}
                    className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none"></div>
                  
                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="flex items-center text-[9px] font-black text-white bg-blue-600 px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20">
                       <Zap className="h-2.5 w-2.5 mr-1.5 fill-current" />
                       Featured
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="flex items-center text-[10px] font-black text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl uppercase tracking-tight">
                         {acc.images.length} PHOTOS
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-gray-300 dark:text-gray-400 uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl">
                       ID: {acc.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow px-1">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="inline-flex items-center text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-transparent dark:border-white/5">
                      <User className="h-3 w-3 mr-1.5 text-blue-500" />
                      LVL {acc.level}
                    </div>
                    <div className="inline-flex items-center text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-100/50 dark:border-blue-500/20">
                      <Trophy className="h-3 w-3 mr-1.5" />
                      {acc.rank}
                    </div>
                    <div className="inline-flex items-center text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-xl">
                      <MapPin className="h-3 w-3 mr-1.5 text-emerald-500" />
                      {acc.region}
                    </div>
                    {acc.ffId && (
                      <div className="inline-flex items-center text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                        <span className="text-[8px] opacity-60 mr-1.5">FF ID</span>
                        {acc.ffId}
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tighter mb-4 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors line-clamp-1">
                    {acc.title}
                  </h3>

                  <div className="flex flex-wrap gap-1.5 mb-6 opacity-70 group-hover:opacity-100 transition-opacity">
                    {acc.rareItems.slice(0, 3).map((item, i) => (
                      <span key={i} className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                        {item}
                      </span>
                    ))}
                    {acc.rareItems.length > 3 && (
                      <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                        +{acc.rareItems.length - 3} MORE
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer / Price */}
                <div className="pt-5 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-end justify-between mb-5">
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Starting From</p>
                      <div className="flex items-baseline">
                        <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-500 font-black mr-1 italic">LKR</span>
                        <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                          {acc.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-emerald-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                      <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      Verified
                    </div>
                  </div>
                  
                  <div className="flex flex-row gap-2">
                    <button 
                      onClick={() => navigate(`/account/${acc.id}`)}
                      className="flex-1 h-11 sm:h-12 flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-black text-[10px] uppercase tracking-widest rounded-xl sm:rounded-2xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/5 active:scale-95 cursor-pointer"
                    >
                      Details
                    </button>
                    {acc.isSold ? (
                      <div className="flex-[1.5] h-11 sm:h-12 flex items-center justify-center font-black text-[10px] uppercase tracking-widest rounded-xl sm:rounded-2xl bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed">
                        Sold Out
                      </div>
                    ) : (
                      <button 
                        onClick={() => navigate(`/account/${acc.id}?buy=true`)}
                        className="flex-[1.5] h-11 sm:h-12 flex items-center justify-center font-black text-[10px] uppercase tracking-widest rounded-xl sm:rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.03] active:scale-95 transition-all group/btn cursor-pointer"
                      >
                        <span>Buy Now</span>
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 md:p-16 glass-card rounded-[3rem] border border-gray-100 dark:border-white/10 text-center">
           <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-[1.5rem] bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                 <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">Verified Only</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Every account is strictly verified by our admins before listing.</p>
           </div>
           <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-[1.5rem] bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
                 <Zap className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">Instant Transfer</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Get your details securely within minutes of payment confirmation.</p>
           </div>
           <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-[1.5rem] bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6">
                 <Trophy className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">Best Selection</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Access rare skins, incubator items, and high-level IDs you can't find anywhere else.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
