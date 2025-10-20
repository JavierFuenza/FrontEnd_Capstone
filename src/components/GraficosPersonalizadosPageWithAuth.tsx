// src/components/GraficosPersonalizadosPageWithAuth.tsx
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { GraficosPageContent } from './GraficosPersonalizadosPage';

export function GraficosPersonalizadosPageWithAuth() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <GraficosPageContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}
