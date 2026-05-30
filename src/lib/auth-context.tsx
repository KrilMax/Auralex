import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';

import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { auth, db } from './firebase';

import { User } from './types';

interface AuthContextType {
  user: User | null;

  isAuthenticated: boolean;

  loading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return ctx;
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (
          firebaseUser:
            | FirebaseUser
            | null
        ) => {
          if (firebaseUser) {
            const u: User = {
              id: firebaseUser.uid,
              name:
                firebaseUser.displayName ||
                firebaseUser.email?.split(
                  '@'
                )[0] ||
                'User',
              email:
                firebaseUser.email || '',
              avatarUrl:
                firebaseUser.photoURL ||
                undefined,
            };

            setUser(u);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string
    ) => {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
    },
    []
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ) => {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      await updateProfile(
        userCredential.user,
        {
          displayName: name,
        }
      );

      await setDoc(
        doc(
          db,
          'users',
          userCredential.user.uid
        ),
        {
          email,
          displayName: name,
          createdAt:
            serverTimestamp(),
          theme: 'dark',
          defaultReadingMode:
            'scroll',
        }
      );
    },
    []
  );

  const logout = useCallback(
    async () => {
      await signOut(auth);
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};