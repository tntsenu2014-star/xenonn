import React, { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { collection, query, orderBy, limit, onSnapshot } from '../lib/firestore-compat';
import { db } from '../lib/firebase';
import { Order, AccountOrder } from '../types';
import { mapDocData } from '../services/db';

export default function AdminNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    // Listen for new orders to trigger browser notifications if permission granted
    if (permission !== 'granted') return;

    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const accOrdersQuery = query(
      collection(db, 'accountOrders'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    let lastOrderTime = Date.now();

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const order = mapDocData<Order>(change.doc);
          if (order.createdAt > lastOrderTime) {
            new Notification('New Order Received!', {
              body: `${order.customerName} ordered ${order.packageName}`,
              icon: '/favicon.ico'
            });
            lastOrderTime = order.createdAt;
          }
        }
      });
    });

    const unsubscribeAccOrders = onSnapshot(accOrdersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const order = mapDocData<AccountOrder>(change.doc);
          if (order.createdAt > lastOrderTime) {
            new Notification('New Account Purchase!', {
              body: `${order.customerName} bought ${order.accountTitle}`,
              icon: '/favicon.ico'
            });
            lastOrderTime = order.createdAt;
          }
        }
      });
    });

    return () => {
      unsubscribeOrders();
      unsubscribeAccOrders();
    };
  }, [permission]);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') {
      toast.error('Browser does not support notifications');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        toast.success('Notifications enabled!');
        new Notification('Notifications Active', {
          body: 'You will now receive alerts for new orders.',
          icon: '/favicon.ico'
        });
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0d0d0f] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl shadow-blue-500/[0.02] flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          permission === 'granted' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400'
        }`}>
          {permission === 'granted' ? <BellRing className="h-6 w-6" /> : <BellOff className="h-6 w-6" />}
        </div>
        <div>
          <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Browser Notifications</h4>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">
            {permission === 'granted' ? 'Active alerts enabled' : 'Get alerts for new signals'}
          </p>
        </div>
      </div>

      {permission !== 'granted' ? (
        <button
          onClick={requestPermission}
          className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
        >
          Enable Alerts
        </button>
      ) : (
        <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">
          Operational
        </div>
      )}
    </div>
  );
}
