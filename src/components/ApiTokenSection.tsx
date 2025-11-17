// src/components/ApiTokenSection.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Key, AlertTriangle, ExternalLink } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function ApiTokenSection() {
  const [token, setToken] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadToken(currentUser);
      } else {
        setError("Debes iniciar sesión para obtener tu token de API");
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const loadToken = async (currentUser?: User) => {
    try {
      setLoading(true);
      setError("");

      const targetUser = currentUser || auth.currentUser;

      if (!targetUser) {
        setError("Debes iniciar sesión para obtener tu token de API");
        setLoading(false);
        return;
      }

      // Get fresh token
      const idToken = await targetUser.getIdToken();
      setToken(idToken);

      // Tokens expire after 1 hour
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 1);
      setTokenExpiry(expiryTime);

      setLoading(false);
    } catch (err: any) {
      console.error('[ApiTokenSection] Error getting token:', err);
      setError(err.message || "Error al obtener el token");
      setLoading(false);
    }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const copyCurlExample = async (endpoint: string) => {
    const curlCommand = `curl -H "Authorization: Bearer ${token}" \\
     https://your-api-url.com${endpoint}`;

    try {
      await navigator.clipboard.writeText(curlCommand);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const API_BASE_URL = import.meta.env.PUBLIC_API_URL || "http://srv1105893.hstgr.cloud:8000";

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p>{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.href = '/login'}
            >
              Ir a Iniciar Sesión
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Token Display Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Tu Token de Acceso a la API
          </CardTitle>
          <CardDescription>
            Usa este token para autenticarte con la API pública. El token expira en 1 hora.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token Display */}
          <div className="relative">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 font-mono text-sm break-all">
              {token ? token : "No se pudo obtener el token"}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={copyToken}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </>
              )}
            </Button>
          </div>

          {/* Token Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Activo
              </Badge>
              {tokenExpiry && (
                <span className="text-gray-600">
                  Expira: {tokenExpiry.toLocaleTimeString()}
                </span>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={loadToken}>
              Refrescar Token
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Acciones Rápidas:</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`${API_BASE_URL}/docs`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Ver Documentación
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Ejemplos de Uso</CardTitle>
          <CardDescription>
            Cómo usar tu token para hacer peticiones a la API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* cURL Example */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Badge variant="secondary">cURL</Badge>
              Línea de Comandos
            </h4>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`curl -H "Authorization: Bearer YOUR_TOKEN" \\
     ${API_BASE_URL}/api/v1/air-quality/climaticos/temperatura`}</pre>
            </div>
          </div>

          {/* JavaScript Example */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Badge variant="secondary">JavaScript</Badge>
              Fetch API
            </h4>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`const response = await fetch('${API_BASE_URL}/api/v1/air-quality/climaticos/temperatura', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`}</pre>
            </div>
          </div>

          {/* Python Example */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Badge variant="secondary">Python</Badge>
              Requests
            </h4>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`import requests

headers = {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.get(
    '${API_BASE_URL}/api/v1/air-quality/climaticos/temperatura',
    headers=headers
)

data = response.json()
print(data)`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoints Disponibles</CardTitle>
          <CardDescription>
            Todas las rutas de la API pública con autenticación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Air Quality */}
            <div>
              <h4 className="font-semibold mb-2 text-teal-700">Calidad del Aire</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code className="text-xs">/api/v1/air-quality/climaticos/temperatura</code>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code className="text-xs">/api/v1/air-quality/climaticos/humedad-radiacion-uv</code>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code className="text-xs">/api/v1/air-quality/mp25/anual</code>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code className="text-xs">/api/v1/air-quality/mp25/mensual</code>
                </div>
                <div className="text-xs text-gray-500 pl-2 pt-1">
                  + 15 endpoints más de calidad del aire...
                </div>
              </div>
            </div>

            {/* Water Quality */}
            <div>
              <h4 className="font-semibold mb-2 text-blue-700">Recursos Hídricos</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code className="text-xs">/api/v1/water-quality/vistas/mar-mensual</code>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code className="text-xs">/api/v1/water-quality/vistas/glaciares-anual-cuenca</code>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code className="text-xs">/api/v1/water-quality/hidrologia/caudal</code>
                </div>
                <div className="text-xs text-gray-500 pl-2 pt-1">
                  + 9 endpoints más de recursos hídricos...
                </div>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              variant="outline"
              onClick={() => window.open(`${API_BASE_URL}/docs`, '_blank')}
            >
              Ver Todos los Endpoints (31 total)
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Notas Importantes:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>El token expira cada hora. Refresca el token si recibes errores 401.</li>
            <li>Incluye siempre el token en el header: <code className="bg-gray-100 px-1 rounded">Authorization: Bearer TOKEN</code></li>
            <li>La API está disponible en: <code className="bg-gray-100 px-1 rounded">{API_BASE_URL}</code></li>
            <li>Todos los endpoints requieren autenticación excepto <code className="bg-gray-100 px-1 rounded">/health</code></li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
