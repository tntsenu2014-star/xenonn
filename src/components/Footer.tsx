import { Heart, HelpCircle, Headphones, FileText, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getSettings } from '../services/db';
import { Settings } from '../types';

export default function Footer() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const whatsappLink = settings?.whatsappNumber 
    ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`
    : '#';
  return (
    <footer className="bg-[#0a0a0c] border-t border-[#1a1a1f] py-20 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20 text-left">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="https://i.postimg.cc/52SjYFLk/lo.png" alt="Logo" className="w-10 h-10 object-contain" />
              <h3 className="text-3xl font-black italic uppercase italic tracking-tighter text-white">
                 GAMING <span className="text-blue-600">R4D</span>
              </h3>
            </div>
            <p className="text-gray-500 max-w-sm font-medium leading-relaxed mb-6">
              The ultimate destination for instant gaming top-ups. We provide the safest and fastest service for gamers worldwide.
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-6">Support</h4>
            <ul className="space-y-4">
              <li>
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium text-gray-500 hover:text-blue-500 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-600/10 transition-colors">
                    <HelpCircle className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <span>Help Center</span>
                </a>
              </li>
              <li>
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium text-gray-500 hover:text-blue-500 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-600/10 transition-colors">
                    <Headphones className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <span>Contact Us</span>
                </a>
              </li>
              <li>
                <Link to="/terms" className="flex items-center gap-3 text-sm font-medium text-gray-500 hover:text-blue-500 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-600/10 transition-colors">
                    <FileText className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <span>Terms of Service</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
             <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-6">Community</h4>
             <ul className="space-y-4">
              <li>
                <a href="https://whatsapp.com/channel/0029Vb7vjh3C6ZvqTk1Hoi1L" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium text-gray-500 hover:text-blue-500 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-emerald-600/10 transition-colors">
                    <MessageCircle className="w-4 h-4 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <span>WhatsApp Channel</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1a1a1f] pt-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs font-black uppercase tracking-widest text-gray-600">
            &copy; {new Date().getFullYear()} GAMING R4D. STORE OPERATED WORLDWIDE.
          </p>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center">
            <span>Powered by</span>
            <Heart className="h-2.5 w-2.5 text-blue-600 fill-current mx-2 animate-pulse" />
            <span>GAMER PRIDE</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
