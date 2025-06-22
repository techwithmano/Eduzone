"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

export interface UserProfile extends User {
  role?: 'STUDENT' | 'TEACHER';
  enrolledClassroomIds?: string[];
  createdClassroomIds?: string[];
}

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // If there was a previous user snapshot listener, unsubscribe from it.
      if (unsubscribeUser) {
        unsubscribeUser();
      }

      if (user) {
        // User is signed in, set up a real-time listener for their data.
        setLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        
        unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              ...user,
              role: userData.role,
              enrolledClassroomIds: userData.enrolledClassroomIds || [],
              createdClassroomIds: userData.createdClassroomIds || [],
            });
          } else {
             // This case can happen if a user was created in auth but not in firestore
            setUser(user);
          }
          setLoading(false);
        }, (error) => {
            console.error("Error listening to user document:", error);
            setUser(user); // Set basic user info even if firestore listener fails
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