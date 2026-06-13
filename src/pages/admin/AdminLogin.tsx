import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, Mail, X } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../../lib/firebase';
import { sendSignInLinkToEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      setError('Google Sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/admin`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setSent(true);
    } catch (err: any) {
      console.error(err);
      setError('Failed to send login link. Please check your email.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px-136px)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white border border-gray-100 rounded-3xl p-10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-gray-50 rounded-2xl mb-4">
            <img src="https://i.postimg.cc/52SjYFLk/lo.png" alt="Logo" className="h-12 w-12 object-contain" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 font-sans">Admin Portal</h2>
          <p className="text-gray-500 font-medium mt-1 font-sans">Sign in to manage your diamond store.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold mb-6 flex items-center animate-shake font-sans">
            <X className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full h-14 bg-white border-2 border-gray-100 text-gray-700 font-bold rounded-2xl transition-all hover:bg-gray-50 flex items-center justify-center space-x-3 font-sans disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">or magic link</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>
          
          {sent ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-bold mb-6 flex items-center font-sans">
              Check your email for the login magic link!
            </div>
          ) : (
            <div className="space-y-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full h-14 px-5 border-2 border-gray-100 rounded-2xl focus:border-blue-500 transition-all outline-none font-sans"
              />
              <button 
                onClick={handleEmailLogin}
                disabled={loading}
                className="group w-full h-14 bg-blue-600 text-white font-black rounded-2xl transition-all hover:bg-blue-700 uppercase tracking-widest flex items-center justify-center font-sans shadow-lg shadow-blue-100"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <Mail className="h-5 w-5 mr-2" />
                    <span>Send Magic Link</span>
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                Authorized access only. All actions are logged.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
