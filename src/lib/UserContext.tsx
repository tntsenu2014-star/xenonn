import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from './firestore-compat';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface UserProfile {
  playerId: string;
  whatsappNumber: string;
  customerName: string;
  email?: string;
  photoURL?: string;
}

interface UserContextType {
  user: User | null;
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : { playerId: '', whatsappNumber: '', customerName: '' };
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          // Try to fetch from Firestore first
          const docRef = doc(db, 'users', firebaseUser.uid);
          try {
            let docSnap;
            try {
              docSnap = await getDoc(docRef);
            } catch (err) {
              handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
              return;
            }
            
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
            } else {
              // If new user, initialize with whatever we have
              const initialProfile: UserProfile = {
                playerId: profile.playerId || '',
                whatsappNumber: profile.whatsappNumber || '',
                customerName: profile.customerName || firebaseUser.displayName || '',
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || ''
              };
              setProfile(initialProfile);
              try {
                await setDoc(docRef, initialProfile);
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
              }
            }
          } catch (err) {
            console.error("Error fetching user profile:", err);
            // Fallback to existing logic if Firestore fails
            setProfile(prev => ({
              ...prev,
              customerName: prev.customerName || firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || ''
            }));
          }
        }
      } catch (globalErr) {
        console.error("Global auth error:", globalErr);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    localStorage.setItem('userProfile', JSON.stringify(newProfile));

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), newProfile, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  };

  return (
    <UserContext.Provider value={{ user, profile, updateProfile, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
