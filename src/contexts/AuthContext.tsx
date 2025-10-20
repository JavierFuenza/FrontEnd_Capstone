// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  type User,
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
  signup: (email: string, password: string, displayName: string) => Promise<void>;
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
  console.log('[useAuth] AuthProvider found, user:', context.user?.email || 'none');
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthProvider] Iniciando listener de auth state...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('[AuthProvider] Usuario detectado:', user.email, 'UID:', user.uid);
      } else {
        console.log('[AuthProvider] No hay usuario loggeado');
      }
      setUser(user);
      setLoading(false);
    });

    return () => {
      console.log('[AuthProvider] Limpiando listener de auth state');
      unsubscribe();
    };
  }, []);

  const signup = async (email: string, password: string, displayName: string) => {
    console.log('[AuthContext] Iniciando registro...', { email, displayName });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('[AuthContext] Usuario creado:', userCredential.user.uid);

      // Actualizar el perfil con el nombre de display
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        console.log('[AuthContext] Perfil actualizado');
        // Forzar actualización del estado
        setUser({ ...userCredential.user, displayName });
      }
    } catch (error) {
      console.error('[AuthContext] Error en signup:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    console.log('[AuthContext] Iniciando login...', { email });
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('[AuthContext] Login exitoso:', result.user.uid);
    } catch (error) {
      console.error('[AuthContext] Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('[AuthContext] Cerrando sesión...');
    try {
      await signOut(auth);
      console.log('[AuthContext] Sesión cerrada');
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
