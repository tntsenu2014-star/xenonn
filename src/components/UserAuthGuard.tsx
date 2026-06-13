import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

interface UserAuthGuardProps {
  children: React.ReactNode;
}

export default function UserAuthGuard({ children }: UserAuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        navigate(`/profile?redirect=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return user ? <>{children}</> : null;
}
