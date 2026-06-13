import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AccountInfo {
  name: string;
  level: number;
  likes: number;
  region: string;
  uid: string;
  lastLogin: string;
}

export default function FreeFireAccountInfo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAccountInfo(null);
    
    // Simulate API call for player info
    setTimeout(() => {
      setLoading(false);
      setAccountInfo({
        name: 'NOVA TOPUP',
        level: 72,
        likes: 15430,
        region: 'SG',
        uid: playerId,
        lastLogin: new Date().toLocaleDateString()
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans pt-14 text-slate-800">
      {/* Background blobs */}
      <div 
        className="fixed top-[-20%] left-[-15%] w-[60vw] h-[60vw] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)',
          animation: 'blobDrift1 12s ease-in-out infinite alternate'
        }}
      ></div>
      <div 
        className="fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)',
          animation: 'blobDrift2 15s ease-in-out infinite alternate'
        }}
      ></div>
      <div 
        className="fixed top-[40%] right-[5%] w-[30vw] h-[30vw] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(147,197,253,0.08) 0%, transparent 70%)',
          animation: 'blobDrift3 10s ease-in-out infinite alternate'
        }}
      ></div>

      <style>{`
        @keyframes blobDrift1 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, 25px) scale(1.08); }
        }
        @keyframes blobDrift2 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-30px, -35px) scale(1.12); }
        }
        @keyframes blobDrift3 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-20px, 20px) scale(1.06); }
        }
        @keyframes cardEntrance {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ringPulse {
          0%, 100% { box-shadow: 0 6px 24px rgba(99, 102, 241, 0.38); }
          50%      { box-shadow: 0 6px 36px rgba(99, 102, 241, 0.55), 0 0 0 10px rgba(99, 102, 241, 0.07); }
        }
      `}</style>

      <div className="container mx-auto py-12 px-4 relative z-10 flex justify-center items-center h-full min-h-[80vh]">
        <div className="w-full max-w-lg">
          <div 
            className="bg-white border border-blue-500/20 rounded-3xl p-6 md:p-10 opacity-0 translate-y-8"
            style={{
              boxShadow: '0 4px 6px rgba(59, 130, 246, 0.04), 0 12px 40px rgba(59, 130, 246, 0.10), 0 30px 80px rgba(99, 102, 241, 0.08)',
              animation: 'cardEntrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                animation: 'ringPulse 3.5s ease-in-out infinite'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </div>

            <h1 className="text-center font-bold text-2xl mb-2 bg-clip-text text-transparent bg-gradient-to-br from-blue-600 to-indigo-600">
              Free Fire Account Info
            </h1>
            
            <p className="text-slate-500 text-center mb-6 text-sm">
              Enter a Player ID to view public account details.
            </p>



            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input 
                  type="text" 
                  className="w-full text-center border-2 border-blue-500/20 rounded-2xl py-3 px-4 text-base bg-white/95 transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none focus:bg-white placeholder-slate-400 tracking-wide"
                  id="player_id" 
                  name="player_id"
                  placeholder="Enter Player ID (UID)" 
                  required
                  pattern="\d{7,}" 
                  title="Player ID must be at least 7 digits."
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-0 rounded-full py-3 px-8 font-semibold text-base transition-all duration-250 shadow-[0_4px_18px_rgba(99,102,241,0.30)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(99,102,241,0.42)] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                )}
                <span>{loading ? 'Loading...' : 'Get Account Info'}</span>
              </button>
            </form>

            {accountInfo && (
              <div 
                className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm"
                style={{ animation: 'cardEntrance 0.5s ease-out forwards' }}
              >
                <div className="flex items-center justify-center mb-5">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-slate-800 text-xl">{accountInfo.name}</h3>
                </div>
                
                <div className="grid gap-3">
                  <div className="flex justify-between items-center border-b border-blue-100/60 pb-2">
                    <span className="text-slate-500 font-medium text-sm flex items-center">
                      <svg className="w-4 h-4 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                      Player ID
                    </span>
                    <span className="font-bold text-indigo-700">{accountInfo.uid}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-blue-100/60 pb-2">
                    <span className="text-slate-500 font-medium text-sm flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      Level
                    </span>
                    <span className="font-bold text-blue-700">{accountInfo.level}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-blue-100/60 pb-2">
                    <span className="text-slate-500 font-medium text-sm flex items-center">
                      <svg className="w-4 h-4 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                      Likes
                    </span>
                    <span className="font-bold text-slate-800">{accountInfo.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-blue-100/60 pb-2">
                    <span className="text-slate-500 font-medium text-sm flex items-center">
                      <svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Region
                    </span>
                    <span className="font-bold text-slate-800">{accountInfo.region}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium text-sm flex items-center">
                      <svg className="w-4 h-4 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Last Login
                    </span>
                    <span className="font-semibold text-slate-700">{accountInfo.lastLogin}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
