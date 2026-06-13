import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getService } from '../services/db';
import { Service } from '../types';
import { Loader2, ArrowLeft, ArrowRight, Crown, Code2, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

import { doc, onSnapshot } from '../lib/firestore-compat';
import { db } from '../lib/firebase';
import { mapDocData } from '../services/db';

export default function ServicePage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) return;

    // Try cache first
    const loadCached = async () => {
      try {
        const cachedService = await getService(serviceId);
        if (cachedService) setService(cachedService);
        if (cachedService) setLoading(false);
      } catch (err) {
        console.warn('Service page cache load failed:', err);
      }
    };
    loadCached();

    const serviceRef = doc(db, 'services', serviceId);
    const unsubscribeService = onSnapshot(serviceRef, (snapshot) => {
      if (snapshot.exists()) {
        setService(mapDocData<Service>(snapshot));
      } else {
        setService(null);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => {
      unsubscribeService();
    };
  }, [serviceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070708] flex items-center justify-center transition-colors">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070708] flex flex-col items-center justify-center p-4 transition-colors">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">Service offline</h1>
        <button onClick={() => navigate('/')} className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20">
          Return to home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-slate-50 dark:bg-[#0f1115] transition-colors duration-300">
      
      {/* Hero Section */}
      <div className="relative text-center pt-24 pb-32 px-4 bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-400 text-white mb-[-4rem]">
        <div className="max-w-7xl mx-auto absolute top-4 left-4 z-20">
          <motion.button 
            whileHover={{ x: -5 }}
            onClick={() => navigate('/')}
            className="inline-flex items-center text-xs font-bold text-white/80 uppercase tracking-widest hover:text-white transition-all px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/10 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </motion.button>
        </div>

        <div className="container mx-auto relative z-10 select-none">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 drop-shadow-md"
          >
            {service.title || 'Creative Studio'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl opacity-90 mx-auto max-w-2xl px-4"
          >
            {service.description || 'Craft your digital identity. Design professional price lists, membership banners, and unique avatars instantly.'}
          </motion.p>
        </div>
        {/* Decorative Curve at bottom of hero */}
        <div className="absolute bottom-[-1px] left-0 right-0 h-[60px] bg-slate-50 dark:bg-[#0f1115] transition-colors duration-300" style={{ clipPath: 'ellipse(60% 100% at 50% 100%)' }}></div>
      </div>

      {/* Design Cards Section */}
      <div className="container mx-auto pb-20 relative z-20 px-4 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 justify-center select-none">
          
          {/* Diamond Price List */}
          <Link to="/post-designs/diamond-store-generator" className="group bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-white/5 rounded-[24px] p-8 md:p-10 flex flex-col items-center text-center transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/15 hover:border-indigo-500/30 dark:hover:border-indigo-500/30">
            <div className="w-[90px] h-[90px] rounded-[28px] flex items-center justify-center text-4xl mb-6 bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 transition-all duration-400 relative z-10 group-hover:scale-110 group-hover:-rotate-3 group-hover:text-white group-hover:bg-sky-500 group-hover:shadow-[0_10px_20px_rgba(14,165,233,0.3)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
            </div>
            <h3 className="font-bold text-xl md:text-2xl mb-3 text-slate-800 dark:text-white">Diamond Price List</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-8 flex-grow">
              Generate clean, professional price tables for your diamond top-up business. Customize rates and colors in seconds.
            </p>
            <div className="mt-auto px-6 py-2.5 rounded-[50px] font-semibold text-sm transition-all duration-300 bg-slate-100 text-slate-800 dark:bg-[#252a33] dark:text-gray-300 group-hover:bg-slate-800 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 flex items-center justify-center min-w-[170px]">
              <span className="group-hover:mr-2 transition-all">Start Designing</span>
              <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            </div>
          </Link>

          {/* Membership Assets */}
          <Link to="/post-designs/membership-post-generator" className="group bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-white/5 rounded-[24px] p-8 md:p-10 flex flex-col items-center text-center transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-500/15 hover:border-yellow-500/30 dark:hover:border-yellow-500/30">
            <div className="w-[90px] h-[90px] rounded-[28px] flex items-center justify-center text-4xl mb-6 bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-500 transition-all duration-400 relative z-10 group-hover:scale-110 group-hover:rotate-3 group-hover:text-white group-hover:bg-yellow-500 group-hover:shadow-[0_10px_20px_rgba(234,179,8,0.3)]">
              <Crown width="40" height="40" />
            </div>
            <h3 className="font-bold text-xl md:text-2xl mb-3 text-slate-800 dark:text-white">Membership Assets</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-8 flex-grow">
              Create eye-catching promotional banners for Weekly and Monthly memberships to attract more customers.
            </p>
            <div className="mt-auto px-6 py-2.5 rounded-[50px] font-semibold text-sm transition-all duration-300 bg-slate-100 text-slate-800 dark:bg-[#252a33] dark:text-gray-300 group-hover:bg-slate-800 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 flex items-center justify-center min-w-[170px]">
              <span className="group-hover:mr-2 transition-all">Create Banner</span>
              <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            </div>
          </Link>

          {/* Profile Avatar */}
          <Link to="/post-designs/ff-profile-dp-generator" className="group bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-white/5 rounded-[24px] p-8 md:p-10 flex flex-col items-center text-center transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-500/15 hover:border-rose-500/30 dark:hover:border-rose-500/30">
            <div className="w-[90px] h-[90px] rounded-[28px] flex items-center justify-center text-4xl mb-6 bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 transition-all duration-400 relative z-10 group-hover:scale-110 group-hover:-rotate-3 group-hover:text-white group-hover:bg-rose-500 group-hover:shadow-[0_10px_20px_rgba(244,63,94,0.3)]">
              <UserIcon width="40" height="40" />
            </div>
            <h3 className="font-bold text-xl md:text-2xl mb-3 text-slate-800 dark:text-white">Profile Avatar</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-8 flex-grow">
              Stand out with a unique gaming avatar. Customize your Free Fire profile picture with pro-level styles.
            </p>
            <div className="mt-auto px-6 py-2.5 rounded-[50px] font-semibold text-sm transition-all duration-300 bg-slate-100 text-slate-800 dark:bg-[#252a33] dark:text-gray-300 group-hover:bg-slate-800 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 flex items-center justify-center min-w-[170px]">
              <span className="group-hover:mr-2 transition-all">Generate Avatar</span>
              <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            </div>
          </Link>



        </div>
      </div>

    </div>
  );
}

