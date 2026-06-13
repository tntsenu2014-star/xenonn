import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { Save, Landmark, MessageCircle, Globe, Loader2, Smartphone } from 'lucide-react';
import { getSettings, updateSettings } from '../../services/db';
import { Settings } from '../../types';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    siteName: 'GAMING R4D Store',
    contactEmail: 'support@gamingr4d.com',
    bankName: 'BCA',
    bankAccountNumber: '',
    bankAccountHolder: '',
    whatsappNumber: '',
    ezCashNumber: '',
    payhereMerchantId: '',
    payhereAppId: '4OVycRgdhCK4JH5EsQZ3tF3D2',
    payhereAppSecret: '4qDMpH2CPtW8Rjoa4k5wTJ4PUmxrI1q4r4kmgcLsTsXA',
    isPayhereEnabled: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSettings();
      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data,
          // Keep the provided credentials if they are not in DB yet
          payhereAppId: data.payhereAppId || '4OVycRgdhCK4JH5EsQZ3tF3D2',
          payhereAppSecret: data.payhereAppSecret || '4qDMpH2CPtW8Rjoa4k5wTJ4PUmxrI1q4r4kmgcLsTsXA',
        }));
      }
    } catch (err: any) {
      console.error(err);
      try {
        const parsed = JSON.parse(err.message);
        setError(parsed.error || "Permission denied");
      } catch {
        setError("Failed to fetch settings. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
        <AdminSidebar />
        <div className="flex-grow flex items-center justify-center min-h-screen">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
      <AdminSidebar />
      <div className="flex-grow p-4 sm:p-8 overflow-x-hidden">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight">System Settings</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs mt-1">Configure your store information and payment details.</p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col sm:flex-row items-center text-red-600 font-sans max-w-4xl gap-4 sm:gap-0">
             <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center sm:mr-4 shrink-0">
               <Globe className="h-5 w-5 text-red-600" />
             </div>
             <div className="text-center sm:text-left">
               <p className="font-bold text-sm">Error Loading Settings</p>
               <p className="text-xs opacity-80">{error}</p>
             </div>
             <button 
              onClick={() => fetchData()}
              className="sm:ml-auto w-full sm:w-auto px-6 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors"
             >
               Retry
             </button>
          </div>
        )}

        <form onSubmit={handleSave} className="max-w-4xl space-y-6 sm:space-y-8 font-sans">
          {/* Site Settings */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h3 className="flex items-center text-lg sm:text-xl font-bold text-gray-900 mb-6 font-sans uppercase tracking-tight">
              <Globe className="mr-3 h-5 w-5 text-blue-600 shrink-0" />
              General Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Site Name</label>
                <input 
                  type="text" 
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none font-sans font-bold" 
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Support Email</label>
                <input 
                  type="email" 
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none font-sans font-bold" 
                  required
                />
              </div>
            </div>
          </section>

          {/* Bank Settings */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h3 className="flex items-center text-lg sm:text-xl font-bold text-gray-900 mb-6 font-sans uppercase tracking-tight">
              <Landmark className="mr-3 h-5 w-5 text-blue-600 shrink-0" />
              Bank Account Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 font-sans">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Bank Name</label>
                <input 
                  type="text" 
                  name="bankName"
                  value={settings.bankName}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none font-sans font-bold" 
                  required
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Account Number</label>
                <input 
                  type="text" 
                  name="bankAccountNumber"
                  value={settings.bankAccountNumber}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none font-sans font-bold" 
                  required
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Account Holder</label>
                <input 
                  type="text" 
                  name="bankAccountHolder"
                  value={settings.bankAccountHolder}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none font-sans font-bold" 
                  required
                />
              </div>
            </div>
          </section>

          {/* WhatsApp Settings */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h3 className="flex items-center text-lg sm:text-xl font-bold text-gray-900 mb-6 uppercase tracking-tight font-sans">
              <MessageCircle className="mr-3 h-5 w-5 text-green-600 shrink-0" />
              WhatsApp Configuration
            </h3>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Admin WhatsApp Number</label>
              <input 
                type="text" 
                name="whatsappNumber"
                value={settings.whatsappNumber}
                onChange={handleChange}
                placeholder="Ex: 6281234567890"
                className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-green-500 outline-none max-w-md font-sans font-bold" 
                required
              />
              <p className="mt-2 text-[10px] text-gray-400 font-bold tracking-tight italic font-sans uppercase">
                * Must include country code without "+" or "0" prefix (e.g., 62 for Indonesia).
              </p>
            </div>
          </section>

          {/* eZ Cash Settings */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h3 className="flex items-center text-lg sm:text-xl font-bold text-gray-900 mb-6 uppercase tracking-tight font-sans">
              <Smartphone className="mr-3 h-5 w-5 text-indigo-600 shrink-0" />
              eZ Cash Configuration
            </h3>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">eZ Cash Number</label>
              <input 
                type="text" 
                name="ezCashNumber"
                value={settings.ezCashNumber || ''}
                onChange={handleChange}
                placeholder="Ex: 0771234567"
                className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none max-w-md font-sans font-bold" 
                required
              />
              <p className="mt-2 text-[10px] text-gray-400 font-bold tracking-tight italic font-sans uppercase">
                * Enter the eZ Cash mobile number to display to customers.
              </p>
            </div>
          </section>

          {/* PayHere Settings */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h3 className="flex items-center text-lg sm:text-xl font-bold text-gray-900 uppercase tracking-tight font-sans">
                <Globe className="mr-3 h-5 w-5 text-blue-500 shrink-0" />
                PayHere Payment Gateway
              </h3>
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    name="isPayhereEnabled"
                    className="sr-only" 
                    checked={settings.isPayhereEnabled}
                    onChange={handleChange}
                  />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${settings.isPayhereEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.isPayhereEnabled ? 'translate-x-6' : ''}`}></div>
                </div>
                <div className="ml-3 text-gray-700 font-bold text-xs uppercase tracking-widest">
                  {settings.isPayhereEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </label>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Merchant ID</label>
                  <input 
                    type="text" 
                    name="payhereMerchantId"
                    value={settings.payhereMerchantId || ''}
                    onChange={handleChange}
                    placeholder="Enter your PayHere Merchant ID"
                    className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none font-sans font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">App ID</label>
                  <input 
                    type="text" 
                    name="payhereAppId"
                    value={settings.payhereAppId || ''}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none font-sans font-bold text-xs" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">App Secret</label>
                <input 
                  type="password" 
                  name="payhereAppSecret"
                  value={settings.payhereAppSecret || ''}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none font-sans font-bold text-xs" 
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-[10px] text-blue-700 font-bold uppercase tracking-widest leading-relaxed">
                  Tip: Secure your integration by ensuring the App Secret is kept confidential. For PayHere Checkout to work correctly, ensure your Merchant ID is also provided.
                </p>
              </div>
            </div>
          </section>

          <footer className="pt-4 flex justify-end font-sans">
            <button 
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 uppercase tracking-widest text-[10px] sm:text-xs disabled:opacity-50 font-sans"
            >
              {saving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="mr-2 h-5 w-5" />}
              Save All Changes
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
