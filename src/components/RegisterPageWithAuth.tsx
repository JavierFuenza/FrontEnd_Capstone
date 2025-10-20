// src/components/RegisterPageWithAuth.tsx
import { AuthProvider } from '@/contexts/AuthContext';
import { RegisterPage } from './RegisterPage';

export function RegisterPageWithAuth() {
  return (
    <AuthProvider>
      <RegisterPage />
    </AuthProvider>
  );
}
