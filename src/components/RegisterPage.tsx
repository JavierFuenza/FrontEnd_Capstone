import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, CheckCircle, Mail, X, Check } from "lucide-react";
import { sendEmailVerification } from "firebase/auth";

// Función para validar la contraseña
const validatePassword = (password: string, email: string) => {
  const errors: string[] = [];

  // Mínimo 8 caracteres (más seguro que 6)
  if (password.length < 8) {
    errors.push("Debe tener al menos 8 caracteres");
  }

  // Mayúscula
  if (!/[A-Z]/.test(password)) {
    errors.push("Debe contener al menos una letra mayúscula");
  }

  // Minúscula
  if (!/[a-z]/.test(password)) {
    errors.push("Debe contener al menos una letra minúscula");
  }

  // Carácter especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Debe contener al menos un carácter especial (!@#$%^&*...)");
  }

  // No debe ser similar al email
  if (email) {
    const emailUsername = email.split('@')[0].toLowerCase();
    const passwordLower = password.toLowerCase();

    // Verificar si la contraseña contiene el username del email o viceversa
    if (emailUsername.length > 3 && (
      passwordLower.includes(emailUsername) ||
      emailUsername.includes(passwordLower)
    )) {
      errors.push("No debe ser similar a tu correo electrónico");
    }
  }

  return errors;
};

// Función para verificar cada requisito individual
const getPasswordRequirements = (password: string, email: string) => {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    notSimilarToEmail: (() => {
      if (!email) return true;
      const emailUsername = email.split('@')[0].toLowerCase();
      const passwordLower = password.toLowerCase();
      if (emailUsername.length > 3 && (
        passwordLower.includes(emailUsername) ||
        emailUsername.includes(passwordLower)
      )) {
        return false;
      }
      return true;
    })()
  };
};

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const { signup } = useAuth();

  const passwordRequirements = getPasswordRequirements(password, email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Validar contraseña con los nuevos requisitos
    const passwordErrors = validatePassword(password, email);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(". "));
      return;
    }

    try {
      setError("");
      setLoading(true);
      const userCredential = await signup(email, password, name);

      // Enviar email de verificación
      if (userCredential?.user) {
        try {
          await sendEmailVerification(userCredential.user);
        } catch (emailError) {
          console.warn("No se pudo enviar el email de verificación:", emailError);
          // No bloqueamos el registro si falla el envío del email
        }
      }

      // Redirigir a la página principal
      window.location.href = "/";
    } catch (err: any) {
      console.error("Error al registrarse:", err);

      // Mensajes de error más amigables
      if (err.code === 'auth/email-already-in-use') {
        setError("Este correo ya está registrado. Intenta iniciar sesión");
      } else if (err.code === 'auth/invalid-email') {
        setError("El correo electrónico no es válido");
      } else if (err.code === 'auth/weak-password') {
        setError("La contraseña es muy débil. Usa al menos 6 caracteres");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("El registro con correo electrónico no está habilitado. Contacta al administrador del sistema");
      } else if (err.code === 'auth/configuration-not-found') {
        setError("⚠️ Firebase Authentication no está configurado. El administrador debe habilitar Email/Password en la consola de Firebase.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Error de conexión. Verifica tu conexión a internet e intenta nuevamente");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Demasiados intentos fallidos. Por favor, espera unos minutos antes de intentar nuevamente");
      } else if (err.code === 'auth/internal-error') {
        setError("Error interno del servidor. Por favor, intenta nuevamente en unos momentos");
      } else if (err.code === 'auth/firebase-app-check-token-is-invalid') {
        setError("Error de verificación de seguridad. El administrador debe configurar Firebase App Check correctamente o deshabilitarlo en la consola de Firebase");
      } else {
        setError("No se pudo crear la cuenta. Por favor, intenta nuevamente");
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
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>Regístrate para obtener acceso completo a la plataforma</CardDescription>
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

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
                onFocus={() => setShowPasswordRequirements(true)}
                required
                disabled={loading}
              />

              {showPasswordRequirements && password && (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Requisitos de contraseña:</p>
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-xs ${passwordRequirements.length ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>Al menos 8 caracteres</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.uppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>Una letra mayúscula (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.lowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>Una letra minúscula (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordRequirements.special ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.special ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>Un carácter especial (!@#$%...)</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${passwordRequirements.notSimilarToEmail ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordRequirements.notSimilarToEmail ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>No similar a tu correo electrónico</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Las contraseñas coinciden
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Registrarse'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600 mt-4">
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Inicia sesión aquí
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}