// src/components/ApiDocsPage.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { ApiTokenSection } from "./ApiTokenSection";

export function ApiDocsPage() {
  const [openEndpoints, setOpenEndpoints] = useState<string[]>([]);

  const toggleEndpoint = (endpoint: string) => {
    setOpenEndpoints((prev) => (prev.includes(endpoint) ? prev.filter((e) => e !== endpoint) : [...prev, endpoint]));
  };

  return (
    <div className="pt-32 pb-16 px-4 max-w-7xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">API de Datos Ambientales</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Accede a datos ambientales en tiempo real de Chile. Obtén información sobre calidad del aire, recursos
          hídricos y condiciones climáticas de todas las regiones del país.
        </p>
      </div>

      {/* API Token Section */}
      <div className="mb-12">
        <ApiTokenSection />
      </div>

      <Card className="mb-8">
        <CardHeader><CardTitle>Límites de Uso</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800">Plan Gratuito</h4>
              <p className="text-2xl font-bold text-green-600 my-2">5,000</p>
              <p className="text-sm text-green-700">peticiones/mes</p>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg border border-teal-200">
              <h4 className="font-semibold text-teal-800">Plan Pro</h4>
              <p className="text-2xl font-bold text-teal-600 my-2">Ilimitado</p>
              <p className="text-sm text-teal-700">peticiones/mes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Endpoints Disponibles</h2>
        
        {/* Temperature Endpoint */}
        <Card>
          <Collapsible open={openEndpoints.includes("temperature")} onOpenChange={() => toggleEndpoint("temperature")}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Badge variant="secondary">GET</Badge> /api/air/temperature</div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openEndpoints.includes("temperature") ? "rotate-180" : ""}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-4">
                {/* Contenido del endpoint de temperatura... */}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Water Flow Endpoint */}
        <Card>
          <Collapsible open={openEndpoints.includes("caudal")} onOpenChange={() => toggleEndpoint("caudal")}>
            <CollapsibleTrigger asChild>
               <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Badge variant="secondary">GET</Badge> /api/water/caudal</div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openEndpoints.includes("caudal") ? "rotate-180" : ""}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-4">
                {/* Contenido del endpoint de caudal... */}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

         {/* Locations Endpoint */}
        <Card>
          <Collapsible open={openEndpoints.includes("locations")} onOpenChange={() => toggleEndpoint("locations")}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Badge variant="secondary">GET</Badge> /api/locations</div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openEndpoints.includes("locations") ? "rotate-180" : ""}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-4">
                {/* Contenido del endpoint de locations... */}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    </div>
  );
}