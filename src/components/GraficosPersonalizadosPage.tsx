import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Loader2 } from 'lucide-react';

const API_BASE_URL = "http://localhost:8000/api/private";

// Colores para las líneas del gráfico
const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

interface LineConfig {
  id: string;
  fuente: "aire" | "agua" | null;
  tipo: string;
  subtipo: string;
  agregacion?: string;
  campo: string;
  entidad: string;
  label: string;
  color: string;
  datos: any[];
  loading: boolean;
}

export function GraficosPageContent() {
  // Estado para las líneas del gráfico
  const [lines, setLines] = useState<LineConfig[]>([]);

  // Estado para el formulario de agregar línea
  const [formData, setFormData] = useState({
    fuente: null as "aire" | "agua" | null,
    tipo: "",
    subtipo: "",
    agregacion: "",
    campo: "",
    entidad: ""
  });

  // Estados para las opciones de los selects
  const [tiposDisponibles, setTiposDisponibles] = useState<any>({});
  const [subtiposDisponibles, setSubtiposDisponibles] = useState<any>({});
  const [agregacionesDisponibles, setAgregacionesDisponibles] = useState<any[]>([]);
  const [camposDisponibles, setCamposDisponibles] = useState<any[]>([]);
  const [entidadesDisponibles, setEntidadesDisponibles] = useState<string[]>([]);

  // Estado de carga
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingEntidades, setLoadingEntidades] = useState(false);

  // Cargar tipos cuando se selecciona fuente
  useEffect(() => {
    if (!formData.fuente) {
      setTiposDisponibles({});
      return;
    }

    setLoadingTipos(true);
    const endpoint = formData.fuente === "aire" ? "/graficos/tipos-aire" : "/graficos/tipos-agua";

    fetch(`${API_BASE_URL}${endpoint}`)
      .then(res => res.json())
      .then(data => {
        setTiposDisponibles(data);
        setLoadingTipos(false);
      })
      .catch(err => {
        console.error("Error cargando tipos:", err);
        setLoadingTipos(false);
      });
  }, [formData.fuente]);

  // Actualizar subtipos cuando se selecciona tipo
  useEffect(() => {
    if (!formData.tipo || !tiposDisponibles[formData.tipo]) {
      setSubtiposDisponibles({});
      return;
    }

    setSubtiposDisponibles(tiposDisponibles[formData.tipo].subtipos);
  }, [formData.tipo, tiposDisponibles]);

  // Actualizar campos y agregaciones cuando se selecciona subtipo
  useEffect(() => {
    if (!formData.subtipo || !subtiposDisponibles[formData.subtipo]) {
      setCamposDisponibles([]);
      setAgregacionesDisponibles([]);
      return;
    }

    const subtipoData = subtiposDisponibles[formData.subtipo];

    if (subtipoData.agregaciones) {
      // Tiene agregaciones (anual/mensual)
      setAgregacionesDisponibles(subtipoData.agregaciones);
      setCamposDisponibles([]);
    } else {
      // No tiene agregaciones, cargar campos directamente
      setAgregacionesDisponibles([]);
      setCamposDisponibles(subtipoData.campos || []);
    }
  }, [formData.subtipo, subtiposDisponibles]);

  // Actualizar campos cuando se selecciona agregación
  useEffect(() => {
    if (!formData.agregacion || agregacionesDisponibles.length === 0) {
      return;
    }

    const agregacionData = agregacionesDisponibles.find(a => a.tipo === formData.agregacion);
    if (agregacionData) {
      setCamposDisponibles(agregacionData.campos || []);
    }
  }, [formData.agregacion, agregacionesDisponibles]);

  // Cargar entidades cuando se tienen todos los datos necesarios
  useEffect(() => {
    if (!formData.fuente || !formData.tipo || !formData.subtipo) {
      setEntidadesDisponibles([]);
      return;
    }

    // Si tiene agregaciones pero no se seleccionó, no cargar entidades
    if (agregacionesDisponibles.length > 0 && !formData.agregacion) {
      setEntidadesDisponibles([]);
      return;
    }

    setLoadingEntidades(true);

    const params = new URLSearchParams({
      tipo: formData.tipo,
      subtipo: formData.subtipo
    });

    if (formData.agregacion) {
      params.append("agregacion", formData.agregacion);
    }

    const endpoint = formData.fuente === "aire"
      ? `/graficos/estaciones-aire?${params}`
      : `/graficos/estaciones-agua?${params}`;

    fetch(`${API_BASE_URL}${endpoint}`)
      .then(res => res.json())
      .then(data => {
        setEntidadesDisponibles(data.estaciones || data.entidades || []);
        setLoadingEntidades(false);
      })
      .catch(err => {
        console.error("Error cargando entidades:", err);
        setLoadingEntidades(false);
      });
  }, [formData.fuente, formData.tipo, formData.subtipo, formData.agregacion, agregacionesDisponibles]);

  // Función para agregar una nueva línea al gráfico
  const agregarLinea = async () => {
    if (!formData.fuente || !formData.tipo || !formData.subtipo || !formData.campo || !formData.entidad) {
      alert("Por favor completa todos los campos");
      return;
    }

    const lineId = `${Date.now()}-${Math.random()}`;
    const colorIndex = lines.length % COLORS.length;

    // Obtener el label del campo
    const campoData = camposDisponibles.find(c => c.key === formData.campo);
    const label = `${formData.entidad} - ${campoData?.label || formData.campo}`;

    // Crear nueva línea con estado de carga
    const newLine: LineConfig = {
      id: lineId,
      fuente: formData.fuente,
      tipo: formData.tipo,
      subtipo: formData.subtipo,
      agregacion: formData.agregacion || undefined,
      campo: formData.campo,
      entidad: formData.entidad,
      label,
      color: COLORS[colorIndex],
      datos: [],
      loading: true
    };

    setLines(prev => [...prev, newLine]);

    // Cargar datos
    try {
      const params = new URLSearchParams({
        tipo: formData.tipo,
        subtipo: formData.subtipo,
        campo: formData.campo,
        [formData.fuente === "aire" ? "estacion" : "entidad"]: formData.entidad
      });

      if (formData.agregacion) {
        params.append("agregacion", formData.agregacion);
      }

      const endpoint = formData.fuente === "aire"
        ? `/graficos/datos-aire?${params}`
        : `/graficos/datos-agua?${params}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await response.json();

      // Actualizar la línea con los datos
      setLines(prev => prev.map(line =>
        line.id === lineId
          ? { ...line, datos: data.datos, loading: false }
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
      fuente: null,
      tipo: "",
      subtipo: "",
      agregacion: "",
      campo: "",
      entidad: ""
    });
    setTiposDisponibles({});
    setSubtiposDisponibles({});
    setAgregacionesDisponibles([]);
    setCamposDisponibles([]);
    setEntidadesDisponibles([]);
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

  return (
    <div className="pt-32 pb-16 max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Gráficos Personalizados</h1>
        <p className="text-lg text-gray-600">
          Crea gráficos personalizados combinando métricas de aire y agua
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Panel de Configuración - Vertical */}
        <div className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Configuración de Datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selector de Fuente */}
              <div>
                <label className="font-semibold text-sm mb-2 block">Fuente de Datos</label>
                <Select
                  value={formData.fuente || ""}
                  onValueChange={(value) => {
                    resetForm();
                    setFormData(prev => ({ ...prev, fuente: value as "aire" | "agua" }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona fuente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aire">Aire</SelectItem>
                    <SelectItem value="agua">Agua</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selector de Tipo */}
              {formData.fuente && (
                <div>
                  <label className="font-semibold text-sm mb-2 block">Tipo de Métrica</label>
                  {loadingTipos ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : (
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        tipo: value,
                        subtipo: "",
                        agregacion: "",
                        campo: "",
                        entidad: ""
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(tiposDisponibles).map(([key, value]: any) => (
                          <SelectItem key={key} value={key}>
                            {value.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Selector de Subtipo */}
              {formData.tipo && (
                <div>
                  <label className="font-semibold text-sm mb-2 block">Subtipo</label>
                  <Select
                    value={formData.subtipo}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      subtipo: value,
                      agregacion: "",
                      campo: "",
                      entidad: ""
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona subtipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(subtiposDisponibles).map(([key, value]: any) => (
                        <SelectItem key={key} value={key}>
                          {value.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Selector de Agregación (si aplica) */}
              {agregacionesDisponibles.length > 0 && (
                <div>
                  <label className="font-semibold text-sm mb-2 block">Agregación</label>
                  <Select
                    value={formData.agregacion}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      agregacion: value,
                      campo: "",
                      entidad: ""
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona agregación..." />
                    </SelectTrigger>
                    <SelectContent>
                      {agregacionesDisponibles.map((agg: any) => (
                        <SelectItem key={agg.tipo} value={agg.tipo}>
                          {agg.tipo.charAt(0).toUpperCase() + agg.tipo.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Selector de Campo */}
              {camposDisponibles.length > 0 && (
                <div>
                  <label className="font-semibold text-sm mb-2 block">Campo a Graficar</label>
                  <Select
                    value={formData.campo}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, campo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona campo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {camposDisponibles.map((campo: any) => (
                        <SelectItem key={campo.key} value={campo.key}>
                          {campo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Selector de Entidad/Estación */}
              {formData.campo && (
                <div>
                  <label className="font-semibold text-sm mb-2 block">
                    {formData.fuente === "aire" ? "Estación" : "Entidad"}
                  </label>
                  {loadingEntidades ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : (
                    <Select
                      value={formData.entidad}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, entidad: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecciona ${formData.fuente === "aire" ? "estación" : "entidad"}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {entidadesDisponibles.map((entidad: string) => (
                          <SelectItem key={entidad} value={entidad}>
                            {entidad}
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
                disabled={!formData.entidad || !formData.campo}
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
        </div>

        {/* Área del Gráfico - Horizontal */}
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Visualización</CardTitle>
            </CardHeader>
            <CardContent className="h-[600px] pt-4">
              {lines.length === 0 ? (
                // Skeleton del gráfico vacío
                <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                  <LineChart className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Agrega datos para ver el gráfico</p>
                  <p className="text-sm mt-2">Selecciona una métrica en el panel de la izquierda</p>
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
        </div>
      </div>
    </div>
  );
}
