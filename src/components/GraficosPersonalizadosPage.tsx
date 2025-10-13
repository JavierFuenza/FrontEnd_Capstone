import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Loader2, BookOpen, Info, TrendingUp, AlertCircle } from 'lucide-react';
import { GlosarioModal } from './GlosarioModal';
import { AnalisisCorrelacion } from './AnalisisCorrelacion';

const API_BASE_URL = "http://localhost:8000/api/private";

// Colores para las líneas del gráfico
const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

interface LineConfig {
  id: string;
  region: string;
  estacion: string;
  metrica: string;
  submetrica: string;
  label: string;
  color: string;
  datos: any[];
  loading: boolean;
}

interface Region {
  numero_region: number;
  nombre_region: string;
}

interface Estacion {
  id: number;
  nombre: string;
  descripcion: string;
  numero_region: number;
  nombre_region: string;
  latitud?: number;
  longitud?: number;
}

// Diccionario de descripciones rápidas
const DESCRIPCIONES_RAPIDAS: Record<string, string> = {
  "MP2.5": "Partículas finas menores a 2.5 micrómetros. Afectan pulmones y corazón.",
  "MP10": "Partículas inhalables hasta 10 micrómetros. Causan irritación respiratoria.",
  "O3": "Ozono a nivel del suelo. Irrita vías respiratorias, especialmente en verano.",
  "SO2": "Gas de combustión industrial. Contribuye a problemas respiratorios y lluvia ácida.",
  "NO2": "Gas de vehículos e industrias. Agrava enfermedades como el asma.",
  "CO": "Gas tóxico sin olor. Reduce oxígeno en la sangre.",
  "Temperatura": "Mediciones de calor del ambiente en grados Celsius.",
  "Humedad": "Porcentaje de vapor de agua en el aire.",
  "Percentil": "Valor estadístico que divide los datos en porcentajes."
};

export function GraficosPageContent() {
  // Estado para las líneas del gráfico
  const [lines, setLines] = useState<LineConfig[]>([]);

  // Estado para el formulario de agregar línea
  const [formData, setFormData] = useState({
    region: "",
    estacion: "",
    estacionId: null as number | null,
    metrica: "",
    submetrica: ""
  });

  // Estados para las opciones de los selects
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [estaciones, setEstaciones] = useState<Estacion[]>([]);
  const [metricas, setMetricas] = useState<string[]>([]);
  const [submetricas, setSubmetricas] = useState<string[]>([]);

  // Estados de carga
  const [loadingRegiones, setLoadingRegiones] = useState(false);
  const [loadingEstaciones, setLoadingEstaciones] = useState(false);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  const [loadingSubmetricas, setLoadingSubmetricas] = useState(false);

  // Estado del modal de glosario
  const [showGlosario, setShowGlosario] = useState(false);

  // 1️⃣ Cargar regiones al inicio
  useEffect(() => {
    setLoadingRegiones(true);
    fetch(`${API_BASE_URL}/estaciones/regiones`)
      .then(res => res.json())
      .then(data => {
        setRegiones(data);
        setLoadingRegiones(false);
      })
      .catch(err => {
        console.error("Error cargando regiones:", err);
        setLoadingRegiones(false);
      });
  }, []);

  // 2️⃣ Cargar estaciones cuando se selecciona región
  useEffect(() => {
    if (!formData.region) {
      setEstaciones([]);
      return;
    }

    setLoadingEstaciones(true);
    fetch(`${API_BASE_URL}/estaciones/?numero_region=${formData.region}`)
      .then(res => res.json())
      .then(data => {
        setEstaciones(data);
        setLoadingEstaciones(false);
      })
      .catch(err => {
        console.error("Error cargando estaciones:", err);
        setLoadingEstaciones(false);
      });
  }, [formData.region]);

  // 3️⃣ Cargar métricas cuando se selecciona estación
  useEffect(() => {
    if (!formData.estacion || !formData.estacionId) {
      setMetricas([]);
      return;
    }

    setLoadingMetricas(true);
    fetch(`${API_BASE_URL}/estaciones/metricas?estacion_id=${formData.estacionId}`)
      .then(res => res.json())
      .then(data => {
        setMetricas(data.metricas_disponibles || []);
        setLoadingMetricas(false);
      })
      .catch(err => {
        console.error("Error cargando métricas:", err);
        setLoadingMetricas(false);
      });
  }, [formData.estacion, formData.estacionId]);

  // 4️⃣ Cargar submmétricas cuando se selecciona métrica
  useEffect(() => {
    if (!formData.metrica || !formData.estacionId) {
      setSubmetricas([]);
      return;
    }

    setLoadingSubmetricas(true);
    fetch(`${API_BASE_URL}/estaciones/submetricas?metrica=${encodeURIComponent(formData.metrica)}&estacion_id=${formData.estacionId}`)
      .then(res => res.json())
      .then(data => {
        setSubmetricas(data.submetricas_disponibles || []);
        setLoadingSubmetricas(false);
      })
      .catch(err => {
        console.error("Error cargando submmétricas:", err);
        setLoadingSubmetricas(false);
      });
  }, [formData.metrica, formData.estacionId]);

  // Función para agregar una nueva línea al gráfico
  const agregarLinea = async () => {
    if (!formData.region || !formData.estacion || !formData.metrica || !formData.submetrica || !formData.estacionId) {
      alert("Por favor completa todos los campos");
      return;
    }

    const lineId = `${Date.now()}-${Math.random()}`;
    const colorIndex = lines.length % COLORS.length;

    const regionNombre = regiones.find(r => r.numero_region.toString() === formData.region)?.nombre_region || formData.region;
    const label = `${formData.estacion} - ${formData.submetrica}`;

    // Crear nueva línea con estado de carga
    const newLine: LineConfig = {
      id: lineId,
      region: regionNombre,
      estacion: formData.estacion,
      metrica: formData.metrica,
      submetrica: formData.submetrica,
      label,
      color: COLORS[colorIndex],
      datos: [],
      loading: true
    };

    setLines(prev => [...prev, newLine]);

    // Cargar datos
    try {
      const response = await fetch(
        `${API_BASE_URL}/estaciones/datos-submetrica?submetrica=${encodeURIComponent(formData.submetrica)}&estacion_id=${formData.estacionId}`
      );

      if (!response.ok) {
        throw new Error('Error al cargar datos');
      }

      const data = await response.json();

      // Actualizar la línea con los datos
      setLines(prev => prev.map(line =>
        line.id === lineId
          ? { ...line, datos: data.datos || [], loading: false }
          : line
      ));
    } catch (err) {
      console.error("Error cargando datos:", err);
      // Remover la línea si falla
      setLines(prev => prev.filter(line => line.id !== lineId));
      alert("Error al cargar los datos. Por favor intenta nuevamente.");
    }
  };

  // Función para eliminar una línea
  const eliminarLinea = (lineId: string) => {
    setLines(prev => prev.filter(line => line.id !== lineId));
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setFormData({
      region: "",
      estacion: "",
      estacionId: null,
      metrica: "",
      submetrica: ""
    });
    setEstaciones([]);
    setMetricas([]);
    setSubmetricas([]);
  };

  // Preparar datos para el gráfico combinando todas las líneas
  const prepararDatosGrafico = () => {
    if (lines.length === 0) return [];

    // Crear un mapa de periodos con todos los valores
    const periodoMap = new Map<string, any>();

    lines.forEach(line => {
      if (!line.loading && line.datos.length > 0) {
        line.datos.forEach(dato => {
          const periodo = dato.periodo;
          if (!periodoMap.has(periodo)) {
            periodoMap.set(periodo, { periodo });
          }
          periodoMap.get(periodo)[line.id] = dato.valor;
        });
      }
    });

    // Convertir a array y ordenar por periodo
    return Array.from(periodoMap.values()).sort((a, b) => {
      return a.periodo.localeCompare(b.periodo);
    });
  };

  const datosGrafico = prepararDatosGrafico();

  // Obtener descripción rápida de la métrica actual
  const getDescripcionRapida = () => {
    if (!formData.metrica) return null;

    // Buscar en el diccionario
    for (const [key, desc] of Object.entries(DESCRIPCIONES_RAPIDAS)) {
      if (formData.metrica.includes(key)) {
        return desc;
      }
    }
    return null;
  };

  return (
    <>
      <div className="pt-32 pb-16 max-w-7xl mx-auto px-6">
        {/* Header con botón de glosario */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">Gráficos Personalizados</h1>
            <Button
              onClick={() => setShowGlosario(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
              size="sm"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Glosario
            </Button>
          </div>
          <p className="text-lg text-gray-600">
            Crea gráficos personalizados combinando métricas ambientales
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Panel de Configuración - Vertical */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Datos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 1️⃣ Selector de Región */}
                <div>
                  <label className="font-semibold text-sm mb-2 block">1. Región</label>
                  {loadingRegiones ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : (
                    <Select
                      value={formData.region}
                      onValueChange={(value) => {
                        setFormData({
                          region: value,
                          estacion: "",
                          estacionId: null,
                          metrica: "",
                          submetrica: ""
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona región..." />
                      </SelectTrigger>
                      <SelectContent>
                        {regiones.map((region) => (
                          <SelectItem key={region.numero_region} value={region.numero_region.toString()}>
                            {region.nombre_region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* 2️⃣ Selector de Estación */}
                {formData.region && (
                  <div>
                    <label className="font-semibold text-sm mb-2 block">2. Estación</label>
                    {loadingEstaciones ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : (
                      <Select
                        value={formData.estacion}
                        onValueChange={(value) => {
                          const estacion = estaciones.find(e => e.nombre === value);
                          setFormData(prev => ({
                            ...prev,
                            estacion: value,
                            estacionId: estacion?.id || null,
                            metrica: "",
                            submetrica: ""
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona estación..." />
                        </SelectTrigger>
                        <SelectContent>
                          {estaciones.map((estacion) => (
                            <SelectItem key={estacion.id} value={estacion.nombre}>
                              {estacion.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* 3️⃣ Selector de Métrica */}
                {formData.estacion && (
                  <div>
                    <label className="font-semibold text-sm mb-2 block">3. Métrica</label>
                    {loadingMetricas ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : (
                      <Select
                        value={formData.metrica}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          metrica: value,
                          submetrica: ""
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona métrica..." />
                        </SelectTrigger>
                        <SelectContent>
                          {metricas.map((metrica) => (
                            <SelectItem key={metrica} value={metrica}>
                              {metrica}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* 4️⃣ Selector de Submétrica */}
                {formData.metrica && (
                  <div>
                    <label className="font-semibold text-sm mb-2 block">4. Submétrica (Campo a Graficar)</label>
                    {loadingSubmetricas ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : (
                      <Select
                        value={formData.submetrica}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, submetrica: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona campo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {submetricas.map((submetrica) => (
                            <SelectItem key={submetrica} value={submetrica}>
                              {submetrica}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Botón para agregar */}
                <Button
                  onClick={agregarLinea}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={!formData.submetrica}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar al Gráfico
                </Button>

                {/* Lista de líneas agregadas */}
                {lines.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold text-sm mb-3">Líneas en el Gráfico ({lines.length})</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {lines.map((line) => (
                        <div
                          key={line.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: line.color }}
                            />
                            <span className="text-xs truncate" title={line.label}>
                              {line.loading ? (
                                <span className="flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Cargando...
                                </span>
                              ) : (
                                line.label
                              )}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarLinea(line.id)}
                            className="flex-shrink-0 h-7 w-7 p-0"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 📊 Panel de Información Lateral */}
            {formData.metrica && (
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
                    <Info className="w-5 h-5" />
                    ¿Qué estoy viendo?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-emerald-900 mb-1">
                      Métrica seleccionada:
                    </h4>
                    <p className="text-sm text-emerald-800 font-medium">
                      {formData.metrica}
                    </p>
                  </div>

                  {getDescripcionRapida() && (
                    <div className="p-3 bg-white rounded-lg border border-emerald-200">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {getDescripcionRapida()}
                      </p>
                    </div>
                  )}

                  {formData.submetrica && (
                    <div>
                      <h4 className="font-semibold text-sm text-emerald-900 mb-1">
                        Campo actual:
                      </h4>
                      <p className="text-sm text-emerald-800">
                        {formData.submetrica}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => setShowGlosario(true)}
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Ver Glosario Completo
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Área del Gráfico - Horizontal */}
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Visualización
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[600px] pt-4">
                {lines.length === 0 ? (
                  // Skeleton del gráfico vacío
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    <p className="text-lg font-medium">Agrega datos para ver el gráfico</p>
                    <p className="text-sm mt-2">Selecciona Región → Estación → Métrica → Submétrica</p>
                  </div>
                ) : (
                  // Gráfico con datos
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datosGrafico} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="periodo"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {lines.filter(line => !line.loading).map((line) => (
                        <Line
                          key={line.id}
                          type="monotone"
                          dataKey={line.id}
                          name={line.label}
                          stroke={line.color}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* 🔍 Panel de Análisis de Correlación */}
            <AnalisisCorrelacion lines={lines} />
          </div>
        </div>
      </div>

      {/* Modal de Glosario */}
      <GlosarioModal isOpen={showGlosario} onClose={() => setShowGlosario(false)} />
    </>
  );
}
