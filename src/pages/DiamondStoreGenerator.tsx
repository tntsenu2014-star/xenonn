import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DiamondStoreGenerator() {
  const navigate = useNavigate();
  const [characterPreview, setCharacterPreview] = useState('');

  const handleCharacterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const previewUrl = selectedOption.getAttribute('data-preview');
    setCharacterPreview(previewUrl || '');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const details = Object.fromEntries(formData.entries());

    const orderPayload = {
      packageId: "design-diamond",
      packageName: "Diamond Store Generator",
      diamonds: 0,
      customerName: details.store_name?.toString() || "Guest",
      customerPhone: details.whatsapp_number?.toString() || "",
      userId: "design_request",
      amount: 250,
      adminNotes: JSON.stringify(details, null, 2)
    };

    navigate('/payment-details', { state: { orderPayload } });
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 font-sans select-none">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Banner */}
        <div 
          className="bg-cover bg-center py-16 px-5 text-center text-white rounded-b-2xl mb-8"
          style={{ backgroundImage: "url('https://dl.dir.freefiremobile.com/common/web_event/official2.ff.garena.all/202210/768671f1dc8d3c0a8f2448cf5ed6739c.jpg')" }}
        >
          <h1 className="font-bold text-3xl md:text-4xl drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">
            Create Your Diamond Store Post
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 md:p-8">
          <div className="mb-8 p-5 bg-gray-50 rounded-lg text-center">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">This is the design template you'll be customizing:</h3>
            <p className="text-gray-500 text-sm mb-4">Your chosen character and colors will be applied to a base image like this, and your details will be filled in.</p>
            <img 
              src="https://i.postimg.cc/cHBXGJZb/diamondstore.jpg"
              alt="Design Template Preview"
              className="max-w-full h-auto border border-gray-200 rounded-lg shadow-sm mx-auto max-h-[500px] object-contain"
            />
          </div>

          <form onSubmit={handleSubmit}>
            
            {/* Basic Information */}
            <div className="bg-gray-50 p-5 rounded-lg mb-6">
              <h4 className="mb-4 pb-2 border-b border-gray-200 text-gray-700 font-semibold text-lg">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="store_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Diamond Store Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="store_name" 
                    name="store_name" 
                    required 
                    maxLength={15} 
                    title="Maximum 15 characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  />
                </div>
                <div>
                  <label htmlFor="whatsapp_number" className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="tel" 
                    id="whatsapp_number" 
                    name="whatsapp_number" 
                    pattern="[0-9]{10}" 
                    title="Exactly 10 digits required (e.g., 0771234567). No spaces or other characters." 
                    required 
                    minLength={10} 
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Design Choices */}
            <div className="bg-gray-50 p-5 rounded-lg mb-6">
              <h4 className="mb-4 pb-2 border-b border-gray-200 text-gray-700 font-semibold text-lg">Design Choices</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="color_theme" className="block text-sm font-medium text-gray-700 mb-1">
                    Color Theme <span className="text-red-500">*</span>
                  </label>
                  <select 
                    id="color_theme" 
                    name="color_theme" 
                    required
                    defaultValue=""
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  >
                    <option value="" disabled>Select Color</option>
                    <option value="RED">Red</option>
                    <option value="BLUE">Blue</option>
                    <option value="GREEN">Green</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="character_image" className="block text-sm font-medium text-gray-700 mb-1">
                    Character Image <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <select 
                      id="character_image" 
                      name="character_image" 
                      required
                      defaultValue=""
                      onChange={handleCharacterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 flex-1"
                    >
                      <option value="" data-preview="" disabled>Select Character</option>
                      <option value="C1" data-preview="https://i.postimg.cc/BvmYZ740/uft6.png">Character 1</option>
                      <option value="C2" data-preview="https://i.postimg.cc/1XQNkP25/ehrft.png">Character 2</option>
                      <option value="C3" data-preview="https://i.postimg.cc/26F5BW9r/fru.png">Character 3</option>
                    </select>
                    {characterPreview && (
                      <img 
                        src={characterPreview} 
                        alt="Preview" 
                        className="w-[40px] h-[40px] object-contain ml-3 border border-gray-300 p-0.5 bg-white mb-2 rounded"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Membership Prices */}
            <div className="bg-gray-50 p-5 rounded-lg mb-6">
              <h4 className="mb-4 pb-2 border-b border-gray-200 text-gray-700 font-semibold text-lg">
                Membership Prices (LKR) <span className="text-red-500">*</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { id: 'price_weekly_lite', label: 'Weekly Lite Membership' },
                  { id: 'price_weekly', label: 'Weekly Membership' },
                  { id: 'price_monthly', label: 'Monthly Membership' },
                  { id: 'price_vip', label: 'VIP Membership' },
                  { id: 'price_super_vip', label: 'Super VIP Membership' },
                ].map((item) => (
                  <div key={item.id}>
                    <label htmlFor={item.id} className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      id={item.id} 
                      name={item.id} 
                      placeholder="e.g., 100" 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (parseFloat(e.target.value) < 0) e.target.value = '';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Diamond Prices */}
            <div className="bg-gray-50 p-5 rounded-lg mb-6">
              <h4 className="mb-4 pb-2 border-b border-gray-200 text-gray-700 font-semibold text-lg">
                Diamond Prices (LKR) <span className="text-red-500">*</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'price_dm_25', label: '25 Diamonds' },
                  { id: 'price_dm_50', label: '50 Diamonds' },
                  { id: 'price_dm_100', label: '100 Diamonds' },
                  { id: 'price_dm_200', label: '200 Diamonds' },
                  { id: 'price_dm_310', label: '310 Diamonds' },
                  { id: 'price_dm_520', label: '520 Diamonds' },
                  { id: 'price_dm_830', label: '830 Diamonds' },
                  { id: 'price_dm_1060', label: '1,060 Diamonds' },
                  { id: 'price_dm_1580', label: '1,580 Diamonds' },
                  { id: 'price_dm_2180', label: '2,180 Diamonds' },
                  { id: 'price_dm_3240', label: '3,240 Diamonds' },
                  { id: 'price_dm_4300', label: '4,300 Diamonds' },
                  { id: 'price_dm_5600', label: '5,600 Diamonds' },
                  { id: 'price_dm_6660', label: '6,660 Diamonds' },
                  { id: 'price_dm_7720', label: '7,720 Diamonds' },
                  { id: 'price_dm_10060', label: '10,060 Diamonds' },
                ].map((item) => (
                  <div key={item.id}>
                    <label htmlFor={item.id} className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      id={item.id} 
                      name={item.id} 
                      placeholder="e.g., 50" 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (parseFloat(e.target.value) < 0) e.target.value = '';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* EVO Access Prices */}
            <div className="bg-gray-50 p-5 rounded-lg mb-6">
              <h4 className="mb-4 pb-2 border-b border-gray-200 text-gray-700 font-semibold text-lg">
                EVO Access Prices (LKR) <span className="text-red-500">*</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'price_evo_3day', label: '3-Day EVO Access' },
                  { id: 'price_evo_7day', label: '7-Day EVO Access' },
                  { id: 'price_evo_30day', label: '30-Day EVO Access' },
                ].map((item) => (
                  <div key={item.id}>
                    <label htmlFor={item.id} className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      id={item.id} 
                      name={item.id} 
                      placeholder="e.g., 150" 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (parseFloat(e.target.value) < 0) e.target.value = '';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* LevelUP Pass Prices */}
            <div className="bg-gray-50 p-5 rounded-lg mb-6">
              <h4 className="mb-4 pb-2 border-b border-gray-200 text-gray-700 font-semibold text-lg">
                LevelUP Pass Prices (LKR) <span className="text-red-500">*</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { id: 'price_lvl_6', label: 'LevelUP Pass 6' },
                  { id: 'price_lvl_10', label: 'LevelUP Pass 10' },
                  { id: 'price_lvl_15', label: 'LevelUP Pass 15' },
                  { id: 'price_lvl_20', label: 'LevelUP Pass 20' },
                  { id: 'price_lvl_25', label: 'LevelUP Pass 25' },
                  { id: 'price_lvl_30', label: 'LevelUP Pass 30' },
                ].map((item) => (
                  <div key={item.id}>
                    <label htmlFor={item.id} className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      id={item.id} 
                      name={item.id} 
                      placeholder="e.g., 200" 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (parseFloat(e.target.value) < 0) e.target.value = '';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 mb-4 max-w-md mx-auto">
              <button 
                type="submit" 
                className="w-full bg-[#0d6efd] hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-lg transition-colors shadow-sm"
              >
                Proceed to Payment (LKR 250.00)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
