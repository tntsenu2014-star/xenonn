import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Package, PaymentMethod, OrderStatus, Settings as SiteSettings } from '../types';
import { Gem, Send, Landmark, MessageCircle, AlertCircle, Loader2, CheckCircle2, User, Phone, ShoppingCart, Plus, Minus, Smartphone, ArrowRight, ShieldCheck, Gamepad2, Zap, X, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getPackages, createOrder, getSettings, updateOrderStatus } from '../services/db';
import { initiatePayHerePayment } from '../lib/payhere';
import { GAMES } from '../constants';
import { useUser } from '../lib/UserContext';
import { toast } from 'sonner';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import WhatsAppIcon from '../components/WhatsAppIcon';

export default function OrderPage() {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('game');
  const navigate = useNavigate();
  const { profile } = useUser();
  
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Record<string, number>>({});
  const [userId, setUserId] = useState(profile.playerId || '');
  const [customerName, setCustomerName] = useState(profile.customerName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile.whatsappNumber || '');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isProofProcessing, setIsProofProcessing] = useState(false);

  // Sync with profile when it loads
  useEffect(() => {
    if (profile.playerId) setUserId(profile.playerId);
    if (profile.customerName) setCustomerName(profile.customerName);
    if (profile.whatsappNumber) setPhoneNumber(profile.whatsappNumber);
  }, [profile]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const activeGame = GAMES.find(g => g.id === gameId) || GAMES[0];

  useEffect(() => {
    async function init() {
      // Load settings
      try {
        const settings = await getSettings();
        setSiteSettings(settings);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }

      // Try to load cached packages first
      try {
        const cached = await getPackages(true, gameId || undefined);
        if (cached.length > 0) {
          setPackages(cached);
          setInitialLoading(false);
        }
      } catch (err) {
        console.warn('Order page cache load failed:', err);
      }

      try {
        const data = await getPackages(true, gameId || undefined);
        setPackages(data);
      } catch (err) {
        console.error(err);
        if (packages.length === 0) setError("Could not load packages. Please check your connection.");
      } finally {
        setInitialLoading(false);
      }
    }
    init();
  }, [gameId]);

  const updateQuantity = (pkgId: string, delta: number) => {
    setSelectedPackages(prev => {
      const current = prev[pkgId] || 0;
      const next = current + delta;
      const nextMap = { ...prev };
      if (next <= 0) {
        delete nextMap[pkgId];
      } else {
        nextMap[pkgId] = next;
      }
      return nextMap;
    });
  };

  const selectedList = Object.entries(selectedPackages).map(([id, qty]) => {
    const pkg = packages.find(p => p.id === id);
    return { pkg, qty };
  }).filter(item => item.pkg);

  const totalAmount = selectedList.reduce((acc, item) => acc + ((item.pkg?.price || 0) as number) * (item.qty as number), 0);
  const totalDiamonds = selectedList.reduce((acc, item) => acc + ((item.pkg?.diamonds || 0) as number) * (item.qty as number), 0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large", { description: "Maximum size is 2MB" });
      return;
    }

    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
    toast.success("Payment proof attached!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Order form submission triggered');
    
    if (isSubmitting) {
      console.log('Submission already in progress');
      return;
    }

    if (selectedList.length === 0) {
      const msg = "Please select at least one package by clicking the + buttons.";
      console.log('Validation failed: No packages selected');
      setSubmissionError(msg);
      toast.error(msg);
      return;
    }

    if (!userId.trim()) {
      const msg = "Please enter your Game User ID.";
      console.log('Validation failed: No userId');
      setSubmissionError(msg);
      toast.error(msg);
      return;
    }

    if (!customerName.trim()) {
      const msg = "Please enter your name.";
      console.log('Validation failed: No customerName');
      setSubmissionError(msg);
      toast.error(msg);
      return;
    }

    if (!phoneNumber.trim()) {
      const msg = "Please enter your WhatsApp number.";
      console.log('Validation failed: No phoneNumber');
      setSubmissionError(msg);
      toast.error(msg);
      return;
    }

    if ((paymentMethod === PaymentMethod.BANK || paymentMethod === PaymentMethod.EZ_CASH) && !proofFile) {
      const msg = "Payment proof required. Please upload your payment receipt.";
      console.log('Validation failed: No proof file for ' + paymentMethod);
      toast.error("Proof Missing", { description: msg });
      setSubmissionError(msg);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    console.log('Starting order creation process...', {
      gameId,
      userId,
      selectedCount: selectedList.length,
      paymentMethod,
      hasProof: !!proofFile,
      hasSiteSettings: !!siteSettings,
      whatsappNumber: siteSettings?.whatsappNumber
    });
    
    try {
      const packageDescriptions = selectedList.map(item => `${item.pkg?.name} (x${item.qty})`).join(', ');
      
      let uploadedProofUrl = '';
      if (proofFile) {
        console.log('Uploading proof file:', proofFile.name, proofFile.size);
        const storageRef = ref(storage, `receipts/${userId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${proofFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
        const snapshot = await uploadBytes(storageRef, proofFile);
        uploadedProofUrl = await getDownloadURL(snapshot.ref);
        console.log('Proof uploaded successfully:', uploadedProofUrl);
      }

      const orderData: any = {
        packageId: selectedList[0].pkg?.id || 'multi',
        packageName: `${activeGame?.name || 'Game'}: ${packageDescriptions}`,
        diamonds: totalDiamonds,
        userId,
        customerName,
        customerPhone: phoneNumber,
        paymentMethod,
        amount: totalAmount,
      };

      if (uploadedProofUrl) {
        orderData.paymentProofUrl = uploadedProofUrl;
      }

      console.log('Sending order to database...', orderData);
      const orderId = await createOrder(orderData);
      console.log('Order created successfully! ID:', orderId);
      
      if (!orderId) {
        throw new Error("Failed to get order confirmation from server.");
      }

      // Handle PayHere specifically
      if (paymentMethod === PaymentMethod.PAYHERE) {
        initiatePayHerePayment({
          orderId,
          amount: totalAmount,
          customerName,
          customerPhone: phoneNumber,
          packageName: `${activeGame?.name || 'Game'}: ${packageDescriptions}`,
          onSuccess: async () => {
            try {
              // Update status to CONFIRMED or COMPLETED on success
              await updateOrderStatus(orderId, OrderStatus.CONFIRMED, "Paid via PayHere");
              toast.success("Payment successful and verified!");
              navigate(`/confirmation/${orderId}`, { replace: true });
            } catch (e) {
              console.error("Status update after payment failed:", e);
              navigate(`/confirmation/${orderId}`, { replace: true });
            }
          },
          onCancel: () => {
            toast.info("Payment cancelled. You can try again from your order history.");
            navigate(`/confirmation/${orderId}`, { replace: true });
          },
          onError: (err) => {
            toast.error("Payment failed", { description: err });
            navigate(`/confirmation/${orderId}`, { replace: true });
          }
        });
        return; // initiatePayHerePayment handles navigation
      }

      // WhatsApp Redirect if applicable
      if (paymentMethod === PaymentMethod.WHATSAPP && siteSettings?.whatsappNumber) {
        try {
          console.log('Attempting WhatsApp redirect...');
          const whatsappMsg = `*NEW ORDER - ${siteSettings.siteName || 'Store'}*\n\nOrder ID: #${orderId.slice(-6)}\nGame: ${activeGame?.name || 'Game'}\nPackage: ${packageDescriptions}\nAmount: Rs. ${totalAmount.toLocaleString()}\nUser ID: ${userId}\nCustomer: ${customerName}\n\nPlease confirm my order!`;
          const whatsappUrl = `https://wa.me/${siteSettings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`;
          window.open(whatsappUrl, '_blank');
        } catch (waErr) {
          console.error("WhatsApp redirect failed:", waErr);
        }
      }

      toast.success("Order Created Successfully! 💎", {
        description: `Total Amount: Rs. ${totalAmount.toLocaleString()}`,
      });

      console.log('Navigating to confirmation page...');
      navigate(`/confirmation/${orderId}`, { 
        replace: true,
        state: { 
          orderId,
          order: {
            id: orderId,
            packageName: `${activeGame?.name || 'Game'}: ${packageDescriptions}`,
            amount: totalAmount,
            userId,
            paymentMethod
          }
        } 
      });
    } catch (err: any) {
      console.error("CRITICAL SUBMISSION ERROR:", err);
      let errorMessage = "Failed to create order. Please try again or check your connection.";
      
      if (err.message) {
        try {
          const parsedError = JSON.parse(err.message);
          if (parsedError.error && parsedError.error.includes('permission-denied')) {
            errorMessage = "Permission denied: Our security shield blocked this request. Please try re-logging.";
          } else if (parsedError.error) {
            errorMessage = parsedError.error;
          }
        } catch (e) {
          if (err.message.includes('permission-denied')) {
            errorMessage = "Security policy error. Please contact us via WhatsApp if this persists.";
          } else {
            errorMessage = err.message;
          }
        }
      }

      setSubmissionError(errorMessage);
      toast.error("Checkout Failed", {
        description: errorMessage,
        duration: 8000
      });
    } finally {
      setIsSubmitting(false);
      console.log('Submission state cleared');
    }
  };

  const skeletonPackages = Array(6).fill(0);

  return (
    <div className="min-h-screen pb-20 transition-colors duration-300 bg-slate-50 dark:bg-[#070708]">
      {/* Game Header Banner */}
      <div className="relative h-[14rem] sm:h-[18rem] md:h-[22rem] overflow-hidden mx-2 sm:mx-4 md:mx-8 rounded-2xl sm:rounded-3xl group shadow-lg">
        <div className="absolute inset-0 bg-blue-950/40 group-hover:bg-blue-950/30 transition-colors z-10" />
        <img src={activeGame.image} alt={activeGame.name} className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700" />
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center pb-8 sm:pb-12 px-4 text-center">
          <div className="max-w-4xl w-full">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block p-1 bg-white dark:bg-[#0d0d0f] rounded-2xl mb-4 sm:mb-6 shadow-2xl shadow-blue-500/20"
            >
              <img src={activeGame.image} alt="Logo" className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl object-cover" />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="flex justify-center mb-3"
            >
              <div className="bg-blue-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl shadow-blue-900/50">
                <Zap className="w-3 h-3 fill-current" />
                <span>Top Up Instantly</span>
              </div>
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-white text-3xl sm:text-5xl md:text-7xl font-black tracking-tight drop-shadow-lg"
            >
              {activeGame.name}
            </motion.h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Main Content: Package Selection */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <div className="bg-white dark:bg-[#0d0d0f] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-xl shadow-blue-500/5 border border-gray-100 dark:border-white/5 transition-colors duration-300">
              <div className="flex items-center space-x-4 sm:space-x-6 mb-8 sm:mb-10">
                <div className="h-12 w-12 sm:h-14 sm:w-14 bg-blue-50 dark:bg-blue-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-blue-100 dark:border-blue-500/10 shrink-0">
                  <Gem className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-none mb-1.5 sm:mb-2 uppercase tracking-tight">1. Select Package</h3>
                  <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Choose your top-up amount</p>
                </div>
              </div>

              {initialLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                  {skeletonPackages.map((_, i) => (
                    <div key={i} className="rounded-xl sm:rounded-2xl border-2 border-gray-100 dark:border-white/5 p-3 sm:p-5 animate-pulse">
                      <div className="w-full aspect-square bg-gray-100 dark:bg-white/5 rounded-lg sm:rounded-xl mb-3 sm:mb-4"></div>
                      <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-3/4 mx-auto mb-2"></div>
                      <div className="h-5 bg-gray-100 dark:bg-white/5 rounded w-1/2 mx-auto mb-4"></div>
                      <div className="h-10 bg-gray-100 dark:bg-white/5 rounded-lg w-full"></div>
                    </div>
                  ))}
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-16 sm:py-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <Gem className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold text-sm uppercase tracking-widest text-[10px] sm:text-xs">No active packages available</p>
                </div>
              ) : (
                <div className="max-h-[600px] sm:max-h-[700px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 pb-4">
                    {packages.map((pkg) => (
                      <motion.div
                        key={pkg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          if (!selectedPackages[pkg.id]) {
                            updateQuantity(pkg.id, 1);
                          }
                        }}
                        className={`relative cursor-pointer rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 transition-all duration-200 flex flex-col items-center ${
                          selectedPackages[pkg.id] 
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-500/10 shadow-lg shadow-blue-500/10' 
                            : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#0d0d0f] hover:border-blue-300'
                        }`}
                      >
                        {/* Image Container */}
                        <div className="w-full aspect-square bg-gray-50 dark:bg-white/5 rounded-lg sm:rounded-xl flex items-center justify-center p-2 sm:p-6 mb-2 sm:mb-4 border border-gray-100 dark:border-white/10 transition-colors">
                          {pkg.imageUrl ? (
                            <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Gem className={`h-6 w-6 sm:h-12 sm:w-12 transition-colors ${selectedPackages[pkg.id] ? 'text-blue-600' : 'text-gray-300'}`} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="text-center w-full">
                          <h4 className={`font-bold text-[11px] sm:text-sm md:text-base leading-tight mb-1.5 sm:mb-2 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] transition-colors ${selectedPackages[pkg.id] ? 'text-blue-900 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {pkg.name}
                          </h4>
                          
                          <div className="text-blue-600 dark:text-blue-400 font-black text-sm sm:text-lg mb-3 sm:mb-4">
                            Rs. {pkg.price.toLocaleString()}
                          </div>
  
                          {/* Quantity Controls */}
                          <div className={`rounded-lg sm:rounded-xl p-0.5 sm:p-1 flex items-center justify-between border transition-all ${
                            selectedPackages[pkg.id] 
                            ? 'bg-white dark:bg-white/10 border-blue-200 dark:border-blue-500/20 shadow-sm' 
                            : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'
                          }`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(pkg.id, -1);
                              }}
                              disabled={!selectedPackages[pkg.id]}
                              className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-white dark:bg-white/10 text-gray-500 hover:text-blue-600 disabled:opacity-30 border border-gray-100 dark:border-white/10 shadow-sm transition-all"
                            >
                              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            
                            <span className="font-bold text-[10px] sm:text-sm text-gray-900 dark:text-white">
                              {selectedPackages[pkg.id] || 0}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(pkg.id, 1);
                              }}
                              className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all"
                            >
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Selection Check */}
                        {selectedPackages[pkg.id] && (
                          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-blue-600 text-white rounded-full p-1 sm:p-1.5 shadow-lg border border-white dark:border-gray-800">
                            <CheckCircle2 className="h-2 w-2 sm:h-3 sm:w-3" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#0d0d0f] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl shadow-blue-500/5 border border-gray-100 dark:border-white/5 transition-colors duration-300">
              <div className="flex items-center space-x-4 sm:space-x-6 mb-8 sm:mb-10">
                <div className="h-12 w-12 sm:h-14 sm:w-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/10 shrink-0">
                  <User className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-none mb-1.5 sm:mb-2 uppercase tracking-tight">2. Identity</h3>
                  <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Account information</p>
                </div>
              </div>

              <div className="grid gap-6">
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
                    {activeGame.idLabel || 'Game User ID'}
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 flex items-center justify-center h-6 w-6 pointer-events-none">
                      <Gem className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder={activeGame.idPlaceholder || "Enter ID here..."}
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="w-full h-12 sm:h-14 pl-12 sm:pl-14 pr-6 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 focus:border-blue-600 outline-none transition-all font-bold text-sm sm:text-lg text-gray-900 dark:text-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Name</label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-12 sm:h-14 px-5 sm:px-6 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 focus:border-blue-600 outline-none transition-all font-bold text-sm sm:text-base text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">WhatsApp Number</label>
                    <input
                      type="tel"
                      placeholder="+94 77 XXXXXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full h-12 sm:h-14 px-5 sm:px-6 rounded-xl border border-gray-100 bg-gray-50 dark:bg-white/5 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 focus:border-emerald-600 outline-none transition-all font-bold text-sm sm:text-base text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:sticky lg:top-32 self-start space-y-6">
            <div className="bg-white dark:bg-[#0d0d0f] rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-white/5 shadow-xl shadow-blue-500/5 transition-colors duration-300">
              <div className="flex items-center space-x-4 mb-6 sm:mb-8 pb-4 border-b border-gray-100 dark:border-white/5">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Summary</h3>
              </div>

              {submissionError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {submissionError}
                </div>
              )}

              {initialLoading ? (
                <div className="p-4 sm:p-5 bg-gray-50 dark:bg-white/5 rounded-xl sm:rounded-2xl mb-6 sm:mb-8 animate-pulse">
                  <div className="h-4 bg-gray-100 dark:bg-white/10 rounded w-1/2 mb-3"></div>
                  <div className="h-6 bg-gray-100 dark:bg-white/10 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-100 dark:bg-white/10 rounded w-full"></div>
                </div>
              ) : selectedList.length > 0 ? (
                <div className="space-y-4 mb-6 sm:mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedList.map((item) => (
                    <div key={item.pkg?.id} className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/10 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 flex-1 pr-2">{item.pkg?.name}</span>
                        <button onClick={() => updateQuantity(item.pkg!.id, -999)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-200/50 dark:border-white/10">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => updateQuantity(item.pkg!.id, -1)} className="p-1 rounded bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10"><Minus className="h-3 w-3" /></button>
                          <span className="text-[10px] font-black w-4 text-center">{item.qty}</span>
                          <button onClick={() => updateQuantity(item.pkg!.id, 1)} className="p-1 rounded bg-blue-600 text-white"><Plus className="h-3 w-3" /></button>
                        </div>
                        <div className="text-sm font-black text-blue-600 dark:text-blue-400">Rs. {(((item.pkg?.price || 0) as number) * (item.qty as number)).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t-2 border-dashed border-gray-200 dark:border-white/10 flex justify-between items-center text-gray-900 dark:text-white">
                    <span className="text-xs font-black uppercase tracking-widest">Total</span>
                    <span className="text-xl font-black">Rs. {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 sm:p-8 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-xl sm:rounded-2xl mb-6 sm:mb-8 text-center">
                  <Gem className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select a package</p>
                </div>
              )}

              <div className="mb-6 sm:mb-8">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Payment Method</label>
                <div className="grid gap-2">
                  {[
                    { id: PaymentMethod.BANK, label: 'Bank Transfer', icon: Landmark },
                    { id: PaymentMethod.WHATSAPP, label: 'WhatsApp', icon: WhatsAppIcon },
                    { id: PaymentMethod.EZ_CASH, label: 'EZ Cash', icon: Smartphone, show: true },
                    { id: PaymentMethod.PAYHERE, label: 'Card / Online', icon: CreditCard, show: siteSettings?.isPayhereEnabled }
                  ].filter(m => m.show !== false).map((method) => (
                    <div key={method.id} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method.id as PaymentMethod);
                          if (method.id === PaymentMethod.WHATSAPP || method.id === PaymentMethod.PAYHERE) {
                            setProofFile(null);
                            setProofPreview(null);
                          }
                        }}
                        className={`w-full p-3.5 sm:p-4 rounded-xl border flex items-center justify-between transition-all ${
                          paymentMethod === method.id 
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm' 
                          : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#0d0d0f] text-gray-600 dark:text-gray-400 hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <method.icon className="h-4 sm:h-5 w-4 sm:w-5" />
                          <span className="text-[13px] sm:text-sm font-bold">{method.label}</span>
                        </div>
                        {paymentMethod === method.id && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <AnimatePresence>
                        {paymentMethod === method.id && (method.id === PaymentMethod.BANK || method.id === PaymentMethod.EZ_CASH) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 sm:p-5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 mt-1 space-y-4">
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Our Payment Details</p>
                                {method.id === PaymentMethod.BANK ? (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] sm:text-xs">
                                      <span className="text-gray-500 font-bold">Bank:</span>
                                      <span className="text-gray-900 dark:text-white font-black">{siteSettings?.bankName || 'Loading...'}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] sm:text-xs">
                                      <span className="text-gray-500 font-bold">Account:</span>
                                      <span className="text-gray-900 dark:text-white font-black">{siteSettings?.bankAccountNumber || 'Loading...'}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] sm:text-xs">
                                      <span className="text-gray-500 font-bold">Holder:</span>
                                      <span className="text-gray-900 dark:text-white font-black">{siteSettings?.bankAccountHolder || 'Loading...'}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-between text-[11px] sm:text-xs">
                                    <span className="text-gray-500 font-bold">Ez Cash Number:</span>
                                    <span className="text-gray-900 dark:text-white font-black">{siteSettings?.ezCashNumber || 'Loading...'}</span>
                                  </div>
                                )}
                              </div>

                              <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Upload Payment Proof</p>
                                {!proofPreview ? (
                                  <label className="relative group cursor-pointer block">
                                    <div className="w-full h-24 sm:h-28 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center space-y-2 group-hover:border-blue-400 transition-colors bg-white dark:bg-transparent">
                                      {isProofProcessing ? (
                                        <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                                      ) : (
                                        <>
                                          <Plus className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Click to upload receipt</span>
                                        </>
                                      )}
                                    </div>
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/*" 
                                      onChange={handleImageUpload}
                                      disabled={isProofProcessing}
                                    />
                                  </label>
                                ) : (
                                  <div className="relative group">
                                    <div className="w-full h-32 sm:h-40 rounded-xl overflow-hidden border-2 border-blue-600">
                                      <img src={proofPreview} alt="Payment Proof" className="w-full h-full object-cover" />
                                    </div>
                                    <button 
                                      onClick={() => {
                                        setProofFile(null);
                                        setProofPreview(null);
                                      }}
                                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

                  {/* Submission Error Display */}
                  {submissionError && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl mb-6 flex items-start space-x-3"
                    >
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Attention Required</p>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80 font-bold leading-tight">{submissionError}</p>
                      </div>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || selectedList.length === 0}
                    className="w-full h-14 sm:h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl flex items-center justify-center space-x-3 shadow-lg shadow-blue-500/20 disabled:opacity-30 transition-all font-bold uppercase tracking-widest text-[11px] sm:text-sm"
                  >
                    <span>{proofPreview ? 'Confirm Order' : (paymentMethod === PaymentMethod.WHATSAPP ? 'Confirm Via WhatsApp' : 'Checkout')}</span>
                    {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" /> : <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </button>

              <div className="mt-4 text-center">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                  By proceeding, you agree to our <Link to="/terms" className="text-blue-500 hover:underline">Terms & Conditions</Link>
                </p>
              </div>
              
              <div className="mt-5 flex items-center justify-center space-x-2 text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Safe & Secured</span>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-5 sm:p-6 border border-emerald-100 dark:border-emerald-500/20 transition-colors">
              <div className="flex items-start space-x-3 sm:space-x-4 text-left">
                <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-[10px] sm:text-xs text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-1 leading-none">Instant Delivery</p>
                  <p className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-500 leading-relaxed font-bold uppercase opacity-80">
                    Trusted processing • 5-15 Minutes
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
