import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getService, getServiceTemplates, createOrder, getSettings } from '../services/db';
import { Service, ServiceTemplate, PaymentMethod, Settings, OrderStatus } from '../types';
import { Loader2, ArrowLeft, CreditCard, MessageCircle, AlertCircle, Sparkles, ArrowRight, Smartphone, Landmark, Plus, X, CheckSquare } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../lib/UserContext';
import { storage, auth } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { initiatePayHerePayment } from '../lib/payhere';
import { updateOrderStatus } from '../services/db';

export default function ServiceCheckoutPage() {
  const { profile } = useUser();
  const { serviceId, templateId } = useParams();
  const [searchParams] = useSearchParams();
  const templateName = searchParams.get('name') || 'Custom Design';
  const navigate = useNavigate();
  
  const [service, setService] = useState<Service | null>(null);
  const [template, setTemplate] = useState<ServiceTemplate | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState(profile.customerName || '');
  const [whatsapp, setWhatsapp] = useState(profile.whatsappNumber || '');

  // Sync with profile when it loads
  useEffect(() => {
    if (profile.customerName) setName(profile.customerName);
    if (profile.whatsappNumber) setWhatsapp(profile.whatsappNumber);
  }, [profile]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!serviceId) return;
      
      try {
        const [serviceData, settingsData] = await Promise.all([
          getService(serviceId),
          getSettings()
        ]);
        
        setService(serviceData);
        setSettings(settingsData);
        
        if (serviceData && templateId) {
          const templates = await getServiceTemplates(serviceId);
          const selected = templates.find(t => t.id === templateId);
          if (selected) setTemplate(selected as ServiceTemplate);
        }
      } catch (err) {
        console.error("Error fetching checkout data:", err);
      }
      
      setLoading(false);
    }
    fetchData();
  }, [serviceId, templateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070708] flex items-center justify-center transition-colors">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070708] flex flex-col items-center justify-center p-4 transition-colors">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">Service unavailable</h1>
        <button onClick={() => navigate('/')} className="px-10 py-5 primary-gradient text-white font-bold rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20">
          Return to home
        </button>
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
    toast.success("Payment proof attached!");
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!name.trim() || !whatsapp.trim()) {
        throw new Error('Please enter your name and WhatsApp number.');
      }

      if ((paymentMethod === PaymentMethod.BANK || paymentMethod === PaymentMethod.EZ_CASH) && !proofFile) {
        throw new Error('Please upload your payment proof receipt.');
      }

      setIsSubmitting(true);
      
      let uploadedProofUrl = '';
      if (proofFile) {
        const storageRef = ref(storage, `receipts/${auth.currentUser?.uid || 'guest'}_${Date.now()}_${proofFile.name}`);
        const snapshot = await uploadBytes(storageRef, proofFile);
        uploadedProofUrl = await getDownloadURL(snapshot.ref);
      }

      // Prepare order payload including custom details
      const orderPayload: any = {
        packageId: service!.id,
        packageName: `${service!.title} • ${templateName}`,
        diamonds: 0,
        userId: auth.currentUser?.uid || `WA:${whatsapp}`,
        customerName: name,
        customerPhone: whatsapp,
        paymentMethod: paymentMethod,
        amount: template?.price || 0,
        adminNotes: JSON.stringify({
           type: 'DESIGN_REQUEST',
           service: service!.title,
           template: templateName,
           price: template?.price || 'NEGOTIABLE',
           user_name: name,
           user_wa: whatsapp,
           device_info: navigator.userAgent,
           timestamp: new Date().toISOString()
        })
      };

      if (uploadedProofUrl) {
        orderPayload.paymentProofUrl = uploadedProofUrl;
      }

      const orderId = await createOrder(orderPayload);

      // Handle PayHere specifically
      if (paymentMethod === PaymentMethod.PAYHERE) {
        initiatePayHerePayment({
          orderId,
          amount: template?.price || 0,
          customerName: name,
          customerPhone: whatsapp,
          packageName: `${service!.title} • ${templateName}`,
          onSuccess: async () => {
            try {
              await updateOrderStatus(orderId, OrderStatus.CONFIRMED, "Paid via PayHere");
              toast.success("Payment successful!");
              navigate(`/confirmation/${orderId}`, { replace: true });
            } catch (e) {
              console.error("Status update after payment failed:", e);
              navigate(`/confirmation/${orderId}`, { replace: true });
            }
          },
          onCancel: () => {
            toast.info("Payment cancelled.");
            navigate(`/confirmation/${orderId}`, { replace: true });
          },
          onError: (err) => {
            toast.error("Payment failed", { description: err });
            navigate(`/confirmation/${orderId}`, { replace: true });
          }
        });
        return;
      }

      // WhatsApp Redirect if applicable
      if (paymentMethod === PaymentMethod.WHATSAPP && settings?.whatsappNumber) {
        try {
          const whatsappMsg = `*NEW DESIGN REQUEST - ${settings.siteName || 'Store'}*\n\n` +
            `Order ID: #${orderId.slice(-6).toUpperCase()}\n` +
            `Service: ${service!.title}\n` +
            `Template: ${templateName}\n` +
            `Price: LKR ${template?.price || 'Negotiable'}\n` +
            `Customer: ${name}\n\n` +
            `Please confirm my design request!`;
          const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`;
          window.open(whatsappUrl, '_blank');
        } catch (waErr) {
          console.error("WhatsApp redirect failed:", waErr);
        }
      }

      toast.success("Design request submitted successfully!");
      navigate(`/confirmation/${orderId}`, { 
        replace: true,
        state: { 
          orderId,
          order: {
            id: orderId,
            packageName: `${service!.title} • ${templateName}`,
            amount: template?.price || 0,
            paymentMethod
          }
        }
      });

    } catch (err: any) {
      setError(err.message || 'Transmission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen font-sans pb-32 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.button 
          whileHover={{ x: -10 }}
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-all group mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-3 group-hover:text-blue-600 transition-colors" />
          Back to templates
        </motion.button>

        <div className="bg-white dark:bg-[#0d0d0f] rounded-[3rem] shadow-2xl shadow-blue-500/5 border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col lg:flex-row transition-colors">
          {/* Left panel - Order Summary */}
          <div className="w-full lg:w-2/5 bg-gray-50 dark:bg-white/5 p-10 md:p-14 border-r border-gray-100 dark:border-white/5 flex flex-col justify-between relative overflow-hidden transition-colors">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-5 blur-[100px] pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-4">Selection Summary</h2>
              <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-10 text-gray-900 dark:text-white">{service.title}</h3>
              
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-gray-200/50 dark:border-white/10 pb-6 group">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Selected Item</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{templateName}</span>
                </div>
                <div className="flex justify-between items-end border-b border-gray-200/50 dark:border-white/10 pb-6">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Base Category</span>
                  <span className="text-gray-900 dark:text-gray-200 font-bold uppercase tracking-widest text-xs">Standard Design</span>
                </div>
              </div>
            </div>
            
            <div className="mt-16 bg-white dark:bg-[#0d0d0f] border border-gray-100 dark:border-white/5 rounded-[2rem] p-8 relative z-10 shadow-sm transition-colors">
              <Sparkles className="text-blue-600 dark:text-blue-400 w-10 h-10 mb-6" />
              <p className="text-gray-500 dark:text-gray-400 font-medium text-xs leading-relaxed">
                Our support team will contact you via WhatsApp to discuss details and finalize the pricing for your custom design.
              </p>
            </div>
          </div>

          {/* Right panel - Form */}
          <div className="w-full lg:w-3/5 p-10 md:p-14 bg-white dark:bg-[#0d0d0f]">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-12 tracking-tight">Enter your details</h1>
            
            <form onSubmit={handleCheckout} className="space-y-10">
              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-6 rounded-2xl flex items-center text-xs font-bold uppercase tracking-widest border border-red-100 dark:border-red-500/20 shadow-sm">
                  <AlertCircle className="w-5 h-5 mr-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-8">
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.15em] mb-4 group-focus-within:text-blue-600 transition-colors">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-6 font-bold text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-white/10 transition-all placeholder:text-gray-400"
                    required
                  />
                </div>

                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.15em] mb-4 group-focus-within:text-emerald-600 transition-colors">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+94 000 000 000"
                    className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-6 font-bold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-white/10 transition-all placeholder:text-gray-400"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-wider">This number will be used to send delivery updates.</p>
                </div>
              </div>

              <div className="space-y-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">Payment Method</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: PaymentMethod.BANK, label: 'Bank', icon: Landmark, color: 'blue', show: true },
                    { id: PaymentMethod.WHATSAPP, label: 'WhatsApp', icon: WhatsAppIcon, color: 'emerald', show: true },
                    { id: PaymentMethod.EZ_CASH, label: 'eZ Cash', icon: Smartphone, color: 'indigo', show: true },
                    { id: PaymentMethod.PAYHERE, label: 'Card / Online', icon: CreditCard, color: 'blue', show: settings?.isPayhereEnabled }
                  ].filter(m => m.show !== false).map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method.id);
                        if (method.id === PaymentMethod.WHATSAPP || method.id === PaymentMethod.PAYHERE) { setProofFile(null); setProofPreview(null); }
                      }}
                      className={`relative flex items-center p-5 border rounded-2xl transition-all group ${
                        paymentMethod === method.id 
                          ? `border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm` 
                          : 'border-gray-100 dark:border-white/10 bg-white dark:bg-[#0d0d0f] text-gray-600 dark:text-gray-400 hover:border-blue-200 dark:hover:border-blue-900'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 shrink-0 transition-transform group-hover:scale-105 ${
                        paymentMethod === method.id ? `bg-blue-600 text-white` : 'bg-gray-50 dark:bg-white/5 text-gray-400'
                      }`}>
                        <method.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0 pr-6">
                        <div className="font-bold text-xs uppercase tracking-wider">{method.label}</div>
                      </div>
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
                      <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Our Payment Details</p>
                            {paymentMethod === PaymentMethod.BANK ? (
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500 font-bold uppercase tracking-tighter">Bank</span>
                                  <span className="text-gray-900 dark:text-white font-black">{settings?.bankName || 'Loading...'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500 font-bold uppercase tracking-tighter">Number</span>
                                  <span className="text-gray-900 dark:text-white font-black">{settings?.bankAccountNumber || 'Loading...'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500 font-bold uppercase tracking-tighter">Holder</span>
                                  <span className="text-gray-900 dark:text-white font-black uppercase text-[10px]">{settings?.bankAccountHolder || 'Loading...'}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500 font-bold uppercase tracking-tighter">EZ Cash Number</span>
                                <span className="text-gray-900 dark:text-white font-black">{settings?.ezCashNumber || 'Loading...'}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upload Payment Proof</p>
                             {!proofPreview ? (
                               <label className="relative group cursor-pointer block">
                                 <div className="w-full h-24 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center space-y-2 group-hover:border-blue-400 transition-colors bg-white dark:bg-transparent">
                                   <Plus className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                   <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Attach Screenshot</span>
                                 </div>
                                 <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                               </label>
                             ) : (
                               <div className="relative group">
                                 <div className="w-full h-24 rounded-2xl overflow-hidden border-2 border-blue-600">
                                   <img src={proofPreview} alt="Proof" className="w-full h-full object-cover" />
                                 </div>
                                 <button 
                                   onClick={() => { setProofFile(null); setProofPreview(null); }}
                                   className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-lg shadow-lg"
                                 >
                                   <X className="h-4 w-4" />
                                 </button>
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-8">
                <motion.button
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full h-18 rounded-[2rem] font-black uppercase tracking-[0.25em] text-[10px] transition-all shadow-2xl flex items-center justify-center group overflow-hidden ${
                    isSubmitting 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                      : 'bg-indigo-600 text-white hover:bg-black shadow-indigo-600/25 hover:shadow-black/20'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-4">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="italic">Broadcasting Signal...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 relative z-10">
                      <Sparkles className="h-5 w-5 md:group-hover:rotate-12 transition-transform" />
                      <span>Confirm Design Request</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </div>
                  )}
                </motion.button>

                <div className="mt-4 text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                    By proceeding, you agree to our <Link to="/terms" className="text-blue-500 hover:underline">Terms & Conditions</Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
