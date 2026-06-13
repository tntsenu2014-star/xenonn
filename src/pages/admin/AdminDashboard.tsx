import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, CheckCircle2, TrendingUp, Loader2, Sparkles, ArrowRight, MessageCircle } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import AdminNotificationManager from '../../components/AdminNotificationManager';
import { motion } from 'motion/react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query } from '../../lib/firestore-compat';
import { Order, OrderStatus, AccountOrder } from '../../types';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useIsAdmin } from '../../lib/useIsAdmin';
import { mapDocData } from '../../services/db';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [accountOrders, setAccountOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      
      const ordersQuery = query(collection(db, 'orders'));
      const accOrdersQuery = query(collection(db, 'accountOrders'));

      const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => mapDocData<Order>(doc));
        setOrders(data);
        setLoading(false);
      }, (err) => {
        console.error("Orders dash error:", err);
        toast.error("Failed to stream orders: " + err.message);
        setLoading(false);
      });

      const unsubscribeAccOrders = onSnapshot(accOrdersQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => mapDocData<AccountOrder>(doc));
        setAccountOrders(data);
        setLoading(false);
      }, (err) => {
        console.error("Acc orders dash error:", err);
        toast.error("Failed to stream account orders: " + err.message);
        setLoading(false);
      });

      return () => {
        unsubscribeOrders();
        unsubscribeAccOrders();
      };
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const totalOrders = orders.length + accountOrders.length;
  
  // Separate Service orders (marked by amount 0 or diamond 0 depending on logic, 
  // but let's check packageName for service names or use a heuristic)
  const serviceOrdersList = orders.filter(o => o.diamonds === 0 && !(o.packageId && typeof o.packageId === 'string' && o.packageId.includes('pkg_')));
  const packageOrdersList = orders.filter(o => o.diamonds > 0 || (o.packageId && typeof o.packageId === 'string' && o.packageId.includes('pkg_')));

  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length + 
                        accountOrders.filter(o => o.status === OrderStatus.PENDING).length;
  const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED).length +
                          accountOrders.filter(o => o.status === OrderStatus.COMPLETED).length;
  const totalRevenue = orders
    .filter(o => o.status === OrderStatus.COMPLETED)
    .reduce((sum, o) => sum + o.amount, 0) +
    accountOrders
    .filter(o => o.status === OrderStatus.COMPLETED)
    .reduce((sum, o) => sum + o.amount, 0);

  const stats = [
    { name: 'Total Orders', value: totalOrders.toLocaleString(), icon: ShoppingCart, color: 'bg-blue-500' },
    { name: 'Pending Orders', value: pendingOrders.toLocaleString(), icon: Package, color: 'bg-amber-500' },
    { name: 'Service Requests', value: serviceOrdersList.length.toLocaleString(), icon: Sparkles, color: 'bg-indigo-600' },
    { name: 'Total Revenue', value: `LKR ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-500' },
  ];

  const recentOrders = [...packageOrdersList, ...accountOrders.map(ao => ({
    ...ao,
    packageName: ao.accountTitle,
    packageId: ao.accountId,
    userId: 'Account Customer'
  } as any))].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

  const recentServiceOrders = serviceOrdersList.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen">
        <AdminSidebar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row">
      <AdminSidebar />
      <div className="flex-grow p-4 md:p-8 overflow-x-hidden">
        <header className="mb-8 font-sans">
          <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-500 font-medium">Overview of your diamond store performance.</p>
        </header>

        <AdminNotificationManager />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 font-sans">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-[#0d0d0f] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl shadow-blue-500/[0.02] hover:shadow-blue-500/10 transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-gray-50 dark:bg-white/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors duration-500"></div>
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl ${stat.color} text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500`}>
                  <stat.icon className="h-7 w-7" />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.name}</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Orders Section */}
        <section className="bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl shadow-blue-500/[0.02] overflow-hidden font-sans">
          <div className="px-10 py-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/30 dark:bg-white/[0.02]">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">Recent Transactions</h3>
            <Link to="/admin/orders" className="h-10 px-6 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
              Launch Console
            </Link>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 dark:bg-white/5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-white/5">
                <tr>
                  <th className="px-10 py-6">ID Signal</th>
                  <th className="px-10 py-6">Client Data</th>
                  <th className="px-10 py-6">Asset Type</th>
                  <th className="px-10 py-6">Operational Status</th>
                  <th className="px-10 py-6">Timestamp</th>
                  <th className="px-10 py-6 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all duration-300 whitespace-nowrap group">
                    <td className="px-10 py-6 font-black text-gray-400 group-hover:text-blue-600 transition-colors text-xs font-mono tracking-tighter">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{order.customerName}</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mt-1">
                          {order.userId === 'Account Customer' ? 'Premium Account' : `UID: ${order.userId}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                       <span className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">
                          {order.packageName}
                       </span>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border ${
                        order.status === OrderStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10' : 
                        order.status === OrderStatus.PENDING ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10' :
                        order.status === OrderStatus.CONFIRMED ? 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10' :
                        'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {format(order.createdAt, 'MMM d, HH:mm')}
                    </td>
                    <td className="px-10 py-6 text-right font-black text-gray-900 dark:text-white tracking-tighter text-base">
                       <span className="text-[10px] text-blue-600 mr-1 italic">LKR</span>
                       {order.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-10 py-24 text-center">
                       <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                             <Package className="h-8 w-8 text-gray-300" />
                          </div>
                          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">No recent data signals</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Other Service Orders Section */}
        <section className="mt-12 bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl shadow-indigo-500/[0.02] overflow-hidden font-sans">
          <div className="px-10 py-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-indigo-50/30 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-indigo-600" />
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">Premium Service Signals</h3>
            </div>
            <Link to="/admin/service-orders" className="h-10 px-6 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all">
              Inspect All
            </Link>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-indigo-50/50 dark:bg-white/5 text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest border-b border-indigo-100 dark:border-white/5">
                <tr>
                  <th className="px-10 py-6">ID</th>
                  <th className="px-10 py-6">Service Requested</th>
                  <th className="px-10 py-6">Client Identity</th>
                  <th className="px-10 py-6">Payment</th>
                  <th className="px-10 py-6">Status</th>
                  <th className="px-10 py-6 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50 dark:divide-white/5">
                {recentServiceOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all duration-300 group">
                    <td className="px-10 py-6 font-black text-gray-400 group-hover:text-indigo-600 transition-colors text-xs font-mono tracking-tighter">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{order.packageName}</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mt-1">Custom Requirement</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{order.customerName}</span>
                        <span className="text-[10px] text-indigo-600 font-black tracking-widest italic">{order.customerPhone}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-full whitespace-nowrap">
                        {order.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border ${
                        order.status === OrderStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        order.status === OrderStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right font-black text-gray-900 dark:text-white tracking-tighter text-base">
                       <span className="text-[10px] text-indigo-600 mr-1 italic">LKR</span>
                       {order.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {recentServiceOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-10 py-24 text-center">
                       <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-indigo-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                             <Sparkles className="h-8 w-8 text-indigo-300" />
                          </div>
                          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">No active service signals</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
