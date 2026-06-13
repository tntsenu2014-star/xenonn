import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { User, onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const ADMIN_EMAILS = ['gamingremo2010@gmail.com', 'gamingremo201@gmail.com', 'surangisenanayaka700@gmail.com', 'bloovalk@gmail.com'];

export default function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Handle Email Link Sign-in
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
          })
          .catch((error) => {
            console.error('Error signing in with email link:', error);
            navigate('/admin/login');
          });
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email && ADMIN_EMAILS.includes(currentUser.email)) {
        setUser(currentUser);
      } else {
        setUser(null);
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          navigate('/admin/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return user ? <>{children}</> : null;
}
