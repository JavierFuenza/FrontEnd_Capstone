// src/components/ProtectedRoute.tsx
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Verificar si ya ha pasado tiempo suficiente de carga
    if (!loading && !user) {
      // El usuario no está autenticado
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-gray-700 font-medium">Verificando autenticación...</p>
        <p className="text-sm text-gray-500 mt-1">Por favor espera</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-16">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Acceso Restringido</CardTitle>
            <CardDescription className="text-base mt-2">
              Esta página requiere autenticación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Gráficos Personalizados</strong> es una funcionalidad premium
                disponible solo para usuarios registrados.
              </p>
            </div>

            <div className="space-y-3">
              <a href="/login" className="block">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Iniciar Sesión
                </Button>
              </a>
              <a href="/register" className="block">
                <Button variant="outline" className="w-full">
                  Crear Cuenta Gratis
                </Button>
              </a>
            </div>

            <div className="text-center">
              <a href="/" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                ← Volver al inicio
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
