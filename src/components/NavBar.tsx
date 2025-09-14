import { useState, useEffect } from "react";
import { MapPin, BarChart3, Code, DollarSign, Leaf, Menu, X } from "lucide-react";

export function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // CAMBIO: Usamos useEffect y useState para obtener la ruta actual del navegador
  const [pathname, setPathname] = useState("");
  useEffect(() => {
    // Esto se ejecuta solo en el cliente, donde window está disponible
    setPathname(window.location.pathname);
  }, []);

  const scrollToPrecios = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (pathname === "/") {
      const preciosSection = document.getElementById("precios-section");
      if (preciosSection) {
        preciosSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // CAMBIO: Usamos window.location.href para la navegación
      window.location.href = "/#precios-section";
    }
  };

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* CAMBIO: <Link> se reemplaza por <a> */}
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Observatorio Ambiental</h1>
            <p className="text-sm text-gray-500">Datos ambientales en tiempo real</p>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-6">
          <a href="/mapa-interactivo" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <MapPin className="w-4 h-4" />
            Mapa Interactivo
          </a>
          <a href="/graficos-personalizados" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <BarChart3 className="w-4 h-4" />
            Gráficos Personalizados
          </a>
          <a href="/api-docs" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <Code className="w-4 h-4" />
            API
          </a>
          <button onClick={scrollToPrecios} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors cursor-pointer">
            <DollarSign className="w-4 h-4" />
            Precios
          </button>
        </nav>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-gray-600 hover:text-emerald-600 transition-colors"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-6 py-4">
          <nav className="flex flex-col gap-4">
            <a href="/mapa-interactivo" onClick={handleMobileLinkClick} className="flex items-center gap-3 text-gray-600 hover:text-emerald-600 transition-colors py-2">
              <MapPin className="w-5 h-5" />
              Mapa Interactivo
            </a>
            <a href="/graficos-personalizados" onClick={handleMobileLinkClick} className="flex items-center gap-3 text-gray-600 hover:text-emerald-600 transition-colors py-2">
              <BarChart3 className="w-5 h-5" />
              Gráficos Personalizados
            </a>
            <a href="/api-docs" onClick={handleMobileLinkClick} className="flex items-center gap-3 text-gray-600 hover:text-emerald-600 transition-colors py-2">
              <Code className="w-5 h-5" />
              API
            </a>
            <button onClick={scrollToPrecios} className="flex items-center gap-3 text-gray-600 hover:text-emerald-600 transition-colors cursor-pointer py-2 text-left">
              <DollarSign className="w-5 h-5" />
              Precios
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}