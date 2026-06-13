import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, Package as PackageIcon, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { getUserOrders, mapDocData } from '../services/db';
import { Order, OrderStatus } from '../types';
import { Link } from 'react-router-dom';
import { useUser } from '../lib/UserContext';
import { collection, query, or, where, onSnapshot, orderBy } from '../lib/firestore-compat';
import { db } from '../lib/firebase';

export default function OrderHistoryPage() {
  const { profile } = useUser();
  const [identifier, setIdentifier] = useState(profile.playerId || profile.whatsappNumber || '');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  // Automatically search if identifier is present from profile on load
  useEffect(() => {
    if (identifier) {
      handleSearchEvent();
    }
  }, []);

  useEffect(() => {
    if (!searched || !identifier.trim()) return;

    const q = query(
      collection(db, 'orders'),
      or(where('userId', '==', identifier.trim()), where('customerPhone', '==', identifier.trim()))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => mapDocData<Order>(doc));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(data);
    }, (err) => {
      console.error(err);
    });

    return () => unsubscribe();
  }, [searched, identifier]);

  const handleSearchEvent = async () => {
    if (!identifier.trim()) return;
    setLoading(true);
    setSearched(true);
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSearchEvent();
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
      case OrderStatus.CONFIRMED: return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
      case OrderStatus.PENDING: return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
      case OrderStatus.CANCELED: return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20';
      default: return 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/10';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: return <CheckCircle2 className="w-3.5 h-3.5 mr-2" />;
      case OrderStatus.CONFIRMED: return <CheckCircle2 className="w-3.5 h-3.5 mr-2" />;
      case OrderStatus.PENDING: return <Clock className="w-3.5 h-3.5 mr-2 animate-pulse" />;
      case OrderStatus.CANCELED: return <XCircle className="w-3.5 h-3.5 mr-2" />;
      default: return <AlertCircle className="w-3.5 h-3.5 mr-2" />;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-[#070708] min-h-screen pb-24 font-sans px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8 sm:y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4 sm:space-y-6 pt-8 sm:pt-0">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-4 sm:p-6 bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-blue-500/5 relative overflow-hidden group"
          >
            <PackageIcon className="w-8 h-8 sm:w-10 sm:h-10 relative z-10" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none transition-colors"
          >
            Order history
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto font-bold uppercase tracking-widest text-[9px] sm:text-[10px]"
          >
            Search and track your order status using your Player ID or phone number.
          </motion.p>
        </div>

        {/* Search Box */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] p-4 sm:p-6 border border-gray-100 dark:border-white/5 shadow-xl shadow-blue-500/5 max-w-2xl mx-auto transition-colors"
        >
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="relative flex-1 group/input min-w-0">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter Player ID or Phone"
                className="w-full h-16 pl-16 pr-6 rounded-[1.5rem] border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:border-blue-500/40 dark:focus:border-blue-600 focus:bg-white dark:focus:bg-white/10 outline-none transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 tracking-wider text-sm uppercase"
                required
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !identifier.trim()}
              className="h-16 px-10 bg-blue-600 text-white font-bold rounded-[1.5rem] transition-all shadow-xl shadow-blue-600/20 disabled:opacity-30 flex items-center justify-center w-full sm:w-auto shrink-0 text-sm uppercase tracking-widest"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Search orders'}
            </motion.button>
          </form>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {searched && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {orders.length === 0 ? (
                <div className="bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] p-20 text-center border border-gray-100 dark:border-white/5 shadow-xl transition-colors">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-100 dark:border-white/10">
                    <Search className="w-10 h-10 text-gray-300 dark:text-gray-700" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">No orders found</h3>
                  <p className="text-gray-500 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                    We couldn't find any orders for "{identifier}".
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {orders.map((order, index) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={order.id}
                      className="bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] p-6 sm:p-10 border border-gray-100 dark:border-white/5 shadow-xl hover:shadow-2xl hover:border-blue-100 dark:hover:border-blue-900 transition-all flex flex-col sm:flex-row gap-6 sm:items-center justify-between group relative overflow-hidden transition-colors"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-0 bg-blue-600 group-hover:h-full transition-all duration-500" />
                      
                      <div className="flex-1 space-y-6 relative z-10 min-w-0">
                        <div className="flex flex-wrap items-center gap-4">
                          <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-colors ${getStatusColor(order.status)} whitespace-nowrap`}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/10">Order: #{order.id?.slice(-8).toUpperCase()}</span>
                          <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest flex items-center gap-2">
                             <Clock className="w-3 h-3 opacity-40" />
                             {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {order.packageName || "Item Package"}
                          </h3>
                          <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-x-6 gap-y-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            <p className="flex items-center gap-2">Player ID: <span className="text-gray-900 dark:text-gray-200 font-mono tracking-normal">{order.userId}</span></p>
                            <span className="hidden sm:inline opacity-20">/</span>
                            <p className="flex items-center gap-2">Name: <span className="text-gray-900 dark:text-gray-200">{order.customerName}</span></p>
                            {order.paymentProofUrl && (
                               <>
                                 <span className="hidden sm:inline opacity-20">/</span>
                                 <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                                   <CheckCircle2 className="w-3 h-3" />
                                   Proof Uploaded
                                 </p>
                               </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-gray-50 dark:border-white/5 pt-6 sm:pt-0 sm:gap-4 w-full sm:w-auto shrink-0 relative z-10">
                        <div className="text-left sm:text-right">
                          <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Price</p>
                          <p className="text-3xl font-black text-gray-900 dark:text-white italic">LKR {(order.amount || 0).toFixed(2)}</p>
                        </div>
                        
                        <Link 
                          to={`/confirmation/${order.id}`}
                          className="px-8 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white hover:border-blue-600 dark:hover:border-blue-600 text-gray-900 dark:text-gray-200 font-bold rounded-2xl transition-all text-[10px] uppercase tracking-widest"
                        >
                          View order
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

  );
}
