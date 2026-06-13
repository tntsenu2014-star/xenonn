import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Search, Filter, Eye, Landmark, MessageCircle, Loader2, X, CheckCircle2, Ban, Smartphone, Bell, BellOff, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { Order, OrderStatus, PaymentMethod } from '../../types';
import { updateOrderStatus, mapDocData, updateOrderAmount } from '../../services/db';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, orderBy } from '../../lib/firestore-compat';
import { db } from '../../lib/firebase';
import { Toaster, toast } from 'sonner';

export default function AdminOrders() {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('admin_notifications_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [lastNotificationTime, setLastNotificationTime] = useState(Date.now());

  // Handle persistence and permission sync
  useEffect(() => {
    localStorage.setItem('admin_notifications_enabled', String(notificationsEnabled));
    
    // Auto-request if enabled but not yet granted
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission !== 'granted') setNotificationsEnabled(false);
      });
    } else if (notificationsEnabled && 'Notification' in window && Notification.permission === 'denied') {
      setNotificationsEnabled(false);
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    setLoading(true);
    const ordersCol = collection(db, 'orders');
    let q = query(ordersCol);
    
    if (filter !== 'all') {
      q = query(ordersCol, where('status', '==', filter));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => mapDocData<Order>(doc));
      
      // Keep all orders, including service orders with 0 diamonds
      data = data.filter(order => order.diamonds !== undefined);

      data.sort((a, b) => b.createdAt - a.createdAt);
      
      // Check for new orders to notify
      if (notificationsEnabled) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const newOrder = mapDocData<Order>(change.doc);
            // Only notify for orders newer than component mount or last manually processed
            if (newOrder.createdAt > lastNotificationTime) {
              playNotificationSound();
              showBrowserNotification(newOrder);
              toast.info("New Order Received! 💎", {
                description: `Order #${newOrder.id.slice(-6).toUpperCase()} - LKR ${newOrder.amount.toLocaleString()}`,
                action: {
                  label: "View",
                  onClick: () => setSelectedOrder(newOrder)
                }
              });
            }
          }
        });
      }

      setOrders(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("Failed to stream orders. Permission denied.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter, notificationsEnabled, lastNotificationTime]);

  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => {
      console.log('Audio playback blocked');
      // Toast to let admin know sound is blocked until they interact
      toast.info("Audio Alert Waiting", {
        description: "Please interact with the page to enable sound alerts for new orders.",
        duration: 3000
      });
    });
  };

  const showBrowserNotification = (order: Order) => {
    const title = 'New Order Received! 💎';
    const options = {
      body: `Order #${order.id.slice(-6).toUpperCase()} - LKR ${order.amount.toLocaleString()}\nBy ${order.customerName}`,
      icon: 'https://i.postimg.cc/52SjYFLk/lo.png',
      badge: 'https://i.postimg.cc/52SjYFLk/lo.png',
      vibrate: [200, 100, 200]
    };

    if (Notification.permission === 'granted') {
      // Use service worker notification if available (better for mobile)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, options);
        });
      } else {
        new Notification(title, options);
      }
    }
  };

  const requestNotificationPermission = () => {
    if (!('Notification' in window)) {
      toast.error('Browser Error', { description: 'This browser does not support desktop notifications.' });
      return;
    }

    if (Notification.permission === 'denied') {
      toast.error('Notifications Blocked', { 
        description: 'Please reset notification permissions in your browser settings to receive alerts.' 
      });
      return;
    }

    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        setLastNotificationTime(Date.now());
        toast.success('Alerts Enabled!', { description: 'You will now receive notifications for new orders.' });
        
        // Immediate test using SW if possible
        const title = 'GAMING R4D Admin';
        const options = {
          body: 'Notifications are now successfully enabled!',
          icon: 'https://i.postimg.cc/52SjYFLk/lo.png'
        };

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => reg.showNotification(title, options));
        } else {
          new Notification(title, options);
        }
      } else {
        setNotificationsEnabled(false);
        toast.warning('Alerts Not Enabled', { description: 'Permission was not granted.' });
      }
    });
  };

  const filteredOrders = orders.filter(o => 
    (o.id && o.id.toLowerCase().includes(search.toLowerCase())) ||
    (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase())) ||
    (o.userId && o.userId.toLowerCase().includes(search.toLowerCase())) ||
    (o.packageName && o.packageName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      await updateOrderStatus(id, newStatus);
      toast.success(`Order ${newStatus} Successfully`);
      if (selectedOrder) setSelectedOrder({ ...selectedOrder, status: newStatus });
      // onSnapshot handles the refresh automatically
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
      <AdminSidebar />
      <div className="flex-grow p-4 md:p-8 overflow-x-hidden">
        <header className="mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Manage Orders</h1>
            <p className="text-sm text-gray-500 font-medium font-sans">Verify payments and process top-ups.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
             <div className="flex gap-2">
               <button
                onClick={() => {
                  if (notificationsEnabled) {
                    setNotificationsEnabled(false);
                    toast.info("Alerts Disabled", { description: "You will no longer receive order notifications." });
                  } else {
                    requestNotificationPermission();
                  }
                }}
                className={`h-11 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-all ${
                  notificationsEnabled 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
               >
                 {notificationsEnabled ? (
                   <>
                     <Bell className="h-4 w-4" />
                     <span className="hidden sm:inline">Alerts On</span>
                   </>
                 ) : (
                   <>
                     <BellOff className="h-4 w-4" />
                     <span className="hidden sm:inline">Enable Alerts</span>
                   </>
                 )}
               </button>

               {notificationsEnabled && (
                 <button
                   onClick={() => {
                     playNotificationSound();
                     new Notification('Admin Test Notification', {
                       body: 'If you see this, notifications are correctly configured! 💎',
                       icon: 'https://i.postimg.cc/52SjYFLk/lo.png'
                     });
                     toast.success("Test Alert Sent");
                   }}
                   className="h-11 w-11 flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all shrink-0"
                   title="Send Test Notification"
                 >
                   <Bell className="h-4 w-4 animate-bounce" />
                 </button>
               )}
             </div>
             <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search orders..."
                  className="pl-10 pr-4 h-11 w-full xl:w-64 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm font-sans"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <div className="relative min-w-[140px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select 
                  className="pl-10 pr-4 h-11 w-full rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 bg-white outline-none text-sm font-bold text-gray-600 appearance-none shadow-sm cursor-pointer font-sans"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                </select>
             </div>
          </div>
        </header>


        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center text-red-600 font-sans">
             <Ban className="h-5 w-5 mr-3" />
             <div>
               <p className="font-bold text-sm">Error Accessing Data</p>
               <p className="text-xs opacity-80">{error}</p>
             </div>
             <button 
              onClick={() => window.location.reload()}
              className="ml-auto px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors"
             >
               Retry
             </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 md:p-20">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading orders...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl shadow-blue-500/5 overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/50 dark:bg-white/5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-10 py-6">Order Info</th>
                      <th className="px-10 py-6">Customer Elite</th>
                      <th className="px-10 py-6">Item Selection</th>
                      <th className="px-10 py-6 text-center">Protocol</th>
                      <th className="px-10 py-6 text-center">Status</th>
                      <th className="px-10 py-6 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all duration-300">
                        <td className="px-10 py-6">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-3 mb-1">
                               <span className="font-black text-gray-900 dark:text-white text-sm tracking-tighter">#{order.id.slice(-6).toUpperCase()}</span>
                               {order.paymentProofUrl && (
                                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                               )}
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              {format(order.createdAt, 'MMM d, HH:mm')}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20">
                              {order.customerName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{order.customerName}</span>
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest opacity-80">UID: {order.userId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{order.packageName}</span>
                            <span className="text-base font-black text-blue-600 dark:text-blue-500 tracking-tighter">LKR {order.amount.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex justify-center">
                            {order.paymentMethod === PaymentMethod.BANK ? (
                              <div className="flex items-center text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-500/20">
                                <Landmark className="h-3.5 w-3.5 mr-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Bank Transfer</span>
                              </div>
                            ) : order.paymentMethod === PaymentMethod.EZ_CASH ? (
                              <div className="flex items-center text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                                <Smartphone className="h-3.5 w-3.5 mr-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest">eZ Cash</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                                <MessageCircle className="h-3.5 w-3.5 mr-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex justify-center">
                            <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border ${
                              order.status === OrderStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                              order.status === OrderStatus.PENDING ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                              order.status === OrderStatus.CONFIRMED ? 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' :
                              'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gray-900 dark:bg-white dark:text-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-gray-900/10 group/btn"
                          >
                            <Eye className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOrders.map((order) => (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white dark:bg-[#0d0d0f] rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl p-6 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 opacity-[0.03] transition-transform duration-700 group-hover:scale-110 ${
                    order.status === OrderStatus.COMPLETED ? 'bg-emerald-600' : 
                    order.status === OrderStatus.PENDING ? 'bg-blue-600' :
                    'bg-red-600'
                  } rounded-full`}></div>

                  <div className="flex justify-between items-start mb-6 gap-2">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-xl shadow-blue-500/20 shrink-0">
                        {order.customerName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 dark:text-white text-base tracking-tight truncate">#{order.id.slice(-6).toUpperCase()}</span>
                          {order.paymentProofUrl && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">
                          {format(order.createdAt, 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ${
                      order.status === OrderStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      order.status === OrderStatus.PENDING ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">Customer Data</span>
                       <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{order.customerName}</span>
                          <span className="text-[10px] text-blue-600 font-black tracking-widest truncate max-w-[150px] sm:max-w-none">UID: {order.userId}</span>
                       </div>
                    </div>
                    
                    <div className="flex flex-col pt-4 border-t border-gray-50 dark:border-white/5">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 opacity-60">Package Selection</span>
                       <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 break-words">{order.packageName}</p>
                          <p className="text-lg font-black text-gray-900 dark:text-white">LKR {order.amount.toLocaleString()}</p>
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {order.paymentMethod === PaymentMethod.BANK ? (
                      <div className="flex items-center text-blue-600">
                        <Landmark className="h-4 w-4 mr-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Bank</span>
                      </div>
                    ) : order.paymentMethod === PaymentMethod.EZ_CASH ? (
                      <div className="flex items-center text-indigo-600">
                        <Smartphone className="h-4 w-4 mr-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">eZ Cash</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-emerald-600">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">WA</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-blue-600 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                      <span>View Details</span>
                      <ArrowRight className="h-3 w-3 ml-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </>
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
              <div className="bg-gray-900 px-5 sm:px-8 py-5 sm:py-6 flex justify-between items-center text-white gap-4">
                 <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-black">Order Details</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest break-all">ID: {selectedOrder.id}</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0">
                    <X className="h-6 w-6" />
                 </button>
              </div>

              <div className="p-5 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                        <p className="font-bold truncate">{selectedOrder.customerName}</p>
                        <p className="text-sm text-gray-500 truncate">{selectedOrder.customerPhone}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">FreeFire ID</p>
                        <p className="font-black text-blue-600 truncate">{selectedOrder.userId}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Package</p>
                        <p className="font-bold break-words pr-2">{selectedOrder.packageName}</p>
                        <p className="text-sm text-gray-500">{selectedOrder.diamonds} Diamonds</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment</p>
                        <p className="font-bold capitalize truncate">{selectedOrder.paymentMethod.replace('_', ' ')}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-black text-lg text-gray-900 group-hover:text-blue-600 transition-colors">LKR {selectedOrder.amount.toLocaleString()}</span>
                          <button 
                            onClick={async () => {
                              const newAmount = prompt("Enter new amount (LKR):", selectedOrder.amount.toString());
                              if (newAmount && !isNaN(Number(newAmount))) {
                                try {
                                  await updateOrderAmount(selectedOrder.id, Number(newAmount));
                                  setSelectedOrder({ ...selectedOrder, amount: Number(newAmount) });
                                  toast.success("Amount updated successfully");
                                } catch (e) {
                                  toast.error("Failed to update amount");
                                }
                              }
                            }}
                            className="p-1.5 bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 rounded-lg transition-all"
                            title="Update Amount"
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                          </button>
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
                        decoding="async"
                        className="w-full rounded-2xl border border-gray-200"
                        referrerPolicy="no-referrer"
                      />
                   </div>
                 )}

                 {selectedOrder.adminNotes && (
                   <div className="border-t border-gray-100 pt-6">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Service Requirements</p>
                      {(() => {
                        try {
                          const notes = JSON.parse(selectedOrder.adminNotes);
                          return (
                            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                              <table className="w-full text-left text-xs">
                                <tbody className="divide-y divide-gray-200">
                                  {Object.entries(notes).map(([key, value]) => (
                                    <tr key={key}>
                                      <td className="px-4 py-2 font-black text-gray-500 uppercase tracking-tighter w-1/3 bg-gray-100/50">{key.replace(/_/g, ' ')}</td>
                                      <td className="px-4 py-2 font-bold text-gray-900">{String(value)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        } catch (e) {
                          return (
                            <pre className="bg-gray-50 p-4 rounded-2xl text-xs text-gray-700 overflow-x-auto border border-gray-200">
                              {selectedOrder.adminNotes}
                            </pre>
                          );
                        }
                      })()}
                   </div>
                 )}

                 <div className="border-t border-gray-100 pt-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Update Status</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <button 
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(selectedOrder.id, OrderStatus.COMPLETED)}
                        className="flex items-center justify-center space-x-2 py-3 bg-green-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all disabled:opacity-50 w-full"
                       >
                         <CheckCircle2 className="h-4 w-4 shrink-0" />
                         <span>Complete</span>
                       </button>
                       <button 
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(selectedOrder.id, OrderStatus.CANCELED)}
                        className="flex items-center justify-center space-x-2 py-3 bg-red-50 text-red-600 border border-red-100 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all disabled:opacity-50 w-full"
                       >
                         <Ban className="h-4 w-4 shrink-0" />
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
