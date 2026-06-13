import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Package as PackageIcon, 
  ShoppingCart, 
  Settings, 
  LogOut,
  LayoutDashboard,
  Image as ImageIcon,
  LayoutTemplate,
  Sparkles,
  Calendar,
  User as UserIcon,
  Menu,
  X,
  ShieldCheck,
  Bell,
  BellRing,
  ShoppingBag
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { useEffect, useState, useRef } from 'react';
import { User, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, limit, Timestamp } from '../lib/firestore-compat';
import { motion, AnimatePresence } from 'motion/react';
import { OrderStatus } from '../types';

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newProofNotification, setNewProofNotification] = useState<{ id: string; customer: string } | null>(null);
  const notifiedOrders = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  // Auto-dismiss notification
  useEffect(() => {
    if (newProofNotification) {
      const timer = setTimeout(() => {
        setNewProofNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newProofNotification]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Listen for new payment proofs
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('status', '==', OrderStatus.PENDING),
      limit(50)
    );

    const playNotificationSound = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const playSound = () => {
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);

          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.3);
        };

        if (audioCtx.state === 'suspended') {
          audioCtx.resume().then(playSound);
        } else {
          playSound();
        }
      } catch (err) {
        console.error('Audio error:', err);
      }
    };

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // On initial load, only mark as notified if they already have a proof URL
      if (!initialLoadDone.current) {
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.paymentProofUrl) {
            notifiedOrders.current.add(doc.id);
          }
        });
        initialLoadDone.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        // Trigger notification if proof URL is present and we haven't notified for this order yet
        if (
          (change.type === 'added' || change.type === 'modified') && 
          data.paymentProofUrl && 
          !notifiedOrders.current.has(change.doc.id)
        ) {
          notifiedOrders.current.add(change.doc.id);
          setNewProofNotification({
            id: change.doc.id,
            customer: data.customerName || 'Customer'
          });
          
          playNotificationSound();
          
          // Browser Notification
          if (Notification.permission === 'granted') {
            new Notification('New Payment Proof!', {
              body: `${data.customerName || 'A customer'} just submitted a payment proof.`,
              icon: 'https://i.postimg.cc/52SjYFLk/lo.png'
            });
          }
        }
      });
    }, (error) => {
      console.error("Firestore Listen error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Packages', path: '/admin/packages', icon: PackageIcon },
    { name: 'Banners', path: '/admin/banners', icon: ImageIcon },
    { name: 'Services', path: '/admin/services', icon: Sparkles },
    { name: 'Banner Designs', path: '/admin/templates', icon: LayoutTemplate },
    { name: 'Events', path: '/admin/events', icon: Calendar },
    { name: 'FF Accounts', path: '/admin/accounts', icon: UserIcon },
    { name: 'Account Orders', path: '/admin/account-orders', icon: ShoppingBag },
    { name: 'Service Orders', path: '/admin/service-orders', icon: Sparkles },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="p-6 h-full flex flex-col bg-white">
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-8 md:mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Admin Menu</h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const playSound = () => {
                  const oscillator = audioCtx.createOscillator();
                  const gainNode = audioCtx.createGain();
                  oscillator.type = 'sine';
                  oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
                  gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
                  oscillator.connect(gainNode);
                  gainNode.connect(audioCtx.destination);
                  oscillator.start();
                  oscillator.stop(audioCtx.currentTime + 0.1);
                };
                if (audioCtx.state === 'suspended') {
                  audioCtx.resume().then(playSound);
                } else {
                  playSound();
                }
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
              title="Test Notification Sound"
            >
              <BellRing className="h-4 w-4" />
            </button>
            {Notification.permission === 'default' && (
              <button 
                onClick={requestNotificationPermission}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Enable browser notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
            )}
            <button className="md:hidden p-2 text-gray-400 hover:text-gray-900" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-4 pt-12">
        {user && (
          <div className="px-4 py-3 bg-gray-50 rounded-2xl flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Admin" className="w-6 h-6 rounded-lg" />
              ) : (
                <UserIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-gray-900 truncate">
                {user.displayName || 'Administrator'}
              </span>
              <span className="text-[10px] text-gray-400 font-bold truncate">
                {user.email}
              </span>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all border-t border-gray-100 mt-4 pt-4"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {newProofNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
          >
            <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl">
                  <BellRing className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-blue-500">New Payment Proof</p>
                  <p className="text-xs font-bold text-gray-300">{newProofNotification.customer} just submitted a receipt</p>
                </div>
              </div>
              <button 
                onClick={() => setNewProofNotification(null)}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Nav Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg">
             <img src="https://i.postimg.cc/52SjYFLk/lo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="font-black text-gray-900 tracking-tight">Admin Panel</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-64 shadow-2xl"
            >
              <SidebarContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] hidden md:block">
        <SidebarContent />
      </div>
    </>
  );
}
