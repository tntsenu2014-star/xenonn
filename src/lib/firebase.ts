import { getFirestore } from './firestore-compat';

// === firebase/app Mock ===
export function initializeApp(config?: any) {
  return { name: 'mock-firebase-app', config };
}

// === firebase/auth Mock ===
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous?: boolean;
  tenantId?: string | null;
  providerData?: {
    providerId: string;
    email: string | null;
  }[];
}

let currentMockUser: User | null = null;
const authListeners = new Set<(user: User | null) => void>();

// Read initial auth state from localStorage
try {
  const stored = localStorage.getItem('authUser');
  if (stored) {
    currentMockUser = JSON.parse(stored);
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (urlParams.get('apiKey') === 'mock-magic-link' && emailParam) {
      currentMockUser = {
        uid: 'user_' + emailParam.replace(/[^a-zA-Z0-9]/g, '_'),
        email: emailParam,
        displayName: emailParam.split('@')[0],
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100',
        emailVerified: true,
        providerData: [{ providerId: 'email', email: emailParam }]
      };
      localStorage.setItem('authUser', JSON.stringify(currentMockUser));
    }
  }
} catch (e) {
  console.error("Local storage auth read failed:", e);
}

export const auth = {
  get currentUser() {
    return currentMockUser;
  },
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(this, callback);
  }
};

export function getAuth(app?: any) {
  return auth;
}

export function onAuthStateChanged(authInstance: any, callback: (user: User | null) => void) {
  authListeners.add(callback);
  // Immediate trigger
  callback(currentMockUser);
  return () => {
    authListeners.delete(callback);
  };
}

export class GoogleAuthProvider {
  // Empty mock class
}

export async function signInWithPopup(authInstance: any, provider?: any) {
  let email = "bloovalk@gmail.com";
  try {
    const prompted = window.prompt("Simulated Google Sign-In\nEnter your email:", currentMockUser?.email || "bloovalk@gmail.com");
    if (prompted) {
      email = prompted;
    }
  } catch (e) {
    console.warn("window.prompt not supported/blocked, using default:", e);
  }
  
  const user: User = {
    uid: 'user_' + email.replace(/[^a-zA-Z0-9]/g, '_'),
    email: email,
    displayName: email.split('@')[0],
    photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100",
    emailVerified: true,
    providerData: [{ providerId: 'google.com', email }]
  };
  
  currentMockUser = user;
  localStorage.setItem('authUser', JSON.stringify(user));
  authListeners.forEach(listener => listener(user));
  
  return { user };
}

export async function signOut(authInstance: any) {
  currentMockUser = null;
  localStorage.removeItem('authUser');
  authListeners.forEach(listener => listener(null));
}

export function isSignInWithEmailLink(authInstance: any, url: string) {
  return url.includes('apiKey=mock-magic-link');
}

export async function sendSignInLinkToEmail(authInstance: any, email: string, actionCodeSettings: any) {
  localStorage.setItem('emailForSignIn', email);
  setTimeout(() => {
    let confirmation = true;
    try {
      confirmation = window.confirm(`[SIMULATOR] Magic Link requested for: ${email}\n\nWould you like to simulate clicking this login email link?`);
    } catch (e) {
      console.warn("window.confirm blocked or not supported:", e);
    }
    if (confirmation) {
      window.location.href = `${actionCodeSettings.url}?apiKey=mock-magic-link&email=${encodeURIComponent(email)}`;
    }
  }, 800);
  return true;
}

export async function signInWithEmailLink(authInstance: any, email: string, url: string) {
  const user: User = {
    uid: 'user_' + email.replace(/[^a-zA-Z0-9]/g, '_'),
    email: email,
    displayName: email.split('@')[0],
    photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100",
    emailVerified: true,
    providerData: [{ providerId: 'email', email }]
  };
  
  currentMockUser = user;
  localStorage.setItem('authUser', JSON.stringify(user));
  authListeners.forEach(listener => listener(user));
  
  return { user };
}

// === firebase/storage Mock ===
export function getStorage(app?: any) {
  return { type: 'mock-storage' };
}

export const storage = getStorage();

export function ref(storageInstance: any, path: string) {
  return { type: 'storage-ref', path, downloadURL: '' };
}

export async function uploadBytes(storageRef: any, file: File) {
  return new Promise<{ ref: any }>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const rawBase64 = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || 'image/jpeg',
            data: rawBase64
          })
        });
        
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        const result = await res.json();
        
        resolve({
          ref: {
            ...storageRef,
            downloadURL: result.url
          }
        });
      } catch (err) {
        console.error("Upload mock failed:", err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
  });
}

export async function getDownloadURL(storageRef: any): Promise<string> {
  return storageRef.downloadURL || '';
}

// === firebase/firestore Integration Bridge ===
export const db = getFirestore();
