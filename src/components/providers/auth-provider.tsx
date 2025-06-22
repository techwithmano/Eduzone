"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import type { UserProfile as UserProfileType } from '@/lib/types';

type AuthContextType = {
  user: UserProfileType | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      // If there was a previous user snapshot listener, unsubscribe from it.
      if (unsubscribeUser) {
        unsubscribeUser();
      }

      if (authUser) {
        // User is signed in, set up a real-time listener for their data.
        const userDocRef = doc(db, 'users', authUser.uid);
        
        unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<UserProfileType, 'uid' | 'email' | 'displayName'>;
            setUser({
              uid: authUser.uid,
              email: authUser.email!,
              displayName: authUser.displayName,
              photoURL: authUser.photoURL,
              ...userData,
            } as UserProfileType);
          } else {
             // This case can happen if a user was created in auth but not in firestore
            setUser({
                uid: authUser.uid,
                email: authUser.email!,
                displayName: authUser.displayName,
                photoURL: authUser.photoURL,
            } as UserProfileType);
          }
          setLoading(false);
        }, (error) => {
            console.error("Error listening to user document:", error);
            setUser({
                uid: authUser.uid,
                email: authUser.email!,
                displayName: authUser.displayName,
                photoURL: authUser.photoURL,
            } as UserProfileType); 
            setLoading(false);
        });

      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup function for the main effect
    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
