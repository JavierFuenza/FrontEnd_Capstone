import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, CheckCircle, User, Mail, Lock, Edit2, Save, X, Check } from "lucide-react";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

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

export function ProfilePage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Datos del perfil
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [email, setEmail] = useState(currentUser?.email || "");

  // Cambio de contraseña
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const passwordRequirements = getPasswordRequirements(newPassword, currentUser?.email || "");

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || "");
      setEmail(currentUser.email || "");
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) return;

    try {
      setError("");
      setSuccess("");
      setLoading(true);

      // Actualizar nombre de perfil
      if (displayName !== currentUser.displayName) {
        await updateProfile(currentUser, {
          displayName: displayName
        });
      }

      setSuccess("Perfil actualizado correctamente");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Error al actualizar perfil:", err);
      setError("No se pudo actualizar el perfil. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !currentUser.email) {
      setError("No se pudo obtener la información del usuario");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Validar contraseña con los nuevos requisitos
    const passwordErrors = validatePassword(newPassword, currentUser.email);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(". "));
      return;
    }

    try {
      setError("");
      setSuccess("");
      setLoading(true);

      // Re-autenticar usuario antes de cambiar contraseña
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Cambiar contraseña
      await updatePassword(currentUser, newPassword);

      setSuccess("Contraseña actualizada correctamente");
      setShowPasswordChange(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Error al cambiar contraseña:", err);

      if (err.code === 'auth/wrong-password') {
        setError("La contraseña actual es incorrecta");
      } else if (err.code === 'auth/weak-password') {
        setError("La nueva contraseña es muy débil");
      } else {
        setError("No se pudo cambiar la contraseña. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDisplayName(currentUser?.displayName || "");
    setEmail(currentUser?.email || "");
    setError("");
    setSuccess("");
  };

  // Mostrar loader mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="pt-32 pb-16 flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
            <p className="text-gray-600">Verificando sesión...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si no está loggeado, mostrar mensaje
  if (!currentUser) {
    return (
      <div className="pt-32 pb-16 flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Debes iniciar sesión para ver tu perfil</p>
            <Button
              onClick={() => window.location.href = '/login'}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700"
            >
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-16 min-h-screen px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">Gestiona tu información personal y configuración de cuenta</p>
        </div>

        {/* Mensajes de error/éxito */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Información del perfil */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  Información Personal
                </CardTitle>
                <CardDescription>Tu información de cuenta</CardDescription>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!isEditing || loading}
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled={true}
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">El correo electrónico no se puede cambiar</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    value="••••••••"
                    disabled={true}
                    className="bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Cambiar
                  </Button>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Cambiar contraseña */}
        {showPasswordChange && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                Cambiar Contraseña
              </CardTitle>
              <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña actual
                  </label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={loading}
                    required
                    placeholder="Tu contraseña actual"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setShowPasswordRequirements(true)}
                    disabled={loading}
                    required
                    placeholder="Mínimo 8 caracteres"
                  />

                  {showPasswordRequirements && newPassword && (
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
                    Confirmar nueva contraseña
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    placeholder="Repite la nueva contraseña"
                  />
                  {confirmPassword && newPassword === confirmPassword && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Las contraseñas coinciden
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cambiando...
                      </>
                    ) : (
                      'Cambiar Contraseña'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setError("");
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Información de la cuenta */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Estado de la Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Email verificado:</span>
                <span className={`text-sm font-medium ${currentUser.emailVerified ? 'text-green-600' : 'text-orange-600'}`}>
                  {currentUser.emailVerified ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Fecha de creación:</span>
                <span className="text-sm font-medium text-gray-900">
                  {currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString('es-ES') : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Último acceso:</span>
                <span className="text-sm font-medium text-gray-900">
                  {currentUser.metadata.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString('es-ES') : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
