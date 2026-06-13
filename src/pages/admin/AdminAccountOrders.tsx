import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Loader2, Search, Filter, Phone, User, Clock, CheckCircle, XCircle, Info, ExternalLink, MessageSquare, ShoppingBag, Eye, X, Landmark, Zap } from 'lucide-react';
import { AccountOrder, OrderStatus, PaymentMethod } from '../../types';
import { updateAccountOrderStatus, mapDocData } from '../../services/db';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, orderBy } from '../../lib/firestore-compat';
import { db } from '../../lib/firebase';

export default function AdminAccountOrders() {
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<AccountOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setLoading(true);
    const ordersCol = collection(db, 'accountOrders');
    let q = query(ordersCol);
    
    if (statusFilter !== 'all') {
      q = query(ordersCol, where('status', '==', statusFilter));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => mapDocData<AccountOrder>(doc));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      toast.error("Failed to stream account orders.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    setIsUpdating(true);
    try {
      await updateAccountOrderStatus(id, status);
      toast.success(`Order marked as ${status}`);
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
      // onSnapshot handles the refresh
    } catch (err) {
      console.error(err);
      toast.error("Status update failed.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
      <AdminSidebar />
      <div className="flex-grow p-4 md:p-8 overflow-x-hidden">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Account Orders</h1>
            <p className="text-sm text-gray-500 font-medium">Manage sales for FF accounts.</p>
          </div>
          
          <div className="flex gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto max-w-full">
            {['all', OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.COMPLETED, OrderStatus.CANCELED].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  statusFilter === status 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-6" />
            <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Processing Data...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-[#0d0d0f] rounded-[3rem] p-24 text-center border border-gray-100 dark:border-white/5 shadow-2xl shadow-blue-500/5">
            <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="h-10 w-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">No Transactions Found</h3>
            <p className="text-gray-400 font-medium mt-2 max-w-sm mx-auto">The digital marketplace is currently quiet. Orders will appear here as soon as customers checkout.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl p-8 flex flex-col xl:flex-row xl:items-center gap-8 group hover:border-blue-500/30 transition-all duration-500 relative overflow-hidden"
              >
                {/* Status Indicator Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${
                   order.status === OrderStatus.COMPLETED ? 'bg-emerald-500' :
                   order.status === OrderStatus.CONFIRMED ? 'bg-blue-500' :
                   order.status === OrderStatus.PENDING ? 'bg-amber-500' : 'bg-red-500'
                } shadow-[4px_0_15px_rgba(0,0,0,0.1)]`}></div>
                
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-48 h-48 -mr-24 -mt-24 bg-blue-600/[0.02] rounded-full blur-3xl group-hover:bg-blue-600/[0.05] transition-all duration-1000"></div>

                <div className="flex-grow z-10">
                  <div className="flex items-center flex-wrap gap-3 mb-4">
                    <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center">
                       <Clock className="h-3 w-3 mr-1.5" />
                       {format(order.createdAt, 'MMM dd, yyyy • HH:mm')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${
                      order.status === OrderStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      order.status === OrderStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      order.status === OrderStatus.CONFIRMED ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-4 leading-none uppercase group-hover:text-blue-600 transition-colors">
                    {order.accountTitle}
                  </h3>

                  <div className="flex flex-wrap gap-6 pt-6 border-t border-gray-50 dark:border-white/5">
                    <div className="flex items-center">
                       <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mr-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <User className="h-4.5 w-4.5" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Customer</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{order.customerName}</p>
                       </div>
                    </div>
                    <div className="flex items-center">
                       <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mr-3 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          <Phone className="h-4.5 w-4.5" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Contact</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{order.customerPhone}</p>
                       </div>
                    </div>
                    <div className="flex items-center">
                       <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mr-3 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                          <Landmark className="h-4.5 w-4.5" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Payment Method</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{order.paymentMethod.replace('_', ' ')}</p>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="xl:text-right flex flex-col xl:items-end justify-center min-w-[200px] z-10">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 opacity-60">Settlement Amount</p>
                   <div className="flex items-baseline xl:justify-end gap-1 mb-8">
                      <span className="text-sm text-blue-600 font-black italic">LKR</span>
                      <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                        {order.amount.toLocaleString()}
                      </span>
                   </div>
                   
                   <div className="flex flex-wrap gap-2 justify-start xl:justify-end">
                     {order.status !== OrderStatus.COMPLETED && (
                       <button 
                        onClick={() => handleUpdateStatus(order.id, OrderStatus.COMPLETED)}
                        className="h-12 w-12 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all hover:scale-110 active:scale-95"
                        title="Finalize Order"
                       >
                         <CheckCircle className="h-5 w-5" />
                       </button>
                     )}
                     {order.status === OrderStatus.PENDING && (
                       <button 
                        onClick={() => handleUpdateStatus(order.id, OrderStatus.CONFIRMED)}
                        className="h-12 w-12 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all hover:scale-110 active:scale-95"
                        title="Authorize Payment"
                       >
                         <Zap className="h-5 w-5" />
                       </button>
                     )}
                     {order.status !== OrderStatus.CANCELED && order.status !== OrderStatus.COMPLETED && (
                       <button 
                        onClick={() => handleUpdateStatus(order.id, OrderStatus.CANCELED)}
                        className="h-12 w-12 bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                        title="Revoke Order"
                       >
                         <XCircle className="h-5 w-5" />
                       </button>
                     )}
                      <a 
                      href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      className="h-12 w-12 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                      title="Secure Communication"
                     >
                       <MessageSquare className="h-5 w-5" />
                     </a>
                     <button 
                      onClick={() => setSelectedOrder(order)}
                      className="h-12 px-6 bg-gray-900 text-white hover:bg-black rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-105 active:scale-95 font-black text-[10px] uppercase tracking-widest"
                     >
                       <Eye className="h-5 w-5" />
                       <span>Analyze</span>
                     </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans text-gray-900"
          >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
             >
              <div className="bg-gray-900 px-8 py-6 flex justify-between items-center text-white">
                 <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Account Order</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">ID: {selectedOrder.id}</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <X className="h-6 w-6" />
                 </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                        <p className="font-bold truncate">{selectedOrder.customerName}</p>
                        <p className="text-sm text-gray-500 truncate">{selectedOrder.customerPhone}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account</p>
                        <p className="font-black text-blue-600 truncate">{selectedOrder.accountTitle}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                        <span className={`inline-flex px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          selectedOrder.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' : 
                          selectedOrder.status === OrderStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                          selectedOrder.status === OrderStatus.CONFIRMED ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {selectedOrder.status}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment</p>
                        <div className="flex items-center gap-2">
                          {selectedOrder.paymentMethod === PaymentMethod.BANK ? (
                            <Landmark className="h-3 w-3 text-blue-600" />
                          ) : selectedOrder.paymentMethod === PaymentMethod.EZ_CASH ? (
                            <Zap className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <MessageSquare className="h-3 w-3 text-blue-600" />
                          )}
                          <p className="font-black text-lg">LKR {selectedOrder.amount.toLocaleString()}</p>
                        </div>
                    </div>
                 </div>

                 {selectedOrder.paymentProofUrl && (
                   <div className="border-t border-gray-100 pt-6">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Payment Proof</p>
                      <img 
                        src={selectedOrder.paymentProofUrl} 
                        alt="Proof" 
                        loading="lazy"
                        className="w-full rounded-2xl border border-gray-200"
                        referrerPolicy="no-referrer"
                      />
                   </div>
                 )}

                 <div className="border-t border-gray-100 pt-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                        disabled={isUpdating || selectedOrder.status === OrderStatus.COMPLETED}
                        onClick={() => handleUpdateStatus(selectedOrder.id, OrderStatus.COMPLETED)}
                        className="flex items-center justify-center space-x-2 py-3 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50"
                       >
                         <CheckCircle className="h-4 w-4" />
                         <span>Complete</span>
                       </button>
                       <button 
                        disabled={isUpdating || selectedOrder.status === OrderStatus.CANCELED}
                        onClick={() => handleUpdateStatus(selectedOrder.id, OrderStatus.CANCELED)}
                        className="flex items-center justify-center space-x-2 py-3 bg-red-50 text-red-600 border border-red-100 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all disabled:opacity-50"
                       >
                         <XCircle className="h-4 w-4" />
                         <span>Cancel</span>
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
