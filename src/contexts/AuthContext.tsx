// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  type User,
  type UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  // Durante SSR en Astro, el contexto puede no estar disponible
  // Retornamos valores por defecto en lugar de lanzar error
  if (context === undefined) {
    console.warn('[useAuth] No AuthProvider found - returning default values (SSR mode)');
    // Valores por defecto para SSR
    return {
      user: null,
      loading: true,
      signup: async () => {
        console.error('[useAuth] signup called but no AuthProvider available!');
      },
      login: async () => {
        console.error('[useAuth] login called but no AuthProvider available!');
      },
      logout: async () => {
        console.error('[useAuth] logout called but no AuthProvider available!');
      }
    };
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Actualizar el perfil con el nombre de display
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        // Forzar actualización del estado
        setUser({ ...userCredential.user, displayName });
      }

      return userCredential;
    } catch (error) {
      console.error('[AuthContext] Error en signup:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('[AuthContext] Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('[AuthContext] Error en logout:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
