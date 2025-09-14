import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, BarChart3 } from "lucide-react";
import { PricingCard } from "./PricingCard";

// CAMBIO: Definimos un tipo para los planes que coincide con las Props del PricingCard
type Plan = {
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
  buttonVariant?: "default" | "outline";
};

// Se aplica el nuevo tipo al array de planes
const pricingPlans: Plan[] = [
  {
    title: "Gratuito", price: "$0", description: "Plan básico",
    features: ["Acceso a mapa interactivo", "Gráficos personalizados (3 diarios)", "API limitada (5,000 peticiones)"],
    buttonText: "Comenzar gratis",
    buttonVariant: "outline",
  },
  {
    title: "Plan de Gráficos", price: "$2,000", description: "Para análisis avanzado",
    features: ["Todo del plan gratuito", "Creación de gráficos ilimitados", "Exportación avanzada"],
    buttonText: "Para estudiantes",
    buttonVariant: "outline",
  },
  {
    title: "Plan Pro", price: "$10,000", description: "Acceso completo",
    features: ["Todo de planes anteriores", "API ilimitada", "Soporte prioritario"],
    buttonText: "Para profesionales", popular: true, buttonVariant: "default",
  },
  {
    title: "Institucional", price: "Personalizado", description: "Según necesidades",
    features: ["Solución completamente personalizada", "Precio según estudiantes y cuentas", "Consultoría incluida"],
    buttonText: "Contactar",
    buttonVariant: "outline",
  },
];

export function HomePageContent() {
  // Lógica para el scroll suave
  useEffect(() => {
    if (window.location.hash === "#precios-section") {
      setTimeout(() => {
        const preciosSection = document.getElementById("precios-section");
        if (preciosSection) {
          preciosSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, []);

  return (
    <>
      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-20">
        <a href="/mapa-interactivo">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-b-4 border-b-emerald-500">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Mapa Interactivo</CardTitle>
              </div>
              <CardDescription className="text-base">
                Explora datos ambientales por región en tiempo real.
              </CardDescription>
            </CardHeader>
          </Card>
        </a>
        <a href="/graficos-personalizados">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-b-4 border-b-emerald-500">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Gráficos Personalizados</CardTitle>
              </div>
              <CardDescription className="text-base">
                Herramientas avanzadas de análisis para investigadores.
              </CardDescription>
            </CardHeader>
          </Card>
        </a>
      </div>

      <div id="precios-section" className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Planes y Precios</h2>
        <p className="text-lg text-gray-600">
          Elige el plan que mejor se adapte a tus necesidades.
        </p>
      </div>

      {/* Pricing Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {pricingPlans.map(plan => (
          <PricingCard key={plan.title} {...plan} />
        ))}
      </div>

      {/* Footer CTA */}
      <div className="text-center">
        <a href="/api-docs" className="text-emerald-600 hover:text-emerald-700 font-medium">
          Ver Documentación API →
        </a>
      </div>
    </>
  );
}