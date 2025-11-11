// src/components/HomePageContent.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, BarChart3, ChevronLeft, ChevronRight, AlertTriangle, Lightbulb, Users, Droplets } from "lucide-react";
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

// Datos del carrusel
const infoSlides = [
  {
    icon: AlertTriangle,
    title: "El Desafío Ambiental de Chile",
    content: "Actualmente, los datos ambientales en Chile se encuentran dispersos en múltiples fuentes gubernamentales, dificultando el acceso a información crítica sobre la calidad del aire, agua y recursos naturales. Esta fragmentación impide que ciudadanos, investigadores y organizaciones tomen decisiones informadas sobre el estado real de nuestro medio ambiente.",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Lightbulb,
    title: "Nuestra Solución",
    content: "El Observatorio Ambiental Digital centraliza y visualiza datos de múltiples fuentes oficiales en una plataforma intuitiva y accesible. Ofrecemos herramientas avanzadas de análisis, mapas interactivos y gráficos personalizables que transforman datos complejos en información clara y accionable. Democratizamos el acceso a la información ambiental para impulsar la transparencia y conciencia ecológica en todo Chile.",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: Users,
    title: "Quiénes Somos",
    content: "Somos un equipo multidisciplinario de ingenieros en desarrollo de software comprometidos con el impacto social y ambiental. Este proyecto representa nuestro trabajo de titulación (Capstone), donde aplicamos tecnologías modernas y mejores prácticas de desarrollo para crear una solución real que beneficie a la comunidad, promoviendo la transparencia de datos y facilitando la investigación ambiental en Chile.",
    color: "from-blue-500 to-indigo-500"
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
                        <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed max-w-3xl px-2">
                          {slide.content}
                        </p>
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

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16 lg:mb-20">
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
                Explora datos ambientales por región.
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
        <a href="/recursos-hidricos">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-b-4 border-b-emerald-500">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Recursos Hídricos</CardTitle>
              </div>
              <CardDescription className="text-base">
                Gestiona estaciones de monitoreo hidrológico y acuático.
              </CardDescription>
            </CardHeader>
          </Card>
        </a>
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

      {/* Footer CTA */}
      <div className="text-center">
        <a href="/api-docs" className="text-emerald-600 hover:text-emerald-700 font-medium">
          Ver Documentación API →
        </a>
      </div>
    </>
  );
}
