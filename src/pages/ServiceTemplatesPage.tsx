import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getService, getServiceTemplates } from '../services/db';
import { Service, ServiceTemplate } from '../types';
import { Loader2, ArrowLeft, Image as ImageIcon, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function ServiceTemplatesPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!serviceId) return;
      const data = await getService(serviceId);
      setService(data);
      if (data) {
        const tpls = await getServiceTemplates(serviceId, true);
        setTemplates(tpls as ServiceTemplate[]);
      }
      setLoading(false);
    }
    fetchData();
  }, [serviceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070708] flex items-center justify-center transition-colors">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070708] flex flex-col items-center justify-center p-4 text-center transition-colors">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter transition-colors">SERVICE OFFLINE</h1>
        <button onClick={() => navigate('/')} className="px-10 py-5 primary-gradient text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl">
          RETURN TO HOME
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070708] font-sans pb-32 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.button 
          whileHover={{ x: -10 }}
          onClick={() => navigate(`/service/${serviceId}`)}
          className="inline-flex items-center text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-all group px-6 py-3 glass-card rounded-xl mb-12"
        >
          <ArrowLeft className="w-4 h-4 mr-3 group-hover:text-blue-500 transition-colors" />
          Service Details
        </motion.button>

        <div className="mb-20">
          <motion.h1 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter mb-6 uppercase transition-colors"
          >
            Design Layouts
          </motion.h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-black uppercase tracking-[0.3em] opacity-80">Select your preferred visual for {service.title}.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
          {templates.map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative glass-card rounded-[3rem] overflow-hidden border-gray-100 dark:border-white/5 shadow-3xl hover:border-blue-500/30 transition-all"
            >
              <div className="aspect-[16/9] w-full overflow-hidden relative bg-gray-100 dark:bg-[#0a0a0c]">
                {template.imageUrl ? (
                  <img 
                    src={template.imageUrl} 
                    alt={template.name} 
                    className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 dark:from-black via-transparent to-transparent opacity-60" />
              </div>
              <div className="p-10 flex flex-col sm:flex-row items-center justify-between gap-8">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter transition-all">{template.name}</h3>
                  <p className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest mt-2">{service.title} Protocol</p>
                </div>
                <button 
                  onClick={() => navigate(`/service-checkout/${serviceId}/${template.id}?name=${encodeURIComponent(template.name)}`)}
                  className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white font-black flex items-center justify-center rounded-2xl uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl group/btn"
                >
                  Select <Sparkles className="w-5 h-5 ml-4 group-hover/btn:rotate-45 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
