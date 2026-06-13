import { Link } from 'react-router-dom';
import { ShoppingCart, ShieldCheck, Menu, X, User as UserIcon, LogIn, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useIsAdmin } from '../lib/useIsAdmin';
import { useUser } from '../lib/UserContext';
import { useTheme } from '../lib/ThemeContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAdmin } = useIsAdmin();
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#070708]/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex justify-between h-16 md:h-20 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 md:space-x-3 group">
              <div className="primary-gradient p-2 md:p-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110">
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <span className="text-lg md:text-xl lg:text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                GAMING <span className="text-blue-600 dark:text-blue-500">R4D</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-3 lg:space-x-6">
            <Link to="/" className="text-xs lg:text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors whitespace-nowrap">Store</Link>
            <Link to="/accounts" className="text-xs lg:text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors tracking-tighter whitespace-nowrap">Buy FF Accounts</Link>
            <Link to="/payment-details" className="text-xs lg:text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors whitespace-nowrap">Payment</Link>
            <Link to="/history" className="text-xs lg:text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors whitespace-nowrap">Orders</Link>
            
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-600 dark:text-gray-400"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Moon className="h-4 w-4 text-blue-500" /> : <Sun className="h-4 w-4 text-yellow-500" />}
            </button>

            {user ? (
              <Link to="/profile" className="flex items-center space-x-2 lg:space-x-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-3 lg:px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all group">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-5 h-5 lg:w-6 lg:h-6 rounded-full ring-2 ring-blue-500/10" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-blue-600 dark:text-blue-400" />
                )}
                <span className="text-[11px] lg:text-xs font-bold text-gray-700 dark:text-gray-300">
                  {user.displayName?.split(' ')[0] || 'Profile'}
                </span>
              </Link>
            ) : (
              <Link to="/profile" className="flex items-center space-x-1.5 lg:space-x-2 text-[13px] lg:text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Link>
            )}

            {isAdmin && (
              <Link to="/admin" className="flex items-center space-x-1.5 lg:space-x-2 text-[11px] lg:text-xs font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border-l border-gray-100 dark:border-white/10 pl-4 lg:pl-8">
                <ShieldCheck className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-emerald-500" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-4 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              {theme === 'dark' ? <Moon className="h-5 w-5 text-blue-500" /> : <Sun className="h-5 w-5 text-yellow-500" />}
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-4 bg-white dark:bg-[#0d0d0f] border border-gray-100 dark:border-white/5 rounded-[2rem] p-6 shadow-2xl"
          >
            {user && (
              <div className="flex items-center space-x-4 p-4 border-b border-gray-100 dark:border-white/5 mb-4">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-12 h-12 rounded-full ring-4 ring-blue-50 dark:ring-blue-500/10" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded-xl primary-gradient flex items-center justify-center text-white font-bold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{user.displayName || 'Gamer'}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            )}
            
            <div className="grid gap-1">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="w-full py-3 px-4 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-colors">Store</Link>
              <Link to="/accounts" onClick={() => setIsMenuOpen(false)} className="w-full py-3 px-4 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-colors">Buy FF Accounts</Link>
              <Link to="/payment-details" onClick={() => setIsMenuOpen(false)} className="w-full py-3 px-4 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-colors">Payment Details</Link>
              <Link to="/history" onClick={() => setIsMenuOpen(false)} className="w-full py-3 px-4 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-colors">My Orders</Link>
              <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="w-full py-3 px-4 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white transition-colors">
                {user ? 'Profile Settings' : 'Login / Register'}
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="w-full py-3 px-4 rounded-xl text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 mt-2">
                  Admin Panel
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
