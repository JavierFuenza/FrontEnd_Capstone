// src/components/NavBar.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"; // <-- Importa el componente Button
import { MapPin, BarChart3, Code, DollarSign, Leaf, Menu, X, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pathname, setPathname] = useState("");
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

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
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm px-4 sm:px-6 py-3 fixed top-0 left-0 right-0 z-[9999]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo - Responsivo */}
        <div className="flex-shrink-0">
          <a href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-md">
              <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Observatorio Ambiental</h1>
              <p className="text-xs text-gray-500 leading-tight">Datos en tiempo real</p>
            </div>
            <div className="block sm:hidden">
              <h1 className="text-sm font-bold text-gray-900">Observatorio</h1>
            </div>
          </a>
        </div>

        {/* Navegación Desktop - Centrada */}
        <nav className="hidden lg:flex items-center gap-1">
          <a
            href="/mapa-interactivo"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <MapPin className="w-4 h-4" />
            <span>Mapa</span>
          </a>
          <a
            href="/graficos-personalizados"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Gráficos</span>
          </a>
          <a
            href="/api-docs"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <Code className="w-4 h-4" />
            <span>API</span>
          </a>
          <button
            onClick={scrollToPrecios}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <DollarSign className="w-4 h-4" />
            <span>Precios</span>
          </button>
        </nav>

        {/* Botones de Auth - Desktop */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          {loading ? (
            <div className="w-20 h-9 bg-gray-100 animate-pulse rounded"></div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <a
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg shadow-sm hover:from-emerald-100 hover:to-emerald-150 hover:border-emerald-300 transition-all cursor-pointer"
              >
                <div className="relative">
                  <User className="w-5 h-5 text-emerald-700" />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-emerald-700 leading-tight">
                    Conectado
                  </span>
                  <span className="text-sm font-medium text-emerald-900 leading-tight">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>
              </a>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-sm font-medium border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <>
              <a href="/login">
                <Button variant="outline" size="sm" className="text-sm font-medium">
                  Iniciar Sesión
                </Button>
              </a>
              <a href="/register">
                <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-sm font-medium shadow-sm">
                  Registrarse
                </Button>
              </a>
            </>
          )}
        </div>


        {/* Menú Móvil */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden justify-self-end p-2 text-gray-600 hover:text-emerald-600"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Panel del Menú Móvil */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white/98 border-t border-gray-200 px-6 py-5 shadow-lg relative z-[9999]">
          <nav className="flex flex-col gap-2">
            <a
              href="/mapa-interactivo"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            >
              <MapPin className="w-4 h-4" />
              <span>Mapa Interactivo</span>
            </a>
            <a
              href="/graficos-personalizados"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Gráficos Personalizados</span>
            </a>
            <a
              href="/api-docs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            >
              <Code className="w-4 h-4" />
              <span>Documentación API</span>
            </a>
            <button
              onClick={scrollToPrecios}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            >
              <DollarSign className="w-4 h-4" />
              <span>Precios</span>
            </button>

            <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-gray-200">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg">
                    <div className="relative">
                      <User className="w-5 h-5 text-emerald-700" />
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-emerald-700 leading-tight">
                        Conectado
                      </p>
                      <p className="text-sm font-medium text-emerald-900 leading-tight">
                        {user.displayName || 'Usuario'}
                      </p>
                      <p className="text-xs text-emerald-700 leading-tight">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <a href="/profile">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-sm font-medium border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Ver Perfil
                    </Button>
                  </a>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="w-full text-sm font-medium border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <>
                  <a href="/login">
                    <Button variant="outline" size="sm" className="w-full text-sm font-medium">
                      Iniciar Sesión
                    </Button>
                  </a>
                  <a href="/register">
                    <Button size="sm" className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-sm font-medium shadow-sm">
                      Registrarse
                    </Button>
                  </a>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}