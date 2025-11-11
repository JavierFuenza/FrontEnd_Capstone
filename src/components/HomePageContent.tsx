// src/components/HomePageContent.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, BarChart3, ChevronLeft, ChevronRight, AlertTriangle, Lightbulb, Users, Droplets, Code } from "lucide-react";
import { PricingCard } from "./PricingCard";

type Plan = {
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
  buttonVariant?: "default" | "outline";
};

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

// Datos del carrusel - Funcionalidades principales
const infoSlides = [
  {
    icon: MapPin,
    title: "Mapa Interactivo",
    content: "Explora datos ambientales de todas las regiones de Chile en un mapa interactivo. Visualiza información sobre calidad del aire, temperatura, contaminantes y más. Selecciona regiones específicas y accede a datos detallados de cada zona del país.",
    color: "from-emerald-500 to-teal-500",
    link: "/mapa-interactivo",
    buttonText: "Explorar Mapa"
  },
  {
    icon: BarChart3,
    title: "Gráficos Personalizados",
    content: "Crea y personaliza gráficos avanzados para analizar tendencias ambientales. Compara datos entre múltiples regiones, aplica filtros temporales y exporta tus análisis. Herramientas profesionales para investigadores y estudiantes.",
    color: "from-blue-500 to-indigo-500",
    link: "/graficos-personalizados",
    buttonText: "Crear Gráficos"
  },
  {
    icon: Droplets,
    title: "Recursos Hídricos",
    content: "Accede a información detallada sobre estaciones de monitoreo hidrológico y acuático. Consulta datos de cuencas, embalses, estaciones fluviométricas, meteorológicas y calidad de aguas costeras. Sistema completo de gestión de recursos hídricos.",
    color: "from-cyan-500 to-blue-500",
    link: "/recursos-hidricos",
    buttonText: "Ver Estaciones"
  },
  {
    icon: Code,
    title: "API Pública",
    content: "Integra datos ambientales en tus propias aplicaciones mediante nuestra API REST. Acceso programático a todos los datos de la plataforma con documentación completa y ejemplos de código. Ideal para desarrolladores e investigadores.",
    color: "from-purple-500 to-pink-500",
    link: "/api-docs",
    buttonText: "Ver Documentación"
  }
];

export function HomePageContent() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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

  // Auto-play del carrusel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % infoSlides.length);
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % infoSlides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + infoSlides.length) % infoSlides.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  return (
    <>
      {/* Carrusel de Información */}
      <div className="mb-12 md:mb-16 lg:mb-20 relative">
        <div className="max-w-5xl mx-auto">
          {/* Contenedor del slide */}
          <div
            className="relative overflow-hidden rounded-2xl shadow-2xl"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Slides */}
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {infoSlides.map((slide, index) => {
                const IconComponent = slide.icon;
                return (
                  <div
                    key={index}
                    className="w-full flex-shrink-0 relative"
                  >
                    {/* Fondo con gradiente */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${slide.color} opacity-10`} />

                    {/* Contenido */}
                    <div className="relative px-6 py-10 sm:px-8 sm:py-12 md:px-16 md:py-16">
                      <div className="flex flex-col items-center text-center">
                        {/* Icono */}
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${slide.color} flex items-center justify-center mb-4 sm:mb-6 shadow-lg`}>
                          <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </div>

                        {/* Título */}
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
                          {slide.title}
                        </h2>

                        {/* Contenido */}
                        <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed max-w-3xl px-2 mb-6">
                          {slide.content}
                        </p>

                        {/* Botón de acción */}
                        <a
                          href={slide.link}
                          className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${slide.color} text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105`}
                        >
                          {slide.buttonText}
                          <ChevronRight className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botones de navegación */}
            <button
              onClick={prevSlide}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
              aria-label="Siguiente slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>
          </div>

          {/* Indicadores de slides */}
          <div className="flex justify-center gap-2 mt-6">
            {infoSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === index
                    ? 'w-8 bg-emerald-600'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sobre Nosotros - Cards informativas */}
      <div className="mb-12 md:mb-16 lg:mb-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 md:mb-10">
          Sobre el Proyecto
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <Card className="h-full border-t-4 border-t-orange-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">El Problema</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Los datos ambientales en Chile están dispersos en múltiples fuentes gubernamentales, dificultando el acceso a información crítica. Esta fragmentación impide que ciudadanos, investigadores y organizaciones tomen decisiones informadas sobre el medio ambiente.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="h-full border-t-4 border-t-emerald-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Nuestra Solución</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Centralizamos y visualizamos datos de múltiples fuentes oficiales en una plataforma intuitiva. Ofrecemos herramientas avanzadas de análisis, mapas interactivos y gráficos personalizables que transforman datos complejos en información clara y accionable.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="h-full border-t-4 border-t-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Quiénes Somos</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Equipo multidisciplinario de ingenieros en desarrollo de software comprometidos con el impacto social y ambiental. Este proyecto Capstone aplica tecnologías modernas para beneficiar a la comunidad, promoviendo la transparencia de datos ambientales en Chile.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* <div id="precios-section" className="text-center mb-8 md:mb-12 px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">Planes y Precios</h2>
        <p className="text-base md:text-lg text-gray-600">
          Elige el plan que mejor se adapte a tus necesidades.
        </p>
      </div> */}

      {/* Pricing Section */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-12">
        {pricingPlans.map(plan => (
          <PricingCard key={plan.title} {...plan} />
        ))}
      </div> */}

    </>
  );
}
