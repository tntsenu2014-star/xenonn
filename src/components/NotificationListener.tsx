import React, { useEffect, useRef, useState } from 'react';
import { listenNotifications } from '../services/db';
import { AppNotification } from '../types';
import { toast } from 'sonner';
import { Bell, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const ADMIN_EMAILS = ['gamingremo2010@gmail.com', 'gamingremo201@gmail.com', 'surangisenanayaka700@gmail.com', 'bloovalk@gmail.com'];

const NotificationListener: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const lastNotificationId = useRef<string | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user?.email && ADMIN_EMAILS.includes(user.email));
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Listen for 'all' notifications
    const unsubscribeAll = listenNotifications((notifications) => {
      handleNotifications(notifications);
    }, 'all');

    // If admin, also listen for 'admin' notifications
    let unsubscribeAdmin: (() => void) | undefined;
    if (isAdmin) {
      unsubscribeAdmin = listenNotifications((notifications) => {
        handleNotifications(notifications);
      }, 'admin');
    }

    return () => {
      unsubscribeAll();
      if (unsubscribeAdmin) unsubscribeAdmin();
    };
  }, [isAdmin]);

  const handleNotifications = (notifications: AppNotification[]) => {
    if (notifications.length === 0) return;
    
    // On first load, just set the last ID and don't show toasts
    if (isFirstLoad.current) {
      lastNotificationId.current = notifications[0].id;
      isFirstLoad.current = false;
      return;
    }

    // Find new notifications since last check
    const newId = notifications[0].id;
    if (newId !== lastNotificationId.current) {
      const newNotifications = notifications.filter(n => n.id !== lastNotificationId.current);
      if (newNotifications.length > 0) {
        newNotifications.reverse().forEach(n => {
          showNotificationToast(n);
        });
      }
      lastNotificationId.current = newId;
    }
  };

  const showNotificationToast = (notification: AppNotification) => {
    const Icon = getIcon(notification.type);
    
    toast.custom((id) => (
      <div 
        className="max-w-md w-full bg-white dark:bg-[#121214] shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-gray-100 dark:border-white/10 overflow-hidden"
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getIconBg(notification.type)}`}>
                <Icon className={`h-5 w-5 ${getIconColor(notification.type)}`} />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight italic">
                {notification.title}
              </p>
              <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-white/5">
          <button
            onClick={() => toast.dismiss(id)}
            className="px-4 flex items-center justify-center text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return XCircle;
      default: return Info;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-100 dark:bg-emerald-500/20';
      case 'warning': return 'bg-amber-100 dark:bg-amber-500/20';
      case 'error': return 'bg-red-100 dark:bg-red-500/20';
      default: return 'bg-blue-100 dark:bg-blue-500/20';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-emerald-600 dark:text-emerald-400';
      case 'warning': return 'text-amber-600 dark:text-amber-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  return null;
};

export default NotificationListener;
