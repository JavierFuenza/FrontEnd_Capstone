// src/components/NavBarWithAuth.tsx
import { AuthProvider } from '@/contexts/AuthContext';
import { NavBar } from './NavBar';

export function NavBarWithAuth() {
  return (
    <AuthProvider>
      <NavBar />
    </AuthProvider>
  );
}
