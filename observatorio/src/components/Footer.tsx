import { Leaf, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Observatorio Ambiental</h3>
                <p className="text-sm text-gray-400">Datos ambientales en tiempo real</p>
              </div>
            </div>
            <p className="text-gray-300 max-w-md">
              Plataforma integral para el monitoreo inteligente del medio ambiente.
            </p>
          </div>

          {/* Enlaces Rápidos */}
          <div>
            <h4 className="font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a href="/mapa-interactivo" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Mapa Interactivo
                </a>
              </li>
              <li>
                <a href="/graficos-personalizados" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  Gráficos Personalizados
                </a>
              </li>
              <li>
                <a href="/api-docs" className="text-gray-300 hover:text-emerald-400 transition-colors">
                  API
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-300">
                <Mail className="w-4 h-4" />
                info@observatorio.com
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Phone className="w-4 h-4" />
                +56 9 1234 5678
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4" />
                Santiago, Chile
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Observatorio Ambiental. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}