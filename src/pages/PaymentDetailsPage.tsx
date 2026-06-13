import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { PaymentMethod, Settings } from '../types';
import { Landmark, Smartphone, MessageCircle, ArrowLeft, ArrowRight, Loader2, Sparkles, CheckCircle2, ShieldCheck, AlertCircle, Plus, X } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { motion, AnimatePresence } from 'motion/react';
import { createOrder, getSettings } from '../services/db';
import { storage, auth } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';

export default function PaymentDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderPayload = location.state?.orderPayload;

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        console.error("Failed to load settings", error);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070708]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!orderPayload) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070708] py-20 px-4 transition-colors duration-300">
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/10 px-4 py-1.5 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400"
            >
              <Sparkles className="h-4 w-4" />
              <span>Official Business Accounts</span>
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
              Payment Information
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-base max-w-xl mx-auto">
              Please find our official verified accounts below. You can send payments safely using any of these methods.
            </p>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bank Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5 shadow-xl shadow-blue-500/5 relative overflow-hidden transition-colors"
            >
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-xl border border-blue-100 dark:border-blue-500/10">
                  <Landmark className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Bank Transfer</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Direct Bank deposit</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Bank Name</label>
                  <div className="text-base font-bold text-gray-900 dark:text-gray-100 font-sans uppercase">
                    {settings?.bankName || 'HNB Bank / Sampath Bank'}
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Account Number</label>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                    <span className="font-mono text-base font-bold text-gray-900 dark:text-white tracking-tight">
                      {settings?.bankAccountNumber || 'Account Number Pending'}
                    </span>
                    {settings?.bankAccountNumber && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(settings.bankAccountNumber);
                          toast.success("Account number copied!");
                        }}
                        className="text-xs font-black bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-wider"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Account Holder</label>
                  <div className="text-base font-black text-gray-900 dark:text-gray-100 uppercase font-sans tracking-tight leading-none">
                    {settings?.bankAccountHolder || 'Administrator Pending'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* EZ Cash Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5 shadow-xl shadow-blue-500/5 relative overflow-hidden transition-colors"
            >
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/10">
                  <Smartphone className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">EZ Cash / Dialog</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Instant Mobile Wallet</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Receiving Mobile Number</label>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10">
                    <span className="font-mono text-base font-bold text-gray-900 dark:text-white tracking-tight">
                      {settings?.ezCashNumber || 'Receiving Number Pending'}
                    </span>
                    {settings?.ezCashNumber && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(settings.ezCashNumber);
                          toast.success("EZ-Cash number copied!");
                        }}
                        className="text-xs font-black bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-wider"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-2xl border border-indigo-100/10">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-2">Notice</span>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    Make sure to confirm your transaction details before submitting payment. For support or offline confirmation, contact us via WhatsApp anytime.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Guide Section */}
          <div className="bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 dark:border-white/5 shadow-xl shadow-blue-500/5 transition-colors">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 text-center uppercase tracking-tight">How to Complete Orders</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: '1', title: 'Choose Package', desc: 'Navigate to any of our games, tap Top-Up and select your desired credits or package items.' },
                { step: '2', title: 'Make payment', desc: 'Transfer the total package amount to our Bank or EZ-Cash mobile number listed above.' },
                { step: '3', title: 'Upload Proof', desc: 'Submit your order details, attach a screenshot of the payment receipt, and check out instantly.' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-3 relative">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-black flex items-center justify-center shadow-lg shadow-blue-500/20">
                    {item.step}
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight pt-1">{item.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center pt-4">
            <button
              onClick={() => navigate('/')}
              className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Go to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large", { description: "Maximum size is 2MB" });
      return;
    }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (paymentMethod !== PaymentMethod.WHATSAPP && !proofFile) {
        toast.error("Please upload payment proof");
        setError("Please upload payment proof receipt.");
        return;
    }

    setIsSubmitting(true);
    setError(null);
    console.log('Starting order submission from PaymentDetailsPage...', { orderPayload, paymentMethod });
    
    try {
      let uploadedProofUrl = '';
      if (proofFile) {
        console.log('Uploading proof file...');
        const fileName = `${auth.currentUser?.uid || 'guest'}_${Date.now()}_${proofFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, `receipts/${fileName}`);
        const snapshot = await uploadBytes(storageRef, proofFile);
        uploadedProofUrl = await getDownloadURL(snapshot.ref);
        console.log('Proof uploaded successful:', uploadedProofUrl);
      }

      const finalOrder = {
        ...orderPayload,
        paymentMethod,
        paymentProofUrl: uploadedProofUrl,
        userId: auth.currentUser?.uid || orderPayload.userId || `offline_${Date.now()}`
      };

      console.log('Calling createOrder with final payload:', finalOrder);
      const orderId = await createOrder(finalOrder);
      console.log('Order created successfully with ID:', orderId);
      
      toast.success("Order submitted successfully!");
      navigate(`/confirmation/${orderId}`, { state: { orderId } });
    } catch (err: any) {
      console.error("CRITICAL SUBMISSION ERROR in PaymentDetailsPage:", err);
      let msg = "Order submission failed. Please try again.";
      if (err.message) {
        try {
          if (typeof err.message === 'string' && err.message.trim().startsWith('{')) {
            const parsed = JSON.parse(err.message);
            msg = parsed.error || msg;
            if (msg.includes('permission-denied')) {
              msg = "Permission denied. Our security shield blocked this request. This could be due to missing required data like your name or WhatsApp number.";
            }
          } else {
            msg = err.message;
          }
        } catch (parseErr) {
          console.warn("Error parsing error message:", parseErr);
          msg = err.message;
        }
      }
      setError(msg);
      toast.error("Checkout Failed", { description: msg });
    } finally {
      setIsSubmitting(false);
      console.log('PaymentDetailsPage submission cycle complete');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070708] py-20 px-4 transition-colors">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="bg-white dark:bg-[#0d0d0f] rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-gray-100 dark:border-white/5 overflow-hidden transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Summary */}
            <div className="p-10 md:p-12 bg-gray-50 dark:bg-white/5 border-r border-gray-100 dark:border-white/5">
                <h3 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">Order Summary</h3>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">{orderPayload.packageName}</h2>
                
                <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-gray-200 dark:border-white/10 pb-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Amount</span>
                        <span className="text-2xl font-black text-gray-900 dark:text-white">LKR {orderPayload.amount.toLocaleString()}</span>
                    </div>
                </div>

                <div className="mt-12 p-6 bg-white dark:bg-[#0d0d0f] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-4 text-emerald-500 mb-4">
                        <ShieldCheck className="h-6 w-6" />
                        <span className="text-xs font-black uppercase tracking-widest">Secure Checkout</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                        Your transaction is protected by our secure processing system. Once verified, your design will be delivered via WhatsApp within 24 hours.
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="p-10 md:p-12">
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8 uppercase tracking-tight">Payment Details</h2>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            {error}
                        </div>
                    )}
                    <div className="grid gap-3">
                        {[
                            { id: PaymentMethod.BANK, label: 'Bank Transfer', icon: Landmark },
                            { id: PaymentMethod.WHATSAPP, label: 'WhatsApp', icon: WhatsAppIcon },
                            { id: PaymentMethod.EZ_CASH, label: 'EZ Cash', icon: Smartphone }
                        ].map((method) => (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => setPaymentMethod(method.id)}
                                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                                    paymentMethod === method.id 
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400' 
                                    : 'border-gray-100 dark:border-white/5 text-gray-500'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <method.icon className="h-5 w-5" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{method.label}</span>
                                </div>
                                {paymentMethod === method.id && <CheckCircle2 className="h-4 w-4" />}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {paymentMethod !== PaymentMethod.WHATSAPP && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-6"
                            >
                                <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-2xl space-y-3">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Recipient Account</p>
                                    {paymentMethod === PaymentMethod.BANK ? (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[11px]"><span className="text-gray-500">Bank</span><span className="font-bold">{settings?.bankName}</span></div>
                                            <div className="flex justify-between text-[11px]"><span className="text-gray-500">Account</span><span className="font-bold">{settings?.bankAccountNumber}</span></div>
                                            <div className="flex justify-between text-[11px]"><span className="text-gray-500">Holder</span><span className="font-bold uppercase">{settings?.bankAccountHolder}</span></div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between text-[11px]"><span className="text-gray-500">Number</span><span className="font-bold">{settings?.ezCashNumber}</span></div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Upload Payment Proof</p>
                                    {!proofPreview ? (
                                        <label className="cursor-pointer block">
                                            <div className="w-full h-32 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 transition-colors">
                                                <Plus className="h-6 w-6 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attach Screenshot</span>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    ) : (
                                        <div className="relative rounded-2xl overflow-hidden border-2 border-blue-600 h-32">
                                            <img src={proofPreview} alt="Proof" className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => { setProofFile(null); setProofPreview(null); }}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isSubmitting}
                        type="submit"
                        className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-xl transition-all ${
                            isSubmitting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                        }`}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                        ) : (
                            <><Sparkles className="h-4 w-4" /> Complete Protocol <ArrowRight className="h-4 w-4" /></>
                        )}
                    </motion.button>
                </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
