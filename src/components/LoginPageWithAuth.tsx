// src/components/LoginPageWithAuth.tsx
import { AuthProvider } from '@/contexts/AuthContext';
import { LoginPage } from './LoginPage';

export function LoginPageWithAuth() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}
