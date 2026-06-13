import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package } from '../types';
import { Gem, ArrowRight, Loader2, AlertCircle, TrendingUp, Sparkles, Gamepad2, ChevronLeft, ChevronRight, MoreHorizontal, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getPackages, getBanners, getServices, getEvents, mapDocData, getSettings } from '../services/db';
import { GAMES } from '../constants';
import { Banner, Service, Event, Settings } from '../types';
import { collection, query, where, onSnapshot } from '../lib/firestore-compat';
import { db } from '../lib/firebase';
import { Skeleton, PackageSkeleton, BannerSkeleton } from '../components/Skeleton';

function BannerSlideshow() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try cache first
    const loadCached = async () => {
      const cached = await getBanners(true);
      if (cached.length > 0) {
        setBanners(cached);
        setIsLoading(false);
      }
    };
    loadCached();

    const q = query(collection(db, 'banners'), where('isActive', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => mapDocData<Banner>(doc)).sort((a, b) => (a.order || 0) - (b.order || 0));
      setBanners(data);
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (isLoading) {
    return (
      <div className="relative w-full aspect-[4/3] sm:aspect-[21/9] md:aspect-[24/7] rounded-[1.5rem] sm:rounded-[2rem] bg-gray-100 dark:bg-white/5 animate-pulse mb-12 overflow-hidden shadow-lg border border-gray-100 dark:border-white/5" />
    );
  }

  if (banners.length === 0) return null;

  const prev = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  const next = () => setCurrentIndex((prev) => (prev + 1) % banners.length);

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[21/9] md:aspect-[24/7] rounded-[1.5rem] sm:rounded-[2rem] bg-gray-100 overflow-hidden group shadow-lg mb-12">
      <AnimatePresence mode="wait">
        <motion.div
          key={banners[currentIndex].id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {banners[currentIndex].linkUrl ? (
            <Link to={banners[currentIndex].linkUrl!}>
              <img 
                src={banners[currentIndex].imageUrl} 
                alt="banner" 
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </Link>
          ) : (
            <img 
              src={banners[currentIndex].imageUrl} 
              alt="banner" 
              className="w-full h-full object-cover" 
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Navigation Controls */}
      {banners.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all sm:opacity-0 sm:group-hover:opacity-100 z-10">
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button onClick={next} className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-all sm:opacity-0 sm:group-hover:opacity-100 z-10">
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 sm:w-8 bg-blue-600' : 'w-1.5 sm:w-2 bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GameCardImage({ src, alt, gameId, comingSoon }: { src: string, alt: string, gameId: string, comingSoon?: boolean }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  return (
    <div className="relative aspect-square overflow-hidden bg-gray-100">
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer" 
             style={{ backgroundSize: '200% 100%' }} />
      )}
      
      <motion.img 
        ref={imgRef}
        src={src} 
        alt={alt} 
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.2s] ease-out"
      />
      
      {/* Premium Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20" />
      <div className="absolute inset-0 border-[3px] border-blue-600/0 group-hover:border-blue-600/30 transition-all duration-500 rounded-xl sm:rounded-[1.6rem] pointer-events-none z-30" />
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleContact = () => {
    if (settings?.whatsappNumber) {
      window.open(`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`, '_blank');
    } else {
      navigate('/order');
    }
  };

  useEffect(() => {
    // Try to load initial data from cache first for instant render
    const loadInitialData = async () => {
      try {
        const [cachedPackages, cachedServices, cachedEvents] = await Promise.all([
          getPackages(true),
          getServices(true),
          getEvents(true)
        ]);
        
        if (cachedPackages.length > 0) setPackages(cachedPackages);
        if (cachedServices.length > 0) setServices(cachedServices);
        if (cachedEvents.length > 0) setEvents(cachedEvents);
        
        // If we have any data, don't show the initial big skeleton
        if (cachedPackages.length > 0 || cachedServices.length > 0) {
          setLoading(false);
        }
      } catch (err) {
        console.warn('Initial cache load failed:', err);
      }
    };
    
    loadInitialData();

    // Create multiple snapshot listeners for live updates
    const bannersUnsubscribe = onSnapshot(query(collection(db, 'banners'), where('isActive', '==', true)), (snapshot) => {
      const data = snapshot.docs.map(doc => mapDocData<Banner>(doc)).sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    const packagesUnsubscribe = onSnapshot(query(collection(db, 'packages'), where('isActive', '==', true)), (snapshot) => {
      const data = snapshot.docs.map(doc => mapDocData<Package>(doc)).sort((a: any, b: any) => b.createdAt - a.createdAt);
      setPackages(data);
    });

    const servicesUnsubscribe = onSnapshot(query(collection(db, 'services'), where('isActive', '==', true)), (snapshot) => {
      const data = snapshot.docs.map(doc => mapDocData<Service>(doc)).sort((a: any, b: any) => b.createdAt - a.createdAt);
      setServices(data);
    });

    const eventsUnsubscribe = onSnapshot(query(collection(db, 'events'), where('isActive', '==', true)), (snapshot) => {
      const data = snapshot.docs.map(doc => mapDocData<Event>(doc)).sort((a: any, b: any) => b.createdAt - a.createdAt);
      setEvents(data);
      setLoading(false); // Finally disable loading if it was still on
    }, (err) => {
      console.error(err);
      if (packages.length === 0) setError("Failed to load data.");
      setLoading(false);
    });

    return () => {
      bannersUnsubscribe();
      packagesUnsubscribe();
      servicesUnsubscribe();
      eventsUnsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen relative transition-colors duration-300">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Hero Section */}
      <div className="px-4 sm:px-6 lg:px-8 mb-16">
        {loading ? (
          <div className="max-w-7xl mx-auto">
            <BannerSkeleton />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto glass-card rounded-[2.5rem] p-6 sm:p-8 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-50/50 dark:bg-blue-900/5 mix-blend-overlay" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
            <div className="max-w-2xl flex flex-col items-center md:items-start">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/10 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold mb-6 sm:mb-8 text-blue-600 dark:text-blue-400"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Premium Top-Up Service</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight tracking-tight text-gray-900 dark:text-white"
              >
                Level Up <br className="hidden sm:block" />
                <span className="text-gradient">Instantly</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-600 dark:text-gray-400 font-medium text-base sm:text-lg mb-8 sm:mb-10 max-w-lg leading-relaxed"
              >
                Get your diamonds and gaming credits delivered in seconds. Safe, secure, and the best prices in the market.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-4"
              >
                 <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live 24/7 Delivery</span>
                 </div>
              </motion.div>
            </div>

            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="relative"
            >
              <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full"></div>
              <div className="relative bg-white dark:bg-[#0d0d0f] p-4 rounded-[2rem] shadow-2xl shadow-blue-500/10 border border-blue-50 dark:border-white/10 transition-colors">
                <img 
                  src="https://i.postimg.cc/52SjYFLk/lo.png" 
                  alt="GAMING R4D Logo" 
                  className="w-80 h-48 md:w-96 md:h-64 object-contain rounded-2xl"
                  loading="eager"
                />
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <BannerSlideshow />

        {/* Section Header */}
        <div className="flex items-center space-x-4 sm:space-x-6 mb-12">
          <div className="h-[2px] flex-grow bg-gray-200 dark:bg-white/10"></div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center transition-colors text-center px-4">
             <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 mr-3 sm:mr-4 text-blue-600 shrink-0" />
             Popular Games
          </h2>
          <div className="h-[2px] flex-grow bg-gray-200 dark:bg-white/10"></div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8 md:gap-10 mb-32">
          {GAMES.map((game, idx) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card-hover relative bg-white dark:bg-[#0d0d0f] rounded-3xl border border-gray-100/50 dark:border-white/5 p-2 sm:p-3 cursor-pointer overflow-hidden transition-all shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 group"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl sm:rounded-[1.8rem]">
                   <GameCardImage 
                    src={game.image} 
                    alt={game.name} 
                    gameId={game.id}
                    comingSoon={game.comingSoon}
                  />
                  {!game.comingSoon && (
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30">
                      <div className="bg-blue-600 text-white text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl flex items-center gap-1.5 shadow-xl shadow-blue-500/40">
                        <Zap className="w-2.5 sm:w-3 h-2.5 sm:h-3 fill-current" />
                        <span>Fast</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 pb-4 px-2 sm:pt-5 sm:pb-8 sm:px-4 flex flex-col items-center">
                  <h3 className="font-black text-gray-900 dark:text-white text-[12px] sm:text-lg group-hover:text-blue-600 transition-colors mb-1 sm:mb-2 line-clamp-1 text-center tracking-tight">
                    {game.name}
                  </h3>
                  
                  {game.comingSoon ? (
                    <button 
                      disabled
                      className="w-full h-10 sm:h-14 bg-gray-100 dark:bg-white/5 text-gray-400 font-bold text-[8px] sm:text-[10px] uppercase tracking-[0.2em] rounded-xl sm:rounded-2xl transition-all"
                    >
                      Coming Soon
                    </button>
                  ) : (
                    <Link 
                      to={`/order?game=${game.id}`}
                      className="w-full h-10 sm:h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] sm:text-[10px] uppercase tracking-[0.2em] rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                    >
                      <span>Top Up</span>
                      <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  )}
                </div>
              </motion.div>
          ))}
        </div>

        {/* Free Fire Accounts Section */}
        <div className="mb-32">
          <div className="flex items-center space-x-4 sm:space-x-6 mb-12">
            <div className="h-[2px] flex-grow bg-gray-200 dark:bg-white/10"></div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center transition-colors text-center px-4">
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 mr-3 sm:mr-4 text-blue-600 shrink-0" />
              FF Account Shop
            </h2>
            <div className="h-[2px] flex-grow bg-gray-200 dark:bg-white/10"></div>
          </div>

          <div 
            onClick={() => navigate('/accounts')}
            className="group relative min-h-[340px] sm:h-80 lg:h-[450px] rounded-[2.5rem] sm:rounded-[4rem] overflow-hidden cursor-pointer border border-white/5 shadow-2xl transition-all hover:scale-[1.005] active:scale-[0.995] bg-[#0a0a0a]"
          >
            {/* Artistic Image Placement */}
            <div className="absolute inset-0 sm:left-1/3 w-full h-full sm:w-[70%] z-0">
               {/* Decorative Glow behind image */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <img 
                src="https://i.postimg.cc/PJnp5bTK/Whats-App-Image-2026-05-06-at-6-43-28-AM.jpg" 
                alt="FF Accounts Rare" 
                className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
            </div>

            {/* Content Sidebar Overlay */}
            <div className="absolute inset-0 flex items-center px-8 sm:px-20 z-10" id="accounts-promo-card">
              <div className="max-w-xl w-full">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-lg shadow-blue-500/20"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Marketplace Elite</span>
                </motion.div>
                
                <h3 className="text-4xl sm:text-6xl lg:text-8xl font-black text-white tracking-tighter mb-4 leading-[0.85] uppercase">
                   Legendary <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Accounts</span>
                </h3>
                
                <p className="text-gray-400 font-medium text-sm sm:text-lg lg:text-xl mb-10 line-clamp-2 max-w-sm sm:max-w-md leading-relaxed">
                  Rare OG IDs, Evo guns, and high-rank profiles. 100% Secure & Verified.
                </p>
                
                <div className="flex flex-wrap items-center gap-6">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/accounts');
                    }}
                    className="h-14 sm:h-16 px-10 sm:px-12 bg-white text-black font-black text-xs sm:text-base uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-blue-600 hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center space-x-4 group/btn"
                  >
                    <span>Browse Shop</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                  
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Stock Status</span>
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span>50+ New Listings</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* More Services */}
        {(loading || services.length > 0) && (
          <div className="mb-32">
             <div className="flex items-center space-x-4 sm:space-x-6 mb-12">
              <div className="h-[2px] flex-grow bg-gray-200 dark:bg-white/10"></div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center transition-colors text-center px-4">
                 <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 mr-3 sm:mr-4 text-blue-600 shrink-0" />
                 Special Services
              </h2>
              <div className="h-[2px] flex-grow bg-gray-200 dark:bg-white/10"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="glass-card rounded-[2rem] p-6 sm:p-10 flex flex-col items-center text-center border border-gray-100 dark:border-white/5">
                    <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mb-6 sm:mb-8 shrink-0" />
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-8" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                ))
              ) : services.map((service, idx) => (
                <motion.div
                  key={service.id}
                  onClick={() => navigate(`/service/${service.id}`)}
                  className="card-hover glass-card rounded-[2.5rem] p-8 sm:p-12 flex flex-col items-center text-center cursor-pointer group hover:bg-white dark:hover:bg-white/5 transition-all duration-500 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-8 sm:mb-10 border border-blue-100 dark:border-blue-500/10 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shrink-0 shadow-lg shadow-blue-500/5">
                      {service.imageUrl ? (
                        <img src={service.imageUrl} alt={service.title} className="w-10 h-10 sm:w-12 sm:h-12 object-contain group-hover:invert transition-all duration-500" />
                      ) : (
                        <MoreHorizontal className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 group-hover:text-white" />
                      )}
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 transition-colors tracking-tight">
                    {service.title}
                  </h3>
                  
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base font-medium leading-relaxed mb-10 sm:mb-12 flex-grow max-w-[280px]">
                    {service.description}
                  </p>

                  <button className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 group-hover:bg-blue-600 text-gray-600 dark:text-gray-400 group-hover:text-white font-black text-xs sm:text-sm uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center space-x-3 shadow-sm group-hover:shadow-blue-500/30">
                    <span>Explore Now</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Support Panel */}
        <div className="relative">
          <motion.div 
            className="glass-card rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 md:p-20 text-center flex flex-col items-center shadow-2xl shadow-blue-500/5"
          >
            <div className="w-16 h-16 sm:w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-6 sm:mb-8 border border-blue-100 dark:border-blue-500/10 transition-colors">
              <Gamepad2 className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
            </div>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4 sm:mb-6">Need a Special Item?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg md:text-xl font-medium mb-8 sm:mb-12 max-w-2xl leading-relaxed">
              Our 24/7 support team is here to assist you with custom top-ups, game cards, and professional gaming support.
            </p>
            <button 
              onClick={handleContact}
              className="px-8 sm:px-12 py-4 sm:py-5 bg-blue-600 text-white font-bold rounded-xl sm:rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/25 flex items-center group w-full sm:w-auto justify-center cursor-pointer"
            >
              <span>Contact Support</span>
              <ArrowRight className="ml-3 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
