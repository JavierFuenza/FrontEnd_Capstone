import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Search, BookOpen } from "lucide-react";

interface MetricaInfo {
  nombre: string;
  descripcion: string;
  unidad?: string;
  rangoSaludable?: string;
  categoria: "Contaminantes" | "Temperatura" | "Humedad" | "Eventos";
}

const GLOSARIO: MetricaInfo[] = [
  // CONTAMINANTES PARTICULADOS
  {
    nombre: "MP2.5 (Material Particulado 2.5)",
    descripcion: "Partículas finas en el aire menores a 2.5 micrómetros. Son especialmente peligrosas porque pueden penetrar profundamente en los pulmones y el torrente sanguíneo, causando problemas respiratorios y cardiovasculares.",
    unidad: "μg/m³",
    rangoSaludable: "0-12 μg/m³ (bueno), >35 μg/m³ (malo)",
    categoria: "Contaminantes"
  },
  {
    nombre: "MP10 (Material Particulado 10)",
    descripcion: "Partículas inhalables menores a 10 micrómetros. Incluyen polvo, polen y moho. Pueden causar irritación en ojos, nariz y garganta, y agravar enfermedades respiratorias.",
    unidad: "μg/m³",
    rangoSaludable: "0-54 μg/m³ (bueno), >154 μg/m³ (malo)",
    categoria: "Contaminantes"
  },

  // CONTAMINANTES GASEOSOS
  {
    nombre: "O3 (Ozono Troposférico)",
    descripcion: "Gas formado por reacciones químicas entre contaminantes en presencia de luz solar. A nivel del suelo es perjudicial, causando problemas respiratorios, especialmente en niños y adultos mayores.",
    unidad: "ppb",
    rangoSaludable: "0-54 ppb (bueno), >164 ppb (malo)",
    categoria: "Contaminantes"
  },
  {
    nombre: "SO2 (Dióxido de Azufre)",
    descripcion: "Gas producido principalmente por la quema de combustibles fósiles en industrias. Puede causar problemas respiratorios y contribuir a la lluvia ácida.",
    unidad: "ppb",
    rangoSaludable: "0-35 ppb (bueno), >185 ppb (malo)",
    categoria: "Contaminantes"
  },
  {
    nombre: "NO2 (Dióxido de Nitrógeno)",
    descripcion: "Gas tóxico producido por vehículos y procesos industriales. Irrita las vías respiratorias y puede empeorar enfermedades como el asma.",
    unidad: "ppb",
    rangoSaludable: "0-53 ppb (bueno), >360 ppb (malo)",
    categoria: "Contaminantes"
  },
  {
    nombre: "CO (Monóxido de Carbono)",
    descripcion: "Gas tóxico incoloro e inodoro producido por combustión incompleta. Reduce la capacidad de la sangre para transportar oxígeno, siendo especialmente peligroso en espacios cerrados.",
    unidad: "ppm",
    rangoSaludable: "0-4.4 ppm (bueno), >30 ppm (malo)",
    categoria: "Contaminantes"
  },
  {
    nombre: "NO (Óxido de Nitrógeno)",
    descripcion: "Gas producido en procesos de combustión a altas temperaturas. Precursor del NO2 y del ozono troposférico.",
    unidad: "ppb",
    categoria: "Contaminantes"
  },
  {
    nombre: "NOx (Óxidos de Nitrógeno)",
    descripcion: "Conjunto de gases (NO + NO2) producidos por combustión. Contribuyen a la formación de smog y lluvia ácida.",
    unidad: "ppb",
    categoria: "Contaminantes"
  },

  // MÉTRICAS ESTADÍSTICAS
  {
    nombre: "Máximo Horario Anual",
    descripcion: "El valor más alto registrado en una hora durante todo el año. Indica los picos de contaminación más extremos.",
    categoria: "Contaminantes"
  },
  {
    nombre: "Mínimo Horario Anual",
    descripcion: "El valor más bajo registrado en una hora durante todo el año. Muestra los mejores niveles de calidad del aire.",
    categoria: "Contaminantes"
  },
  {
    nombre: "Percentil 50 (Mediana)",
    descripcion: "Valor que divide los datos en dos mitades iguales. El 50% de las mediciones están por debajo de este valor.",
    categoria: "Contaminantes"
  },
  {
    nombre: "Percentil 90",
    descripcion: "El 90% de las mediciones están por debajo de este valor. Indica niveles que se exceden solo el 10% del tiempo.",
    categoria: "Contaminantes"
  },
  {
    nombre: "Percentil 95",
    descripcion: "El 95% de las mediciones están por debajo de este valor. Representa situaciones de alta contaminación menos frecuentes.",
    categoria: "Contaminantes"
  },
  {
    nombre: "Percentil 98",
    descripcion: "El 98% de las mediciones están por debajo de este valor. Indica episodios de contaminación muy elevada.",
    categoria: "Contaminantes"
  },
  {
    nombre: "Percentil 99",
    descripcion: "El 99% de las mediciones están por debajo de este valor. Representa los eventos de contaminación más extremos.",
    categoria: "Contaminantes"
  },
  {
    nombre: "Media Mensual",
    descripcion: "Promedio de todas las mediciones durante un mes específico. Útil para identificar tendencias estacionales.",
    categoria: "Contaminantes"
  },

  // TEMPERATURA
  {
    nombre: "Temperatura Máxima Absoluta",
    descripcion: "La temperatura más alta registrada en el período de medición.",
    unidad: "°C",
    categoria: "Temperatura"
  },
  {
    nombre: "Temperatura Mínima Absoluta",
    descripcion: "La temperatura más baja registrada en el período de medición.",
    unidad: "°C",
    categoria: "Temperatura"
  },
  {
    nombre: "Temperatura Máxima Media",
    descripcion: "Promedio de las temperaturas máximas diarias. Indica qué tan caluroso es típicamente el período.",
    unidad: "°C",
    categoria: "Temperatura"
  },
  {
    nombre: "Temperatura Mínima Media",
    descripcion: "Promedio de las temperaturas mínimas diarias. Indica qué tan frío es típicamente el período.",
    unidad: "°C",
    categoria: "Temperatura"
  },
  {
    nombre: "Temperatura Media",
    descripcion: "Promedio de todas las temperaturas registradas. Representa la temperatura típica del período.",
    unidad: "°C",
    categoria: "Temperatura"
  },

  // HUMEDAD Y RADIACIÓN
  {
    nombre: "Humedad Relativa Media Mensual",
    descripcion: "Porcentaje promedio de humedad en el aire. Afecta la sensación térmica y la calidad del aire.",
    unidad: "%",
    rangoSaludable: "30-60% (confortable)",
    categoria: "Humedad"
  },
  {
    nombre: "Radiación Global Media",
    descripcion: "Cantidad promedio de radiación solar recibida. Importante para energía solar y estudios climáticos.",
    unidad: "W/m²",
    categoria: "Humedad"
  },
  {
    nombre: "UVB Promedio",
    descripcion: "Radiación ultravioleta B promedio. Alta exposición puede causar daño en la piel y ojos.",
    unidad: "mW/m²",
    rangoSaludable: "0-2 (bajo), >8 (muy alto)",
    categoria: "Humedad"
  },

  // EVENTOS
  {
    nombre: "Olas de Calor",
    descripcion: "Períodos prolongados de temperaturas anormalmente altas. Pueden causar estrés térmico, deshidratación y otros problemas de salud.",
    categoria: "Eventos"
  }
];

interface GlosarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlosarioModal({ isOpen, onClose }: GlosarioModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("Todas");

  if (!isOpen) return null;

  const categorias = ["Todas", "Contaminantes", "Temperatura", "Humedad", "Eventos"];

  const metricasFiltradas = GLOSARIO.filter(metrica => {
    const matchBusqueda = metrica.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          metrica.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = categoriaFiltro === "Todas" || metrica.categoria === categoriaFiltro;
    return matchBusqueda && matchCategoria;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Glosario de Métricas Ambientales</h2>
                <p className="text-emerald-100 text-sm mt-1">
                  Entiende qué significa cada indicador
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Búsqueda */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar métrica..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>

          {/* Filtros de categoría */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  categoriaFiltro === cat
                    ? 'bg-white text-emerald-600 font-semibold'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
          {metricasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No se encontraron métricas</p>
              <p className="text-sm mt-2">Intenta con otro término de búsqueda</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {metricasFiltradas.map((metrica, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-emerald-700">
                          {metrica.nombre}
                        </CardTitle>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
                            {metrica.categoria}
                          </span>
                          {metrica.unidad && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                              {metrica.unidad}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {metrica.descripcion}
                    </p>
                    {metrica.rangoSaludable && (
                      <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                        <p className="text-sm font-semibold text-emerald-900 mb-1">
                          📊 Rangos de referencia:
                        </p>
                        <p className="text-sm text-emerald-800">
                          {metrica.rangoSaludable}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {metricasFiltradas.length} {metricasFiltradas.length === 1 ? 'métrica' : 'métricas'} encontrada(s)
          </p>
          <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
