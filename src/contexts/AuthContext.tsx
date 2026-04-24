import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updatePassword as updateFirebasePassword,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        console.warn('Profile not found for UID:', userId);
        setProfile({ role: 'employee' });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile({ role: 'employee' });
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    await updateFirebasePassword(auth.currentUser, newPassword);
    
    // Clear needsPasswordChange flag
    const docRef = doc(db, 'profiles', auth.currentUser.uid);
    await updateDoc(docRef, { needsPasswordChange: false });
    await fetchProfile(auth.currentUser.uid);
  };

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass.trim());
  };

  const register = async (email: string, pass: string, name: string) => {
    const trimmedEmail = email.trim();
    const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, pass.trim());
    
    if (userCredential.user) {
      const profileData = {
        id: userCredential.user.uid,
        email: trimmedEmail,
        displayName: name,
        role: 'employee',
        needsPasswordChange: false,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'profiles', userCredential.user.uid), profileData);
      setProfile(profileData);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, login, register, logout, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
