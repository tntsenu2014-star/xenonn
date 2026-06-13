import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getAccountListing, createAccountOrder, getSettings } from '../services/db';
import { AccountListing, OrderStatus, PaymentMethod, Settings } from '../types';
import { Loader2, ArrowLeft, User, Trophy, MapPin, Zap, ShieldCheck, History, Tag, Copy, Check, MessageSquare, ExternalLink, Info, Image as ImageIcon, Landmark, Plus, X, Maximize2, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../lib/UserContext';
import { auth, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { initiatePayHerePayment } from '../lib/payhere';
import { updateAccountOrderStatus } from '../services/db';

export default function AccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<AccountListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Order modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const { profile } = useUser();
  const [customerName, setCustomerName] = useState(profile.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(profile.whatsappNumber || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.WHATSAPP);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile.customerName) setCustomerName(profile.customerName);
    if (profile.whatsappNumber) setCustomerPhone(profile.whatsappNumber);
  }, [profile]);

  useEffect(() => {
    async function fetchData() {
      if (!accountId) return;
      try {
        const [accData, settingsData] = await Promise.all([
          getAccountListing(accountId),
          getSettings()
        ]);
        if (!accData) {
          toast.error("Account listing not found.");
          navigate('/accounts');
          return;
        }
        setAccount(accData);
        setSettings(settingsData);
        
        // Auto-open modal if coming from 'Buy Now' button
        const params = new URLSearchParams(window.location.search);
        if (params.get('buy') === 'true' && !accData.isSold) {
          setIsOrderModalOpen(true);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load details.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [accountId, navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large", { description: "Maximum size is 2MB" });
      return;
    }

    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result as string);
      toast.success("Payment proof attached!");
    };
    reader.readAsDataURL(file);
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    if (!customerName || !customerPhone) {
      toast.error("Please fill in all details");
      return;
    }

    if ((paymentMethod === PaymentMethod.BANK || paymentMethod === PaymentMethod.EZ_CASH) && !proofFile) {
      toast.error("Payment proof required");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalProofUrl = '';
      
      if (proofFile) {
        const storageRef = ref(storage, `receipts/acc_${auth.currentUser?.uid || 'guest'}_${Date.now()}_${proofFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
        const snapshot = await uploadBytes(storageRef, proofFile);
        finalProofUrl = await getDownloadURL(snapshot.ref);
      }

      const orderData: any = {
        accountId: account.id,
        accountTitle: account.title,
        customerName,
        customerPhone,
        amount: account.price,
        paymentMethod,
        paymentProofUrl: finalProofUrl
      };
      
      console.log('Placing account order...', orderData);
      const orderId = await createAccountOrder(orderData);

      if (paymentMethod === PaymentMethod.PAYHERE) {
        initiatePayHerePayment({
          orderId,
          amount: account.price,
          customerName,
          customerPhone,
          packageName: account.title,
          onSuccess: async () => {
            try {
              await updateAccountOrderStatus(orderId, OrderStatus.CONFIRMED);
              toast.success("Account payment successful!");
              navigate(`/confirmation/acc_${orderId}`, { replace: true });
            } catch (e) {
              console.error("Status update after payment failed:", e);
              navigate(`/confirmation/acc_${orderId}`, { replace: true });
            }
          },
          onCancel: () => {
            toast.info("Payment cancelled.");
            navigate(`/confirmation/acc_${orderId}`, { replace: true });
          },
          onError: (err) => {
            toast.error("Payment failed", { description: err });
            navigate(`/confirmation/acc_${orderId}`, { replace: true });
          }
        });
        return;
      }
      
      if (paymentMethod === PaymentMethod.WHATSAPP && settings?.whatsappNumber) {
        const message = `*Hello GAMING R4D!*%0A%0A*New Account Order Details:*%0AOrder ID: #${orderId}%0AAccount: ${account.title}%0APrice: LKR ${account.price.toLocaleString()}%0ACustomer: ${customerName}%0APhone: ${customerPhone}%0A%0A_Please confirm my order._`;
        const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${message}`;
        window.open(whatsappUrl, '_blank');
      }

      toast.success("Order request sent! We will contact you soon.");
      navigate(`/confirmation/acc_${orderId}`, { replace: true });
    } catch (err: any) {
      console.error(err);
      let msg = "Failed to place order. Please try again.";
      if (err.message && typeof err.message === 'string' && err.message.includes('permission-denied')) {
        msg = "Permission Denied: Please log in or check your connection.";
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-[#070708]">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!account) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#070708] font-sans pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Link 
          to="/accounts" 
          className="inline-flex items-center text-sm font-black text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          BACK TO ALL ACCOUNTS
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Images Section */}
          <div className="lg:col-span-12 xl:col-span-7">
            <div className="space-y-6">
              <motion.div 
                layoutId={`img-${account.id}`}
                className="aspect-[16/10] bg-white dark:bg-[#0d0d0f] rounded-[3rem] overflow-hidden border border-gray-100 dark:border-white/5 relative group"
              >
                <img 
                  src={account.images[currentImageIdx] || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80'} 
                  alt={account.title}
                  className={`w-full h-full object-contain bg-black/40 transition-transform duration-500 ${account.isSold ? 'grayscale' : ''}`}
                />
                
                {account.isSold && (
                  <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-8 py-4 bg-red-600 text-white rounded-[2rem] font-black text-xl uppercase tracking-[0.3em] shadow-2xl shadow-red-500/50 border-4 border-red-400/50 rotate-[-5deg]"
                    >
                      Sold Out
                    </motion.div>
                  </div>
                )}
                
                <div className="absolute top-6 right-6 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFullScreen(true);
                    }}
                    className="p-3 bg-blue-600/80 sm:bg-white/20 backdrop-blur-md hover:bg-blue-600 sm:hover:bg-white/30 rounded-2xl text-white transition-all shadow-xl"
                    title="View Full Size"
                  >
                    <Maximize2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-8 pt-20 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex gap-2">
                      <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-widest">
                        PHO {currentImageIdx + 1} / {account.images.length}
                      </span>
                   </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {account.images.map((img, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentImageIdx(i)}
                    className={`aspect-square rounded-[1.2rem] overflow-hidden border-2 transition-all ${
                      currentImageIdx === i ? 'border-blue-600 scale-95' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-12 xl:col-span-5">
            <div className="sticky top-28 bg-white dark:bg-[#0d0d0f] rounded-[3rem] p-8 md:p-10 border border-gray-100 dark:border-white/5 shadow-2xl shadow-blue-500/5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6 italic ring-1 ring-blue-100 dark:ring-blue-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified Listing</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-4 leading-tight">
                {account.title}
              </h1>

              <div className="flex flex-wrap gap-3 mb-8">
                <div className="flex items-center text-xs font-black text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-xl">
                  <User className="h-4 w-4 mr-2" />
                  LVL {account.level}
                </div>
                <div className="flex items-center text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-xl">
                  <Trophy className="h-4 w-4 mr-2" />
                  {account.rank}
                </div>
                <div className="flex items-center text-xs font-black text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-xl">
                  <MapPin className="h-4 w-4 mr-2" />
                  {account.region}
                </div>
                {account.ffId && (
                  <div className="flex items-center text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <span className="mr-2 uppercase text-[9px] opacity-70">FF ID:</span>
                    {account.ffId}
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(account.ffId);
                        toast.success("FF ID Copied!");
                      }}
                      className="ml-2 hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6 mb-8">
                <div>
                   <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Rare Items & Assets</h4>
                   <div className="flex flex-wrap gap-2">
                     {account.rareItems.map((item, i) => (
                       <span key={i} className="inline-flex items-center px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold border border-gray-100 dark:border-white/5">
                         <Zap className="h-3 w-3 mr-1.5 text-blue-500" />
                         {item}
                       </span>
                     ))}
                   </div>
                </div>

                <div>
                   <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Seller's Note</h4>
                   <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed bg-blue-50/30 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100/50 dark:border-blue-900/30 text-sm">
                     {account.description}
                   </p>
                </div>
              </div>

              {/* Price & Action */}
              <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Total Price</span>
                    <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                      <span className="text-lg text-blue-600 dark:text-blue-500 font-black mr-2 italic">LKR</span>
                      {account.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border italic ${
                       account.isSold 
                       ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800' 
                       : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800'
                     }`}>
                       {account.isSold ? 'SOLD OUT' : 'IN STOCK'}
                     </span>
                  </div>
                </div>

                <button 
                  onClick={() => setIsOrderModalOpen(true)}
                  disabled={account.isSold}
                  className={`w-full h-14 sm:h-16 rounded-xl sm:rounded-[1.8rem] font-black text-base sm:text-lg transition-all shadow-2xl flex items-center justify-center space-x-3 uppercase tracking-widest ${
                    account.isSold 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:scale-[1.02] active:scale-95 shadow-blue-500/30 hover:bg-blue-700'
                  }`}
                >
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
                  <span>{account.isSold ? 'ALREADY SOLD' : 'BUY THIS ACCOUNT'}</span>
                </button>
                <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-6">
                  100% SECURE TRANSACTION GUARANTEED
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Viewer */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFullScreen(false)}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-4 sm:p-8 cursor-zoom-out"
          >
            <div className="absolute top-6 right-6 flex gap-4 z-20">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullScreen(false);
                }}
                className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all backdrop-blur-md active:scale-95"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIdx(prev => (prev > 0 ? prev - 1 : account.images.length - 1));
                }}
                className="absolute left-0 sm:left-4 z-10 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all backdrop-blur-sm pointer-events-auto active:scale-90"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>

              <motion.img 
                key={currentImageIdx}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={account.images[currentImageIdx]} 
                className="max-w-full max-h-full object-contain shadow-2xl pointer-events-auto cursor-default"
                onClick={(e) => e.stopPropagation()}
              />

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIdx(prev => (prev < account.images.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-0 sm:right-4 z-10 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all backdrop-blur-sm pointer-events-auto active:scale-90"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </div>

            <div className="mt-8 flex gap-3 overflow-x-auto pb-4 max-w-full pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              {account.images.map((img, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentImageIdx(i)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    currentImageIdx === i ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/20' : 'border-transparent opacity-40 hover:opacity-100'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Modal */}
      <AnimatePresence>
        {isOrderModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#0d0d0f] w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl sm:rounded-[3rem] p-6 sm:p-10 shadow-3xl border border-gray-100 dark:border-white/5 relative custom-scrollbar"
            >
              <button 
                onClick={() => setIsOrderModalOpen(false)} 
                className="absolute top-4 sm:top-8 right-4 sm:right-8 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 transition-colors z-10"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              <div className="mb-6 sm:mb-8 pr-10">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tighter mb-1">Confirm Order</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-xs sm:text-sm">Please provide your details to proceed.</p>
              </div>

              <form onSubmit={handleOrder} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">FullName</label>
                  <input 
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-12 sm:h-14 px-5 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-blue-500 outline-none rounded-xl sm:rounded-2xl font-bold dark:text-white transition-all text-sm sm:text-base"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">WhatsApp / Phone</label>
                  <input 
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full h-12 sm:h-14 px-5 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-blue-500 outline-none rounded-xl sm:rounded-2xl font-bold dark:text-white transition-all text-sm sm:text-base"
                    placeholder="07X XXX XXXX"
                  />
                </div>

                <div>
                   <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Preferred Payment Method</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {[
                       { id: PaymentMethod.WHATSAPP, icon: WhatsAppIcon, label: 'WhatsApp', show: true },
                       { id: PaymentMethod.BANK, icon: Landmark, label: 'Bank Transfer', show: true },
                       { id: PaymentMethod.EZ_CASH, icon: Zap, label: 'eZ Cash', show: true },
                       { id: PaymentMethod.PAYHERE, icon: CreditCard, label: 'Card / Online', show: settings?.isPayhereEnabled }
                     ].filter(m => m.show !== false).map((method) => (
                       <button
                         key={method.id}
                         type="button"
                         onClick={() => {
                          setPaymentMethod(method.id);
                          if (method.id === PaymentMethod.WHATSAPP || method.id === PaymentMethod.PAYHERE) { setProofFile(null); setProofPreview(null); }
                         }}
                         className={`h-12 sm:h-14 rounded-xl sm:rounded-2xl border flex items-center justify-center text-[9px] sm:text-[10px] font-black uppercase tracking-tight transition-all ${
                           paymentMethod === method.id 
                           ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                           : 'bg-white dark:bg-white/5 text-gray-400 border-gray-100 dark:border-white/5 hover:bg-gray-50'
                         }`}
                       >
                         <method.icon className="h-4 w-4 mr-2" />
                         {method.label}
                       </button>
                     ))}
                   </div>

                   <AnimatePresence>
                     {paymentMethod !== PaymentMethod.WHATSAPP && paymentMethod !== PaymentMethod.PAYHERE && (
                       <motion.div
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="overflow-hidden"
                       >
                         <div className="p-4 sm:p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 mt-3 space-y-4">
                           <div className="space-y-2">
                             <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Our Payment Details</p>
                             {paymentMethod === PaymentMethod.BANK ? (
                               <div className="space-y-1">
                                 <div className="flex justify-between text-[11px]">
                                   <span className="text-gray-500 font-bold">Bank:</span>
                                   <span className="text-gray-900 dark:text-white font-black">{settings?.bankName || 'Loading...'}</span>
                                 </div>
                                 <div className="flex justify-between text-[11px]">
                                   <span className="text-gray-500 font-bold">Account:</span>
                                   <span className="text-gray-900 dark:text-white font-black">{settings?.bankAccountNumber || 'Loading...'}</span>
                                 </div>
                                 <div className="flex justify-between text-[11px]">
                                   <span className="text-gray-500 font-bold">Holder:</span>
                                   <span className="text-gray-900 dark:text-white font-black">{settings?.bankAccountHolder || 'Loading...'}</span>
                                 </div>
                               </div>
                             ) : (
                               <div className="flex justify-between text-[11px]">
                                 <span className="text-gray-500 font-bold">Ez Cash Number:</span>
                                 <span className="text-gray-900 dark:text-white font-black">{settings?.ezCashNumber || 'Loading...'}</span>
                               </div>
                             )}
                           </div>

                           <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Upload Payment Proof</p>
                             {!proofPreview ? (
                               <label className="relative group cursor-pointer block">
                                 <div className="w-full h-24 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center space-y-2 group-hover:border-blue-400 transition-colors bg-white dark:bg-transparent">
                                   <Plus className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Click to upload receipt</span>
                                 </div>
                                 <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                               </label>
                             ) : (
                               <div className="relative group">
                                 <div className="w-full h-32 rounded-xl overflow-hidden border-2 border-blue-600">
                                   <img src={proofPreview} alt="Payment Proof" className="w-full h-full object-cover" />
                                 </div>
                                 <button 
                                   type="button"
                                   onClick={() => { setProofFile(null); setProofPreview(null); }}
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

                 <div className="bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-blue-100 dark:border-blue-900/30">
                  <div className="flex justify-between items-center text-blue-600 dark:text-blue-400 font-black">
                     <span className="text-[9px] sm:text-[10px] uppercase tracking-widest">Payable Amount</span>
                     <span className="text-lg sm:text-xl tracking-tighter italic">LKR {account.price.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || ((paymentMethod === PaymentMethod.BANK || paymentMethod === PaymentMethod.EZ_CASH) && !proofFile)}
                  className="w-full h-14 sm:h-16 bg-gray-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[11px] sm:text-base rounded-xl sm:rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-3 shadow-lg"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : <span>{proofFile || paymentMethod === PaymentMethod.WHATSAPP ? 'CONFIRM ORDER' : 'CONFIRM & PROCEED'}</span>}
                </button>
                <div className="mt-4 text-center">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                    By proceeding, you agree to our <Link to="/terms" className="text-blue-500 hover:underline">Terms & Conditions</Link>
                  </p>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
