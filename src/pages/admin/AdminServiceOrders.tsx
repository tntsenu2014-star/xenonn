import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Search, Filter, Eye, Landmark, MessageCircle, Loader2, X, CheckCircle2, Smartphone, Sparkles, ArrowRight, Clock, User, Phone, Trash2 } from 'lucide-react';
import { Order, OrderStatus, PaymentMethod } from '../../types';
import { updateOrderStatus, mapDocData } from '../../services/db';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from '../../lib/firestore-compat';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';

const AdminServiceOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    // We filter for orders where diamonds are 0 or packageId is not a standard topup package
    // Standard topup packages in this app usually start with 'pkg_' or have diamond counts
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => mapDocData(doc) as Order);
      // Heuristic for "Other Services": NO diamonds and name is not a standard topup
      const serviceOrders = allOrders.filter(o => 
        (o.diamonds === 0 || !o.diamonds) && 
        o.packageId !== 'custom' // Excluding generic custom if any
      );
      setOrders(serviceOrders);
      setLoading(false);
    }, (error) => {
      console.error("Error streaming service orders:", error);
      toast.error("Failed to load service signals");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(id, status);
      toast.success(`Protocol updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this signal?")) return;
    try {
      await deleteDoc(doc(db, 'orders', id));
      toast.success("Signal deleted permanently");
    } catch (error) {
      toast.error("Failed to delete signal");
    }
  };

  const filteredOrders = orders.filter(order => {
    const customerName = order.customerName || '';
    const id = order.id || '';
    const packageName = order.packageName || '';
    
    const matchesSearch = 
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      packageName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#050505]">
      <AdminSidebar activePage="service-orders" />
      
      <div className="flex-1 p-4 sm:p-8 lg:p-12">
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4 mb-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Service Console</h1>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1 italic">Managing Premium Digital Assets</p>
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-6 mt-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text"
                placeholder="Search Client ID or Service Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-white dark:bg-[#0d0d0f] rounded-[2rem] border border-gray-100 dark:border-white/5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-700 dark:text-white shadow-sm"
              />
            </div>
            <div className="flex gap-4">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-8 bg-white dark:bg-[#0d0d0f] rounded-[2rem] border border-gray-100 dark:border-white/5 font-black text-[10px] uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer shadow-sm"
              >
                <option value="ALL">All Status</option>
                <option value={OrderStatus.PENDING}>Pending</option>
                <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                <option value={OrderStatus.COMPLETED}>Completed</option>
                <option value={OrderStatus.CANCELED}>Canceled</option>
              </select>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-32">
            <Loader2 className="h-14 w-14 text-indigo-600 animate-spin mb-6" />
            <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px]">Decoding Signals...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOrders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white dark:bg-[#0d0d0f] rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-2xl p-8 relative overflow-hidden flex flex-col justify-between"
              >
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-indigo-600 opacity-[0.03] rounded-full blur-3xl group-hover:opacity-10 transition-opacity" />
                
                <div className="relative">
                  <div className="flex justify-between items-start mb-8">
                    <span className="text-[10px] font-black bg-indigo-600 text-white px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      order.status === OrderStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      order.status === OrderStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      order.status === OrderStatus.CONFIRMED ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter mb-4 leading-none uppercase italic group-hover:text-indigo-600 transition-colors">
                    {order.packageName}
                  </h3>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <User className="h-4.5 w-4.5 text-gray-400 group-hover:text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Asset Requester</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{order.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                        <Phone className="h-4.5 w-4.5 text-gray-400 group-hover:text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Contact Link</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{order.customerPhone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-50 dark:border-white/5 flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                      <div className="flex flex-col">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Method</p>
                        <span className="text-xs font-bold text-gray-900 dark:text-white capitalize">
                          {order.paymentMethod.replace('_', ' ')}
                        </span>
                      </div>
                      {order.paymentProofUrl && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                          <img src={order.paymentProofUrl} alt="Proof" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-400">
                    <span className="flex items-center">
                       <Clock className="w-3.5 h-3.5 mr-2" />
                       {format(order.createdAt, 'MMM d, HH:mm')}
                    </span>
                    <span className="text-indigo-600">LKR {order.amount.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 h-14 bg-gray-900 dark:bg-white dark:text-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-3 group/btn"
                    >
                      <Eye className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                      <span>Analyze Details</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteOrder(order.id)}
                      className="h-14 w-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <a 
                      href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 sm:p-12">
                 <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
                          <Sparkles className="h-8 w-8" />
                       </div>
                       <div>
                          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Service Inspection</h2>
                          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Signal ID: #{selectedOrder.id.toUpperCase()}</p>
                       </div>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-3 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-2xl transition-colors">
                       <X className="h-6 w-6" />
                    </button>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
                    <div className="space-y-8">
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Client Specification</p>
                          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                             <p className="font-bold text-gray-900 mb-1">{selectedOrder.customerName}</p>
                             <p className="text-indigo-600 font-black text-xs tracking-widest">{selectedOrder.customerPhone}</p>
                          </div>
                       </div>
                       
                       {selectedOrder.paymentProofUrl && (
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Verification Payload</p>
                            <a 
                              href={selectedOrder.paymentProofUrl} 
                              target="_blank" 
                              className="group relative block aspect-video rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-indigo-400 transition-colors"
                            >
                               <img src={selectedOrder.paymentProofUrl} alt="Payment proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="bg-white text-black px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">Enlarge Asset</span>
                               </div>
                            </a>
                         </div>
                       )}
                    </div>

                    <div className="space-y-8">
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Requirements Extraction</p>
                          <div className="bg-gray-900 rounded-[2rem] p-6 text-indigo-400 font-mono text-xs leading-relaxed border border-indigo-500/20">
                             {(() => {
                               try {
                                 const notes = JSON.parse(selectedOrder.adminNotes);
                                 return Object.entries(notes).map(([k, v]) => (
                                   <div key={k} className="mb-2 last:mb-0 flex justify-between">
                                      <span className="opacity-60">{k}:</span>
                                      <span className="text-white font-bold">{String(v)}</span>
                                   </div>
                                 ));
                               } catch (e) {
                                 return <p className="text-white">{selectedOrder.adminNotes}</p>;
                               }
                             })()}
                          </div>
                       </div>

                       <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100/50">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Settlement Status</p>
                          <div className="flex items-baseline gap-2">
                             <span className="text-sm font-black text-indigo-600 italic">LKR</span>
                             <span className="text-4xl font-black text-gray-900 tracking-tighter">{selectedOrder.amount.toLocaleString()}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                    <button 
                       onClick={() => { handleUpdateStatus(selectedOrder.id, OrderStatus.COMPLETED); setSelectedOrder(null); }}
                       className="flex-1 h-14 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                    >
                       <CheckCircle2 className="h-5 w-5" />
                       <span>Finalize Asset Delivery</span>
                    </button>
                    <button 
                       onClick={() => { handleDeleteOrder(selectedOrder.id); setSelectedOrder(null); }}
                       className="h-14 px-10 bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3"
                    >
                       <Trash2 className="h-5 w-5" />
                       <span>Destroy Signal</span>
                    </button>
                    {selectedOrder.status !== OrderStatus.CANCELED && (
                      <button 
                        onClick={() => { handleUpdateStatus(selectedOrder.id, OrderStatus.CANCELED); setSelectedOrder(null); }}
                        className="h-14 px-10 bg-gray-50 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3"
                      >
                        <X className="h-5 w-5" />
                        <span>Revoke</span>
                      </button>
                    )}
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminServiceOrders;
