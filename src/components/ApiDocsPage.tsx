// src/components/ApiDocsPage.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { ApiTokenSection } from "./ApiTokenSection";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function ApiDocsPage() {
  const [openEndpoints, setOpenEndpoints] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleEndpoint = (endpoint: string) => {
    setOpenEndpoints((prev) => (prev.includes(endpoint) ? prev.filter((e) => e !== endpoint) : [...prev, endpoint]));
  };

  return (
    <div className="pt-32 pb-16 px-4 max-w-7xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">API de Datos Ambientales</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Accede a datos ambientales de Chile. Obtén información sobre calidad del aire, recursos
          hídricos y condiciones climáticas de todas las regiones del país.
        </p>
      </div>

      {/* API Token Section */}
      <div className="mb-12">
        <ApiTokenSection />
      </div>

      {/* Información sobre la API - Solo visible para usuarios NO autenticados */}
      {!loading && !user && (
      <div className="space-y-6">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardTitle className="text-2xl">¿Cómo usar la API?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">1. Autenticación</h3>
              <p className="text-gray-600">
                Para acceder a la API, necesitas estar autenticado. Inicia sesión o regístrate para obtener acceso completo a todos los datos ambientales.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">2. Token de API</h3>
              <p className="text-gray-600">
                Una vez autenticado, podrás generar y gestionar tu token de API desde la sección superior. Este token es necesario para realizar peticiones a la API.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">3. Endpoints Disponibles</h3>
              <p className="text-gray-600">
                La API proporciona acceso a datos de calidad del aire, recursos hídricos, estaciones de monitoreo y más. Toda la documentación detallada estará disponible una vez que inicies sesión.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-2xl">Características de la API</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <strong>Datos en formato JSON:</strong> Respuestas estructuradas y fáciles de procesar
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <strong>Múltiples fuentes de datos:</strong> Información consolidada de diversas estaciones de monitoreo
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <strong>Datos históricos:</strong> Acceso a datos históricos para análisis de tendencias
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="py-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">¿Listo para comenzar?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Inicia sesión para acceder a la documentación completa de la API, ejemplos de código y comenzar a integrar datos ambientales en tus aplicaciones.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/login"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-lg transition-all hover:scale-105"
              >
                Iniciar Sesión
              </a>
              <a
                href="/register"
                className="px-6 py-3 bg-white hover:bg-gray-50 text-emerald-600 font-semibold rounded-lg border-2 border-emerald-600 shadow-lg transition-all hover:scale-105"
              >
                Registrarse
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}