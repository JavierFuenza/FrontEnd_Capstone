// src/components/NavBar.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"; // <-- Importa el componente Button
import { MapPin, BarChart3, Code, DollarSign, Leaf, Menu, X } from "lucide-react";

export function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const scrollToPrecios = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (pathname === "/") {
      document.getElementById("precios-section")?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/#precios-section";
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto grid grid-cols-3 items-center">
        {/* Columna 1: Logo */}
        <div className="justify-self-start">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Observatorio Ambiental</h1>
              <p className="text-sm text-gray-500">Datos ambientales en tiempo real</p>
            </div>
          </a>
        </div>

        {/* Columna 2: Navegación (centrada) */}
        <nav className="hidden md:flex items-center gap-6 justify-self-center">
          <a href="/mapa-interactivo" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <MapPin className="w-4 h-4" /> Mapa Interactivo
          </a>
          <a href="/graficos-personalizados" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <BarChart3 className="w-4 h-4" /> Gráficos
          </a>
          <a href="/api-docs" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <Code className="w-4 h-4" /> API
          </a>
          <button onClick={scrollToPrecios} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <DollarSign className="w-4 h-4" /> Precios
          </button>
        </nav>

        {/* ======================================= */}
        {/* == Columna 3: Botones de Auth - INICIO == */}
        {/* ======================================= */}
        <div className="hidden md:flex justify-self-end items-center gap-2">
          <a href="/login">
            <Button variant="outline" size="sm">Iniciar Sesión</Button>
          </a>
          <a href="/register">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Registrarse</Button>
          </a>
        </div>
        {/* ===================================== */}
        {/* == Columna 3: Botones de Auth - FIN == */}
        {/* ===================================== */}


        {/* Menú Móvil */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden justify-self-end p-2 text-gray-600 hover:text-emerald-600"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Panel del Menú Móvil (Aquí también puedes agregar los botones si lo deseas) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-6 py-4">
          <nav className="flex flex-col gap-4">
            {/* ... enlaces del menú móvil ... */}
            <div className="flex flex-col gap-2 pt-4 border-t">
               <a href="/login">
                <Button variant="outline" className="w-full">Iniciar Sesión</Button>
              </a>
              <a href="/register">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Registrarse</Button>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}