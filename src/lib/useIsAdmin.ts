import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const ADMIN_EMAILS = ['gamingremo2010@gmail.com', 'gamingremo201@gmail.com', 'surangisenanayaka700@gmail.com', 'bloovalk@gmail.com'];

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { isAdmin, isLoading };
}
