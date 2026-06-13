import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PaymentMethod, Order, Settings, OrderStatus } from '../types';
import { CheckCircle2, Landmark, MessageSquare, Upload, ArrowLeft, ExternalLink, Loader2, Smartphone, AlertCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, storage } from '../lib/firebase';
import { doc, onSnapshot, updateDoc } from '../lib/firestore-compat';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getSettings } from '../services/db';
import { toast } from 'sonner';
import WhatsAppIcon from '../components/WhatsAppIcon';

export default function ConfirmationPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    async function initSettings() {
      try {
        const settingsData = await getSettings();
        setSettings(settingsData);
      } catch (err) {
        console.error(err);
      }
    }
    initSettings();
  }, []);

  useEffect(() => {
    if (!orderId) return;
    
    // Determine which collection to look in
    const isAccountOrder = orderId.startsWith('acc_');
    const actualOrderId = isAccountOrder ? orderId.replace('acc_', '') : orderId;
    const collectionName = isAccountOrder ? 'accountOrders' : 'orders';

    console.log(`ConfirmationPage: Fetching order from ${collectionName} with ID ${actualOrderId}`);

    // Fetch initial order and listen for updates
    const unsubscribe = onSnapshot(doc(db, collectionName, actualOrderId), (snapshot) => {
      if (snapshot.exists()) {
        const orderData = { id: snapshot.id, ...snapshot.data() } as Order;
        setOrder(orderData);
        if (orderData.paymentProofUrl) {
          setUploadSuccess(true);
        }
      } else {
        console.warn(`Order ${actualOrderId} not found in ${collectionName}`);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching order:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 2 * 1024 * 1024) {
        toast.error("File too large", { description: "Maximum size is 2MB" });
        return;
      }
      setFile(selectedFile);
      setUploadError(null);
    }
  };

  const submitProof = async () => {
    if (!orderId || !file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      // Direct Storage Upload
      const storageRef = ref(storage, `receipts/${orderId}_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update Firestore with the URL
      const isAccountOrder = orderId.startsWith('acc_');
      const actualOrderId = isAccountOrder ? orderId.replace('acc_', '') : orderId;
      const collectionName = isAccountOrder ? 'accountOrders' : 'orders';

      await updateDoc(doc(db, collectionName, actualOrderId), {
        paymentProofUrl: downloadURL,
        updatedAt: new Date().toISOString()
      });

      setUploadSuccess(true);
      setFile(null);
      toast.success("Payment proof uploaded!");
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload proof. Please try again.");
      toast.error("Upload failed", { description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const generateWhatsAppLink = () => {
    if (!settings || !order) return '#';
    const cleanNumber = settings.whatsappNumber.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello Admin, I have placed an order.\n\n` +
      `Order ID: ${orderId}\n` +
      `Package: ${order.packageName}\n` +
      `Price: LKR ${order.amount.toLocaleString()}\n` +
      `Player ID: ${order.userId}\n\n` +
      `Please process my order. Thank you!`
    );
    return `https://wa.me/${cleanNumber}?text=${text}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-[#070708] transition-colors">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-50 dark:bg-[#070708] transition-colors">
        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Order not found</h2>
        <p className="text-gray-500 mb-8 font-bold text-sm">The order you're looking for does not exist.</p>
        <Link to="/" className="inline-flex items-center px-10 py-5 primary-gradient text-white font-bold rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20">
          <ArrowLeft className="mr-3 h-4 w-4" /> Return to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 transition-colors duration-300 bg-slate-50 dark:bg-[#070708]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pending Confirmation Overlay */}
        <AnimatePresence>
          {uploadSuccess && order.status === OrderStatus.PENDING && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-[#070708]/80 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#0d0d0f] max-w-sm sm:max-w-md w-full rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-12 shadow-2xl flex flex-col items-center text-center relative overflow-hidden border border-gray-100 dark:border-white/5 transition-colors"
              >
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl z-0 pointer-events-none" />
                
                <div className="relative z-10 w-full mb-8 sm:mb-12 text-center">
                  <h3 className="text-blue-600 dark:text-blue-400 font-bold tracking-widest text-[9px] sm:text-[10px] mb-2 uppercase">Payment verification</h3>
                  <div className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">
                    {order.amount === 0 ? 'TBD' : `LKR ${order.amount.toLocaleString()}`}
                  </div>
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">Processing your order</p>
                </div>

                <div className="relative z-10 my-6 sm:my-10">
                   <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                      <div className="absolute inset-0 border-4 border-gray-50 dark:border-white/5 rounded-full" />
                      <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin shadow-[0_0_20px_rgba(37,99,235,0.2)]" />
                   </div>
                </div>

                <div className="relative z-10 mt-6 sm:mt-8 w-full text-center">
                  <p className="text-gray-900 dark:text-white font-bold tracking-wide uppercase text-[10px] sm:text-xs">
                     Waiting for administrator...
                     <br />
                     <span className="text-[9px] sm:text-[10px] text-gray-400 normal-case mt-2 block font-medium">Usual processing time: 2-5 Minutes</span>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Notification */}
        <AnimatePresence>
          {(order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.COMPLETED) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/90 dark:bg-[#070708]/90 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#0d0d0f] max-w-md w-full rounded-[3rem] p-12 shadow-2xl text-center relative overflow-hidden border border-gray-100 dark:border-white/5 transition-colors"
              >
                <div className="relative z-10">
                  <div className="mx-auto bg-blue-600 w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-blue-500/30">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Order Confirmed</h3>
                  <p className="text-gray-500 font-medium mb-10 text-sm leading-relaxed">
                    Your payment was verified successfully! Your top-up is now being processed.
                  </p>
                  <Link to="/" className="w-full inline-block bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest text-xs">
                    Return to home
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canceled Notification */}
        <AnimatePresence>
          {order.status === OrderStatus.CANCELED && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/90 dark:bg-[#070708]/90 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#0d0d0f] max-w-md w-full rounded-[3rem] p-12 shadow-2xl text-center relative overflow-hidden border border-gray-100 dark:border-white/5 transition-colors"
              >
                <div className="relative z-10">
                  <div className="mx-auto bg-red-50 dark:bg-red-500/10 w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 border border-red-100 dark:border-red-500/20">
                    <X className="h-12 w-12 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Order Cancelled</h3>
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 text-sm leading-relaxed">
                    This order was cancelled. If you believe this is an error, please contact our support team.
                  </p>
                  <a href={generateWhatsAppLink()} target="_blank" rel="noreferrer" className="w-full inline-flex items-center justify-center bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition uppercase tracking-widest text-xs">
                    <WhatsAppIcon className="h-5 w-5 mr-3" />
                    Contact support
                  </a>
                  <Link to="/" className="w-full inline-block mt-6 text-gray-400 font-bold py-2 uppercase tracking-widest text-[10px] hover:text-gray-900 dark:hover:text-white transition underline underline-offset-4 decoration-gray-200 dark:decoration-white/10">
                    Go to shop
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-[#0d0d0f] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 md:p-12 relative overflow-hidden shadow-2xl shadow-blue-500/5 border border-gray-100 dark:border-white/5 transition-colors duration-300"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent" />
        
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] ring-1 ring-emerald-100 dark:ring-emerald-500/20">
            <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight transition-colors">Order placed</h2>
        <p className="text-gray-400 mb-8 sm:mb-10 font-bold uppercase tracking-wider text-[10px] sm:text-xs">
          Order ID: <span className="text-blue-600 dark:text-blue-400 font-mono tracking-normal ml-2">{orderId}</span>
        </p>

        {order.paymentMethod === PaymentMethod.BANK || order.paymentMethod === PaymentMethod.EZ_CASH ? (
          <div className="text-left space-y-8 sm:space-y-10">
            <div className="bg-gray-50 dark:bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border border-gray-100 dark:border-white/5 relative overflow-hidden group transition-colors">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500 opacity-5 blur-3xl pointer-events-none" />
              
              <h3 className="flex items-center text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 relative z-10 transition-colors">
                {order.paymentMethod === PaymentMethod.EZ_CASH ? (
                  <Smartphone className="mr-3 sm:mr-4 h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                ) : (
                  <Landmark className="mr-3 sm:mr-4 h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                )}
                Payment Details
              </h3>
              
              <div className="space-y-4 sm:space-y-6 relative z-10">
                {order.paymentMethod === PaymentMethod.BANK ? (
                  <>
                    <div className="flex justify-between items-center py-3 sm:py-4 border-b border-gray-200/50 dark:border-white/5 transition-colors">
                      <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Bank</span>
                      <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{settings?.bankName || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 sm:py-4 border-b border-gray-200/50 dark:border-white/5 transition-colors">
                      <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Account Number</span>
                      <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 font-mono">{settings?.bankAccountNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 sm:py-4">
                      <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Account Holder</span>
                      <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{settings?.bankAccountHolder || '-'}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center py-3 sm:py-4 transition-colors">
                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">eZ Cash Number</span>
                    <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{settings?.ezCashNumber || '-'}</span>
                  </div>
                )}
              </div>

              <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200/50 dark:border-white/5 flex justify-between items-center relative z-10 transition-colors">
                <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Total Amount</span>
                <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                  LKR {order.amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0d0d0f] border-2 border-dashed border-gray-100 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-12 text-center group transition-colors">
              <h3 className="flex items-center justify-center text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 transition-colors">
                <Upload className="mr-3 sm:mr-4 h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                Upload payment proof
              </h3>
              
              {uploadSuccess && order.paymentProofUrl ? (
                <div className="space-y-6">
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-8 rounded-[2rem] flex flex-col items-center justify-center font-bold uppercase tracking-widest text-xs border border-emerald-100 dark:border-emerald-500/20 transition-colors">
                    <CheckCircle2 className="h-8 w-8 mb-3" />
                    Proof uploaded successfully
                  </div>
                  
                  <div className="relative group">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Your Receipt</p>
                    <div className="rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-white/5 shadow-xl bg-gray-50 dark:bg-white/5">
                      <img 
                        src={order.paymentProofUrl} 
                        alt="Submitted Proof" 
                        className="w-full h-auto max-h-[400px] object-contain p-4"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <button 
                      onClick={() => setUploadSuccess(false)}
                      className="w-full mt-4 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider hover:underline"
                    >
                      Change payment proof
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {uploadError && (
                    <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center border border-red-100 dark:border-red-500/20">
                      <AlertCircle className="h-4 w-4 mr-3" />
                      {uploadError}
                    </div>
                  )}

                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    className="hidden" 
                    id="proof-upload"
                    accept="image/*"
                  />
                  <label 
                    htmlFor="proof-upload"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-8 sm:p-12 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all group"
                  >
                    {file ? (
                      <div className="relative w-full max-w-[200px] aspect-[3/4] rounded-xl overflow-hidden shadow-lg mb-4">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="text-white h-8 w-8" onClick={(e) => { e.preventDefault(); setFile(null); }} />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 dark:bg-white/5 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-white dark:group-hover:bg-white/10 transition-colors">
                        <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300 dark:text-gray-700 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                      </div>
                    )}
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-center px-4 line-clamp-1">
                      {file ? file.name : 'Choose payment slip'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">Max size: 2MB</span>
                  </label>

                  <button
                    onClick={submitProof}
                    disabled={!file || isUploading}
                    className="w-full h-14 sm:h-20 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-bold uppercase tracking-widest text-[10px] sm:text-xs disabled:opacity-30 transition-all shadow-xl shadow-blue-500/20 hover:bg-blue-700 flex items-center justify-center group overflow-hidden"
                  >
                    {isUploading ? (
                      <Loader2 className="animate-spin h-6 w-6 sm:h-8 sm:w-8" />
                    ) : (
                      <>
                        <span>Submit Proof</span>
                        <Send className="ml-3 sm:ml-4 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-left space-y-8">
            <div className="bg-white dark:bg-[#0d0d0f] rounded-[2rem] p-12 text-center border border-gray-100 dark:border-white/5 shadow-xl shadow-emerald-500/5 relative overflow-hidden transition-colors">
              <div className="absolute top-0 left-0 w-full h-full bg-emerald-500 opacity-5 blur-3xl pointer-events-none" />
              
              <h3 className="flex items-center justify-center text-2xl font-bold text-gray-900 dark:text-white mb-6 relative z-10 font-sans transition-colors">
                <MessageSquare className="mr-4 h-8 w-8 text-emerald-600 transition-colors" />
                Contact us on WhatsApp
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-10 font-medium leading-relaxed relative z-10">To complete your order, please click below to send us your receipt on WhatsApp. Our team will verify and process it instantly.</p>
              
              <motion.a
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                href={generateWhatsAppLink()}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center h-20 bg-emerald-600 text-white font-bold rounded-2xl uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 relative z-10"
              >
                <WhatsAppIcon className="h-6 w-6 mr-4" />
                Send to WhatsApp
                <ExternalLink className="ml-4 h-4 w-4 opacity-50" />
              </motion.a>
            </div>
          </div>
        )}

        <div className="mt-14 flex justify-center">
          <Link to="/" className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 dark:hover:text-blue-400 transition-all group">
            <ArrowLeft className="mr-3 h-4 w-4 group-hover:-translate-x-2 transition-transform" />
            Back to store
          </Link>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
