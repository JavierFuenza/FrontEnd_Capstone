// src/components/ProfilePageWithAuth.tsx
import { AuthProvider } from '@/contexts/AuthContext';
import { ProfilePage } from './ProfilePage';

export function ProfilePageWithAuth() {
  return (
    <AuthProvider>
      <ProfilePage />
    </AuthProvider>
  );
}
