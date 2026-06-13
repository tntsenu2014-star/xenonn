import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, Moon, Sun, Save, Phone, Fingerprint, ShieldCheck, Loader2, LogOut, Mail, CheckCircle2, Camera } from 'lucide-react';
import { useUser } from '../lib/UserContext';
import { useTheme } from '../lib/ThemeContext';
import { auth, storage } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, profile, updateProfile, loading: authLoading } = useUser();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [playerId, setPlayerId] = useState(profile.playerId);
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsappNumber);
  const [customerName, setCustomerName] = useState(profile.customerName);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    setPlayerId(profile.playerId);
    setWhatsappNumber(profile.whatsappNumber);
    setCustomerName(profile.customerName);
  }, [profile]);

  useEffect(() => {
    if (user && !authLoading) {
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        navigate(redirect, { replace: true });
      }
    }
  }, [user, authLoading, location, navigate]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", { description: "Image size must be less than 2MB." });
      return;
    }

    setIsUploadingImage(true);
    try {
      const storageRef = ref(storage, `avatars/${user?.uid || 'guest'}_${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      await updateProfile({ photoURL: downloadURL });
      toast.success("Profile photo updated!");
    } catch (err: any) {
      console.error("Failed to upload image:", err);
      toast.error("Upload failed", { description: err.message });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({ playerId, whatsappNumber, customerName });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Failed to update profile. Please try again.";
      try {
        if (err.message.startsWith('{')) {
          const parsed = JSON.parse(err.message);
          errorMessage = parsed.error || errorMessage;
        }
      } catch {
        // use default
      }
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Login successful!");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        toast.error("Auth Error", { 
          description: "This domain is not authorized in your Firebase Project. Please add it to 'Authorized Domains' in your Firebase Console (Authentication > Settings).",
          duration: 10000 
        });
      } else {
        toast.error("Login failed", { description: err.message || "Unknown error" });
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 lg:px-8 font-sans bg-slate-50 dark:bg-[#070708] transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-10">
        
        <div className="text-center pt-24">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-4">My Account</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Manage your profile and settings</p>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          {/* Account Section */}
          <div className="bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5 shadow-xl shadow-blue-500/5 relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
            
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-500/20">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Login details</h2>
            </div>

            {user ? (
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 p-6 sm:p-8 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 w-full relative z-10 transition-colors">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                  accept="image/*" 
                />
                <div 
                  className="relative shrink-0 cursor-pointer group/avatar"
                  onClick={handleImageClick}
                >
                  {profile.photoURL || user.photoURL ? (
                    <img 
                      src={profile.photoURL || user.photoURL || ''} 
                      alt="Profile" 
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl border-4 border-white dark:border-gray-800 shadow-xl object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-blue-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-xl">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </div>
                  )}
                  
                  {/* Camera Overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-2xl sm:rounded-3xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>

                  {/* Loading Overlay */}
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl sm:rounded-3xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}

                  <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-emerald-500 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-4 border-white dark:border-gray-800 shadow-lg" />
                </div>
                
                <div className="flex-grow text-center sm:text-left min-w-0 w-full overflow-hidden">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight truncate mb-1">{user.displayName || 'Customer'}</h3>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 dark:text-gray-400 mt-1">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-bold text-xs sm:text-sm truncate tracking-wide">{user.email}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 hover:border-red-100 transition-all shrink-0 shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </motion.button>
              </div>
            ) : (
              <div className="text-center py-12 px-8 rounded-3xl bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 relative z-10 transition-colors">
                <p className="text-gray-500 font-bold mb-8 uppercase tracking-widest text-[10px]">Sign in to keep your data synced across devices.</p>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleLogin}
                  disabled={loginLoading}
                  className="inline-flex w-full sm:w-auto justify-center items-center gap-4 px-10 py-5 bg-white dark:bg-white/10 text-gray-900 dark:text-white rounded-[1.5rem] font-bold uppercase tracking-widest text-xs hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all shadow-xl disabled:opacity-50 border border-gray-100 dark:border-white/10"
                >
                  {loginLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  )}
                  <span>Continue with Google</span>
                </motion.button>
              </div>
            )}
          </div>

          {/* Identity Settings */}
          <div className="bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] p-8 md:p-12 border border-gray-100 dark:border-white/5 shadow-xl shadow-blue-500/5 relative overflow-hidden group transition-colors duration-300">
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] z-0" />
            
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-xl border border-blue-100 dark:border-blue-500/10">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Identity info</h2>
            </div>
            
            <form onSubmit={handleSave} className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">
                    Game ID (UID)
                  </label>
                  <div className="relative group/input">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={playerId}
                      onChange={(e) => setPlayerId(e.target.value)}
                      placeholder="Enter your Player ID"
                      className="w-full h-16 pl-14 pr-6 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:border-blue-500 focus:bg-white dark:focus:bg-white/10 outline-none transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-300 tracking-wide"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">
                    WhatsApp number
                  </label>
                  <div className="relative group/input">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-emerald-600 transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+94 7X XXX XXXX"
                      className="w-full h-16 pl-14 pr-6 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/10 outline-none transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-300 tracking-wide"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">
                  Full Name
                </label>
                <div className="relative group/input">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-blue-600 transition-colors">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your legal name"
                    className="w-full h-16 pl-14 pr-6 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:border-blue-500 focus:bg-white dark:focus:bg-white/10 outline-none transition-all font-bold text-gray-900 dark:text-white placeholder:text-gray-300 tracking-wide"
                  />
                </div>
              </div>

              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSaving}
                  className="w-full h-18 primary-gradient text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50 text-xs"
                >
                  {isSaving ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : isSaved ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <Save className="w-6 h-6" />
                  )}
                  {isSaved ? 'Successfully saved' : isSaving ? 'Saving profile...' : 'Save changes'}
                </motion.button>
                
                <div className="flex items-center justify-center gap-2 mt-6">
                  <ShieldCheck className={`w-4 h-4 ${isSaved ? 'text-emerald-500' : 'text-gray-300'}`} />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {user ? 'Changes are automatically synced' : 'Sign in to enable cloud backup'}
                  </p>
                </div>
              </div>
            </form>
          </div>

          {/* Preferences Settings */}
          <div className="bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5 shadow-lg shadow-blue-500/5 relative overflow-hidden transition-colors duration-300">
             <div className="flex items-center justify-between p-6 rounded-[2rem] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 transition-colors">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-3 mb-1 text-sm">
                  Display theme
                </h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adjust interface appearance</p>
              </div>
              <button
                onClick={toggleTheme}
                className="group relative flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-blue-50 transition-all shadow-sm"
              >
                {theme === 'dark' ? <Moon className="w-6 h-6 text-blue-500" /> : <Sun className="w-6 h-6 text-yellow-500" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
