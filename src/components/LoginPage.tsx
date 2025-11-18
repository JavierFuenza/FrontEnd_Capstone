import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await login(email, password);
      // Redirigir a la página principal
      window.location.href = "/";
    } catch (err: any) {
      console.error("Error al iniciar sesión:", err);

      // Mensajes de error más amigables
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Correo o contraseña incorrectos");
      } else if (err.code === 'auth/invalid-email') {
        setError("El correo electrónico no es válido");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Demasiados intentos. Intenta más tarde");
      } else if (err.code === 'auth/configuration-not-found') {
        setError("⚠️ Firebase Authentication no está configurado. El administrador debe habilitar Email/Password en la consola de Firebase.");
      } else {
        setError("No se pudo iniciar sesión. Error de contraseña o usuario");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-16 flex items-center justify-center min-h-screen px-4 relative">
      {/* Fondo con imagen optimizado */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: 'url(/fondoanimado.png)',
          filter: 'blur(3px)'
        }}
      />
      {/* Overlay oscuro para mejorar contraste y legibilidad */}
      <div className="fixed inset-0 bg-black/50 -z-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-900/30 to-blue-900/30 -z-10" />

      <Card className="w-full max-w-md backdrop-blur-md bg-white/95 shadow-2xl border-2 border-emerald-200/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Acceder'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600 mt-4">
              ¿No tienes cuenta?{' '}
              <a href="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Regístrate aquí
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}