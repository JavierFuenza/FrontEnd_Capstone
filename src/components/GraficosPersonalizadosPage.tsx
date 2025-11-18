import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Loader2, BookOpen, Info, TrendingUp, AlertCircle, Download, Calendar, Save, Eye, X, BarChart3 } from 'lucide-react';
import { GlosarioModal } from './GlosarioModal';
import { AnalisisCorrelacion } from './AnalisisCorrelacion';
import { AIExplainButton } from './AIExplainButton';
import { Toast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import html2canvas from 'html2canvas';
import { useAuth } from '@/contexts/AuthContext';
import { saveChart, getUserCharts, deleteChart, migrateLocalStorageCharts } from '@/lib/chartService';
import type { SavedChart as FirestoreSavedChart } from '@/lib/chartService';
import { EXTENDED_COLOR_PALETTE } from '@/lib/colorPalette';

const API_BASE_URL = `${import.meta.env.PUBLIC_API_BASE_URL}api/private`;

// Paleta de colores accesible para personas con daltonismo
// Colores distinguibles que consideran deuteranopia, protanopia y tritanopia
// Basada en las paletas de Paul Tol e IBM Design para accesibilidad
const COLORS = EXTENDED_COLOR_PALETTE;

interface LineConfig {
  id: string;
  label: string;
  color: string;
  datos: any[];
  loading: boolean;
  dataSource: 'aire' | 'agua';

  // Campos de aire
  region?: string;
  estacion?: string;
  metrica?: string;
  submetrica?: string;

  // Campos de agua
  tipoEntidad?: string;
  entidadAgua?: string;
  metricaAgua?: string;
  submetricaAgua?: string;
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

// Tooltip personalizado que trunca valores a 1 decimal
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{(Math.trunc(entry.value * 10) / 10).toFixed(1)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function GraficosPageContent() {
  // Hook de autenticación
  const { user } = useAuth();

  // Helper para cargar datos desde localStorage
  const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  // Helper para guardar datos en localStorage
  const saveToLocalStorage = <T,>(key: string, value: T) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  // Estado para las líneas del gráfico
  const [lines, setLines] = useState<LineConfig[]>(() =>
    getFromLocalStorage('graficos_lines', [])
  );

  // Referencia al contenedor del gráfico para exportar
  const chartRef = useRef<HTMLDivElement>(null);

  // Estado para filtro de años
  const [yearsFilter, setYearsFilter] = useState<number | null>(() =>
    getFromLocalStorage('graficos_yearsFilter', null)
  );

  // Estado para vista temporal (mensual/anual)
  const [temporalView, setTemporalView] = useState<'mensual' | 'anual'>(() =>
    getFromLocalStorage('graficos_temporalView', 'mensual')
  );

  // Estado para el tipo de fuente de datos
  const [dataSource, setDataSource] = useState<'aire' | 'agua'>(() =>
    getFromLocalStorage('graficos_dataSource', 'aire')
  );

  // Estado para el formulario de agregar línea
  const [formData, setFormData] = useState(() =>
    getFromLocalStorage('graficos_formData', {
      // Campos de aire
      region: "",
      estacion: "",
      estacionId: null as number | null,
      metrica: "",
      submetrica: "",
      // Campos de agua
      tipoEntidad: "",
      entidadAgua: "",
      metricaAgua: "",
      submetricaAgua: ""
    })
  );

  // Estados para las opciones de los selects de AIRE
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [estaciones, setEstaciones] = useState<Estacion[]>([]);
  const [metricas, setMetricas] = useState<string[]>([]);
  const [submetricas, setSubmetricas] = useState<string[]>([]);

  // Estados para las opciones de los selects de AGUA
  const [tiposEntidad, setTiposEntidad] = useState<string[]>([]);
  const [entidadesAgua, setEntidadesAgua] = useState<any[]>([]);
  const [metricasAgua, setMetricasAgua] = useState<string[]>([]);
  const [submetricasAgua, setSubmetricasAgua] = useState<string[]>([]);

  // Estado para búsqueda de entidades
  const [searchEntidad, setSearchEntidad] = useState('');
  const [searchRegion, setSearchRegion] = useState('');
  const [searchEstacion, setSearchEstacion] = useState('');

  // Estados de carga para AIRE
  const [loadingRegiones, setLoadingRegiones] = useState(false);
  const [loadingEstaciones, setLoadingEstaciones] = useState(false);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  const [loadingSubmetricas, setLoadingSubmetricas] = useState(false);

  // Estados de carga para AGUA
  const [loadingTiposEntidad, setLoadingTiposEntidad] = useState(false);
  const [loadingEntidadesAgua, setLoadingEntidadesAgua] = useState(false);
  const [loadingMetricasAgua, setLoadingMetricasAgua] = useState(false);
  const [loadingSubmetricasAgua, setLoadingSubmetricasAgua] = useState(false);

  // Estado del modal de glosario
  const [showGlosario, setShowGlosario] = useState(false);

  // Estado para tabs (Crear / Ver Guardados)
  const [activeTab, setActiveTab] = useState<'crear' | 'guardados'>('crear');

  // Estado para gráficos guardados
  interface SavedChart {
    id: string;
    nombre: string;
    lines: LineConfig[];
    yearsFilter: number | null;
    temporalView: 'mensual' | 'anual';
    fechaCreacion: string;
  }

  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [loadingSavedCharts, setLoadingSavedCharts] = useState(false);

  // Estado para modal de guardar gráfico
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [chartName, setChartName] = useState('');

  // Estado para toasts (notificaciones)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  // Estado para diálogos de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  } | null>(null);

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

  // 🔥 Cargar gráficos guardados del usuario desde Firestore
  useEffect(() => {
    const loadUserCharts = async () => {
      if (!user) return;

      setLoadingSavedCharts(true);
      try {
        // Intentar migrar gráficos de localStorage si existen
        const localCharts = localStorage.getItem('graficos_savedCharts');
        if (localCharts) {
          setConfirmDialog({
            title: 'Migrar gráficos a la nube',
            message: 'Se encontraron gráficos guardados localmente. ¿Deseas migrarlos a la nube?',
            type: 'info',
            onConfirm: async () => {
              await migrateLocalStorageCharts(user.uid);
              setToast({ message: 'Gráficos migrados exitosamente a la nube', type: 'success' });
              setConfirmDialog(null);
              // Recargar gráficos después de migrar
              const charts = await getUserCharts(user.uid);
              setSavedCharts(charts as SavedChart[]);
            }
          });
          return; // Salir temprano para mostrar el diálogo
        }

        // Cargar gráficos del usuario desde Firestore
        const charts = await getUserCharts(user.uid);
        setSavedCharts(charts as SavedChart[]);
      } catch (error) {
        console.error('Error cargando gráficos:', error);
        setToast({ message: 'Error al cargar los gráficos guardados', type: 'error' });
      } finally {
        setLoadingSavedCharts(false);
      }
    };

    loadUserCharts();
  }, [user]);

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
    if (!formData.estacion) {
      setMetricas([]);
      return;
    }

    setLoadingMetricas(true);
    fetch(`${API_BASE_URL}/estaciones/metricas?nombre=${encodeURIComponent(formData.estacion)}`)
      .then(res => res.json())
      .then(data => {
        setMetricas(data.metricas_disponibles || []);
        setLoadingMetricas(false);
      })
      .catch(err => {
        console.error("Error cargando métricas:", err);
        setLoadingMetricas(false);
      });
  }, [formData.estacion]);

  // 4️⃣ Cargar submmétricas cuando se selecciona métrica
  useEffect(() => {
    if (!formData.metrica || !formData.estacion) {
      setSubmetricas([]);
      return;
    }

    setLoadingSubmetricas(true);
    fetch(`${API_BASE_URL}/estaciones/submetricas?metrica=${encodeURIComponent(formData.metrica)}&nombre=${encodeURIComponent(formData.estacion)}`)
      .then(res => res.json())
      .then(data => {
        setSubmetricas(data.submetricas_disponibles || []);
        setLoadingSubmetricas(false);
      })
      .catch(err => {
        console.error("Error cargando submmétricas:", err);
        setLoadingSubmetricas(false);
      });
  }, [formData.metrica, formData.estacion]);

  // Persistir estado en localStorage
  useEffect(() => {
    saveToLocalStorage('graficos_lines', lines);
  }, [lines]);

  useEffect(() => {
    saveToLocalStorage('graficos_yearsFilter', yearsFilter);
  }, [yearsFilter]);

  useEffect(() => {
    saveToLocalStorage('graficos_temporalView', temporalView);
  }, [temporalView]);

  useEffect(() => {
    saveToLocalStorage('graficos_formData', formData);
  }, [formData]);

  useEffect(() => {
    saveToLocalStorage('graficos_dataSource', dataSource);
  }, [dataSource]);

  // === FLUJO EN CASCADA PARA DATOS DE AGUA ===

  // 1️⃣ Cargar tipos de entidad cuando se selecciona "agua"
  useEffect(() => {
    if (dataSource === 'agua') {
      setLoadingTiposEntidad(true);
      fetch(`${API_BASE_URL}/entidades-agua/tipos`)
        .then(res => res.json())
        .then(data => {
          setTiposEntidad(data);
          setLoadingTiposEntidad(false);
        })
        .catch(err => {
          console.error("Error cargando tipos de entidad:", err);
          setLoadingTiposEntidad(false);
        });
    }
  }, [dataSource]);

  // 2️⃣ Cargar entidades cuando se selecciona tipo
  useEffect(() => {
    if (dataSource === 'agua' && formData.tipoEntidad) {
      setLoadingEntidadesAgua(true);
      fetch(`${API_BASE_URL}/entidades-agua/tipo/${encodeURIComponent(formData.tipoEntidad)}`)
        .then(res => res.json())
        .then(data => {
          setEntidadesAgua(data);
          setLoadingEntidadesAgua(false);
        })
        .catch(err => {
          console.error("Error cargando entidades:", err);
          setLoadingEntidadesAgua(false);
        });

      // Reset campos dependientes
      setFormData(prev => ({ ...prev, entidadAgua: '', metricaAgua: '', submetricaAgua: '' }));
    }
  }, [formData.tipoEntidad, dataSource]);

  // 3️⃣ Cargar métricas cuando se selecciona entidad
  useEffect(() => {
    if (dataSource === 'agua' && formData.entidadAgua) {
      setLoadingMetricasAgua(true);
      fetch(`${API_BASE_URL}/entidades-agua/metricas/${encodeURIComponent(formData.entidadAgua)}`)
        .then(res => res.json())
        .then(data => {
          setMetricasAgua(data);
          setLoadingMetricasAgua(false);

          // Si solo hay 1 métrica, auto-seleccionarla
          if (data.length === 1) {
            setFormData(prev => ({ ...prev, metricaAgua: data[0] }));
          }
        })
        .catch(err => {
          console.error("Error cargando métricas de agua:", err);
          setLoadingMetricasAgua(false);
        });

      // Reset campos dependientes
      setFormData(prev => ({ ...prev, metricaAgua: '', submetricaAgua: '' }));
    }
  }, [formData.entidadAgua, dataSource]);

  // 4️⃣ Cargar submétricas cuando se selecciona métrica
  useEffect(() => {
    if (dataSource === 'agua' && formData.metricaAgua && formData.entidadAgua) {
      setLoadingSubmetricasAgua(true);
      fetch(`${API_BASE_URL}/entidades-agua/submetricas/${encodeURIComponent(formData.metricaAgua)}/${encodeURIComponent(formData.entidadAgua)}`)
        .then(res => res.json())
        .then(data => {
          setSubmetricasAgua(data.submetricas || []);
          setLoadingSubmetricasAgua(false);

          // Si solo hay 1 submétrica, auto-seleccionarla
          if (data.submetricas && data.submetricas.length === 1) {
            setFormData(prev => ({ ...prev, submetricaAgua: data.submetricas[0] }));
          }
        })
        .catch(err => {
          console.error("Error cargando submétricas de agua:", err);
          setLoadingSubmetricasAgua(false);
        });

      // Reset campo dependiente
      setFormData(prev => ({ ...prev, submetricaAgua: '' }));
    }
  }, [formData.metricaAgua, dataSource]);

  // 🔥 Los gráficos ya NO se guardan en localStorage, ahora se usan funciones de Firestore
  // Persist saved charts
  // useEffect(() => {
  //   saveToLocalStorage('graficos_savedCharts', savedCharts);
  // }, [savedCharts]);

  // Recargar datos de líneas guardadas al montar el componente
  useEffect(() => {
    // Solo recargar si hay líneas guardadas y no tienen datos
    if (lines.length > 0) {
      lines.forEach(line => {
        if (line.datos.length === 0 && !line.loading) {
          // Recargar datos de la línea
          recargarLineaDesdeAPI(line);
        }
      });
    }
  }, []); // Solo ejecutar al montar

  // Función auxiliar para recargar datos de una línea desde la API
  const recargarLineaDesdeAPI = async (line: LineConfig) => {
    try {
      // Marcar como cargando
      setLines(prev => prev.map(l =>
        l.id === line.id ? { ...l, loading: true } : l
      ));

      let data;
      if (line.dataSource === 'agua') {
        // Recargar datos de agua
        const response = await fetch(
          `${API_BASE_URL}/entidades-agua/datos/${encodeURIComponent(line.entidadAgua!)}/${encodeURIComponent(line.metricaAgua!)}`
        );

        if (!response.ok) throw new Error('Error al cargar datos');

        const rawData = await response.json();
        data = processAguaData(rawData, line.metricaAgua!, line.submetricaAgua!);
      } else {
        // Recargar datos de aire
        const response = await fetch(
          `${API_BASE_URL}/estaciones/datos-submetrica?submetrica=${encodeURIComponent(line.submetrica!)}&nombre=${encodeURIComponent(line.estacion!)}`
        );

        if (!response.ok) throw new Error('Error al cargar datos');

        const result = await response.json();
        data = result.datos || [];
      }

      // Actualizar con los datos
      setLines(prev => prev.map(l =>
        l.id === line.id ? { ...l, datos: data, loading: false } : l
      ));
    } catch (error) {
      console.error(`Error recargando línea ${line.label}:`, error);
      // Marcar como no cargando aunque haya error
      setLines(prev => prev.map(l =>
        l.id === line.id ? { ...l, loading: false } : l
      ));
    }
  };

  // Función para procesar datos de agua según el tipo
  const processAguaData = (data: any[], tipo: string, submetrica: string) => {
    // Para tipos con múltiples columnas (Oceanográfica, Cuenca)
    if (tipo === 'Estación Oceanográfica') {
      return data.map(item => ({
        periodo: item.mes,
        valor: submetrica === 'Temp Superficial Del Mar'
          ? item.temp_superficial_del_mar
          : item.nivel_medio_del_mar
      }));
    } else if (tipo === 'Cuenca Hidrográfica') {
      const keyMap: Record<string, string> = {
        'Número de glaciares': 'num_glaciares_por_cuenca',
        'Superficie de glaciares (km²)': 'superficie_de_glaciares_por_cuenca',
        'Volumen de hielo glaciar estimado (km³)': 'volumen_de_hielo_glaciar_estimado_por_cuenca',
        'Volumen de agua de glaciares estimada (km³)': 'volumen_de_agua_de_glaciares_estimada_por_cuenca'
      };
      return data.map(item => ({
        periodo: item.anio?.toString() || item.mes, // Usar año como eje X
        valor: item[keyMap[submetrica]]
      }));
    } else if (tipo === 'Estación Costera - Metales Disueltos' || tipo === 'Estación Costera - Metales Sedimentos') {
      // Filtrar por parámetro específico
      return data
        .filter(item => item.parametros_poal === submetrica)
        .map(item => ({
          periodo: item.dia,
          valor: item.value
        }));
    } else {
      // Tipos con valor único
      return data.map(item => ({
        periodo: item.mes || item.dia || item.anio?.toString(),
        valor: item.value
      }));
    }
  };

  // Función para agregar una nueva línea al gráfico
  const agregarLinea = async () => {
    if (dataSource === 'aire') {
      // Validación para datos de aire
      if (!formData.region || !formData.estacion || !formData.metrica || !formData.submetrica) {
        setToast({ message: 'Por favor completa todos los campos', type: 'warning' });
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
        loading: true,
        dataSource: 'aire'
      };

      setLines(prev => [...prev, newLine]);

      // Cargar datos
      try {
        const response = await fetch(
          `${API_BASE_URL}/estaciones/datos-submetrica?submetrica=${encodeURIComponent(formData.submetrica)}&nombre=${encodeURIComponent(formData.estacion)}`
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
        setToast({ message: 'Error al cargar los datos. Por favor intenta nuevamente.', type: 'error' });
      }
    } else {
      // Validación para datos de agua
      const { tipoEntidad, entidadAgua, metricaAgua, submetricaAgua } = formData;

      if (!tipoEntidad || !entidadAgua || !metricaAgua) {
        setToast({ message: 'Por favor completa todos los campos requeridos', type: 'warning' });
        return;
      }

      // Si el tipo requiere submétrica y no está seleccionada
      if (submetricasAgua.length > 1 && !submetricaAgua) {
        setToast({ message: 'Por favor selecciona una submétrica', type: 'warning' });
        return;
      }

      const lineId = `${Date.now()}-${Math.random()}`;
      const colorIndex = lines.length % COLORS.length;
      const submetricaFinal = submetricaAgua || (submetricasAgua.length === 1 ? submetricasAgua[0] : metricaAgua);
      const label = submetricaAgua
        ? `${entidadAgua} - ${submetricaAgua}`
        : `${entidadAgua} - ${metricaAgua}`;

      const newLine: LineConfig = {
        id: lineId,
        tipoEntidad,
        entidadAgua,
        metricaAgua,
        submetricaAgua: submetricaFinal,
        label,
        color: COLORS[colorIndex],
        datos: [],
        loading: true,
        dataSource: 'agua'
      };

      setLines(prev => [...prev, newLine]);

      // Fetch datos
      try {
        const response = await fetch(
          `${API_BASE_URL}/entidades-agua/datos/${encodeURIComponent(entidadAgua)}/${encodeURIComponent(metricaAgua)}`
        );

        if (!response.ok) {
          throw new Error('Error al cargar datos');
        }

        const data = await response.json();

        // Procesar datos según estructura
        const processedData = processAguaData(data, metricaAgua, submetricaFinal);

        setLines(prev => prev.map(line =>
          line.id === lineId
            ? { ...line, datos: processedData, loading: false }
            : line
        ));
      } catch (error) {
        console.error('Error cargando datos de agua:', error);
        setLines(prev => prev.filter(line => line.id !== lineId));
        setToast({ message: 'Error al cargar los datos de agua', type: 'error' });
      }
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
      submetrica: "",
      tipoEntidad: "",
      entidadAgua: "",
      metricaAgua: "",
      submetricaAgua: ""
    });
    setEstaciones([]);
    setMetricas([]);
    setSubmetricas([]);
    setEntidadesAgua([]);
    setMetricasAgua([]);
    setSubmetricasAgua([]);
    setSearchEntidad('');
  };

  // Función para guardar el gráfico actual
  const guardarGrafico = () => {
    if (lines.length === 0) {
      setToast({ message: 'No hay líneas en el gráfico para guardar', type: 'warning' });
      return;
    }
    setShowSaveModal(true);
  };

  // Función para confirmar el guardado con nombre
  const confirmarGuardado = async () => {
    if (!chartName.trim()) {
      setToast({ message: 'Por favor ingresa un nombre para el gráfico', type: 'warning' });
      return;
    }

    if (!user) {
      setToast({ message: 'Debes iniciar sesión para guardar gráficos', type: 'warning' });
      return;
    }

    try {
      // Guardar en Firestore
      const chartId = await saveChart(user.uid, {
        nombre: chartName,
        lines: lines,
        yearsFilter: yearsFilter,
        temporalView: temporalView
      });

      // Agregar al estado local con el ID de Firestore
      const newChart: SavedChart = {
        id: chartId,
        nombre: chartName,
        lines: lines,
        yearsFilter: yearsFilter,
        temporalView: temporalView,
        fechaCreacion: new Date().toISOString()
      };

      setSavedCharts(prev => [...prev, newChart]);
      setShowSaveModal(false);
      setChartName('');
      setToast({ message: `Gráfico "${chartName}" guardado exitosamente en la nube`, type: 'success' });
    } catch (error) {
      console.error('Error al guardar gráfico:', error);
      setToast({ message: 'Error al guardar el gráfico. Por favor, intenta de nuevo.', type: 'error' });
    }
  };

  // Función para cargar un gráfico guardado
  const cargarGrafico = (chart: SavedChart) => {
    setLines(chart.lines);
    setYearsFilter(chart.yearsFilter);
    setTemporalView(chart.temporalView);
    setActiveTab('crear');

    // Recargar datos de las líneas
    chart.lines.forEach(line => {
      recargarLineaDesdeAPI(line);
    });
  };

  // Función para eliminar un gráfico guardado
  const eliminarGraficoGuardado = async (chartId: string) => {
    setConfirmDialog({
      title: '¿Estás seguro?',
      message: '¿Estás seguro de eliminar este gráfico guardado? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        try {
          // Eliminar de Firestore
          await deleteChart(chartId);

          // Actualizar estado local
          setSavedCharts(prev => prev.filter(chart => chart.id !== chartId));
          setToast({ message: 'Gráfico eliminado exitosamente', type: 'success' });
          setConfirmDialog(null);
        } catch (error) {
          console.error('Error al eliminar gráfico:', error);
          setToast({ message: 'Error al eliminar el gráfico. Por favor, intenta de nuevo.', type: 'error' });
          setConfirmDialog(null);
        }
      }
    });
  };

  // Función para parsear fechas en formato "YYYY Mes", "YYYY-MM", "YYYY-MM-DD" a Date
  const parseMonthYear = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    const monthNames: Record<string, number> = {
      'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3,
      'Mayo': 4, 'Junio': 5, 'Julio': 6, 'Agosto': 7,
      'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
    };

    // Intentar parsear formato "YYYY Mes"
    const parts = dateStr.trim().split(' ');
    if (parts.length === 2) {
      const year = parseInt(parts[0]);
      const month = monthNames[parts[1]];
      if (!isNaN(year) && month !== undefined) {
        return new Date(year, month, 1);
      }
    }

    // Intentar parsear formato "YYYY-MM" o "YYYY-MM-DD"
    const dateParts = dateStr.split('-');
    if (dateParts.length >= 2) {
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1;
      if (!isNaN(year) && !isNaN(month) && month >= 0 && month <= 11) {
        return new Date(year, month, 1);
      }
    }

    // Intentar parsear como fecha ISO completa
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      // Ignorar errores de parseo
    }

    return null;
  };

  // Función para agrupar datos mensuales por año
  const aggregateByYear = (monthlyData: any[]) => {
    const yearGroups: { [key: string]: { [lineId: string]: number[] } } = {};

    monthlyData.forEach(item => {
      const periodo = item.periodo;
      const yearMatch = periodo?.toString().match(/(\d{4})/);
      if (!yearMatch) return;

      const year = yearMatch[1];
      if (!yearGroups[year]) {
        yearGroups[year] = {};
      }

      // Agrupar valores por línea
      Object.keys(item).forEach(key => {
        if (key !== 'periodo') {
          if (!yearGroups[year][key]) {
            yearGroups[year][key] = [];
          }
          const value = item[key];
          if (value !== null && value !== undefined && value !== '' && !isNaN(value)) {
            yearGroups[year][key].push(Number(value));
          }
        }
      });
    });

    // Calcular promedios anuales
    return Object.keys(yearGroups).map(year => {
      const result: any = { periodo: year };
      Object.keys(yearGroups[year]).forEach(lineId => {
        const values = yearGroups[year][lineId];
        if (values && values.length > 0) {
          result[lineId] = values.reduce((a, b) => a + b, 0) / values.length;
        }
      });
      return result;
    }).sort((a, b) => {
      const yearA = parseInt(a.periodo);
      const yearB = parseInt(b.periodo);
      return yearA - yearB;
    });
  };

  // Preparar datos para el gráfico combinando todas las líneas
  const prepararDatosGrafico = () => {
    if (lines.length === 0) return [];

    // Calcular fecha de corte si hay filtro de años
    let fechaCorte: Date | null = null;
    if (yearsFilter !== null) {
      fechaCorte = new Date();
      fechaCorte.setFullYear(fechaCorte.getFullYear() - yearsFilter);
    }

    // Crear un mapa de periodos con todos los valores
    const periodoMap = new Map<string, any>();

    lines.forEach(line => {
      if (!line.loading && line.datos.length > 0) {
        line.datos.forEach(dato => {
          const periodo = dato.periodo;

          // Aplicar filtro de años si está activo
          if (fechaCorte) {
            try {
              const fechaPeriodo = new Date(periodo);
              if (fechaPeriodo < fechaCorte) {
                return; // Saltar este dato si está fuera del rango
              }
            } catch (e) {
              // Si no se puede parsear la fecha, incluirlo de todas formas
            }
          }

          if (!periodoMap.has(periodo)) {
            periodoMap.set(periodo, { periodo });
          }
          // Convertir valores null/undefined a null explícitamente para mejor manejo
          const valor = dato.valor;
          periodoMap.get(periodo)[line.id] = (valor === null || valor === undefined || valor === '' || isNaN(Number(valor))) ? null : Number(valor);
        });
      }
    });

    // Convertir a array y ordenar por periodo cronológicamente
    let resultado = Array.from(periodoMap.values()).sort((a, b) => {
      // Intentar parsear como fecha
      const dateA = parseMonthYear(a.periodo);
      const dateB = parseMonthYear(b.periodo);

      if (dateA && dateB) {
        return dateA.getTime() - dateB.getTime();
      }

      // Si no se puede parsear, usar comparación de strings como fallback
      return a.periodo.localeCompare(b.periodo);
    });

    // Si está en vista anual, agrupar por año
    if (temporalView === 'anual' && resultado.length > 0) {
      resultado = aggregateByYear(resultado);
    }

    return resultado;
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

  // Función para descargar el gráfico como imagen PNG de alta calidad
  const descargarGrafico = async () => {
    if (!chartRef.current) return;

    try {
      // Capturar el elemento con html2canvas
      const canvas = await html2canvas(chartRef.current, {
        scale: 3, // Alta resolución (3x)
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });

      // Convertir a blob y descargar
      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        // Generar nombre del archivo con timestamp
        const timestamp = new Date().toISOString().slice(0, 10);
        link.download = `grafico-observatorio-${timestamp}.png`;
        link.href = url;
        link.click();

        // Limpiar
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Error al descargar el gráfico:', error);
      setToast({ message: 'No se pudo descargar el gráfico. Por favor intenta nuevamente.', type: 'error' });
    }
  };

  return (
    <>
      <div className="pt-20 md:pt-28 lg:pt-32 pb-8 md:pb-12 lg:pb-16 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header con botón de glosario */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-3 md:mb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Gráficos Personalizados</h1>
            <Button
              onClick={() => setShowGlosario(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
              size="sm"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Glosario
            </Button>
          </div>
          <p className="text-base md:text-lg text-gray-600 px-4">
            Crea gráficos personalizados combinando métricas ambientales
          </p>
        </div>

        {/* Tabs para Crear / Ver Guardados */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('crear')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === 'crear'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Plus className="w-4 h-4 inline-block mr-2" />
              Crear Gráficos
            </button>
            <button
              onClick={() => setActiveTab('guardados')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === 'guardados'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline-block mr-2" />
              Ver Guardados ({savedCharts.length})
            </button>
          </div>
        </div>

        {activeTab === 'crear' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            {/* Panel de Configuración - Vertical */}
            <div className="lg:col-span-4 space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Datos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selector Aire/Agua */}
                <div>
                  <label className="font-semibold text-sm mb-2 block">Fuente de Datos</label>
                  <div className="flex gap-2">
                    <Button
                      variant={dataSource === 'aire' ? 'default' : 'outline'}
                      onClick={() => {
                        setDataSource('aire');
                        resetForm();
                      }}
                      className={`flex-1 ${dataSource === 'aire' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    >
                      Datos de Aire
                    </Button>
                    <Button
                      variant={dataSource === 'agua' ? 'default' : 'outline'}
                      onClick={() => {
                        setDataSource('agua');
                        resetForm();
                      }}
                      className={`flex-1 ${dataSource === 'agua' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    >
                      Datos de Agua
                    </Button>
                  </div>
                </div>

                {/* FORMULARIO DE AIRE */}
                {dataSource === 'aire' ? (
                  <>
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
                            setFormData(prev => ({
                              ...prev,
                              region: value,
                              estacion: "",
                              estacionId: null,
                              metrica: "",
                              submetrica: ""
                            }));
                            setSearchRegion(''); // Limpiar búsqueda al seleccionar
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona región..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-80">
                            {/* Input de búsqueda dentro del dropdown */}
                            <div className="sticky top-0 bg-white border-b p-2 z-10">
                              <Input
                                placeholder="Buscar región..."
                                value={searchRegion}
                                onChange={(e) => setSearchRegion(e.target.value)}
                                onClick={(e) => e.stopPropagation()} // Evitar que se cierre el dropdown
                                onKeyDown={(e) => e.stopPropagation()} // Evitar que las teclas cierren el dropdown
                                className="h-8 text-sm"
                              />
                            </div>
                            {/* Lista filtrada de regiones */}
                            <div className="max-h-60 overflow-y-auto">
                              {regiones
                                .filter(r => r.nombre_region.toLowerCase().includes(searchRegion.toLowerCase()))
                                .length > 0 ? (
                                regiones
                                  .filter(r => r.nombre_region.toLowerCase().includes(searchRegion.toLowerCase()))
                                  .map((region) => (
                                    <SelectItem key={region.numero_region} value={region.numero_region.toString()}>
                                      {region.nombre_region}
                                    </SelectItem>
                                  ))
                              ) : (
                                <div className="p-4 text-center text-sm text-gray-500">
                                  No se encontraron regiones
                                </div>
                              )}
                            </div>
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
                              setSearchEstacion(''); // Limpiar búsqueda al seleccionar
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona estación..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              {/* Input de búsqueda dentro del dropdown - solo si hay más de 10 estaciones */}
                              {estaciones.length > 10 && (
                                <div className="sticky top-0 bg-white border-b p-2 z-10">
                                  <Input
                                    placeholder="Buscar estación..."
                                    value={searchEstacion}
                                    onChange={(e) => setSearchEstacion(e.target.value)}
                                    onClick={(e) => e.stopPropagation()} // Evitar que se cierre el dropdown
                                    onKeyDown={(e) => e.stopPropagation()} // Evitar que las teclas cierren el dropdown
                                    className="h-8 text-sm"
                                  />
                                </div>
                              )}
                              {/* Lista filtrada de estaciones */}
                              <div className="max-h-60 overflow-y-auto">
                                {estaciones
                                  .filter(e => e.nombre.toLowerCase().includes(searchEstacion.toLowerCase()))
                                  .length > 0 ? (
                                  estaciones
                                    .filter(e => e.nombre.toLowerCase().includes(searchEstacion.toLowerCase()))
                                    .map((estacion) => (
                                      <SelectItem key={estacion.id} value={estacion.nombre}>
                                        {estacion.nombre}
                                      </SelectItem>
                                    ))
                                ) : (
                                  <div className="p-4 text-center text-sm text-gray-500">
                                    No se encontraron estaciones
                                  </div>
                                )}
                              </div>
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
                  </>
                ) : (
                  /* FORMULARIO DE AGUA */
                  <>
                    {/* 1️⃣ Selector de Tipo de Entidad */}
                    <div>
                      <label className="font-semibold text-sm mb-2 block">1. Tipo de Entidad</label>
                      {loadingTiposEntidad ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                      ) : (
                        <Select
                          value={formData.tipoEntidad}
                          onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            tipoEntidad: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tipo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {tiposEntidad.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>
                                {tipo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* 2️⃣ Selector de Estación/Entidad con búsqueda integrada */}
                    {formData.tipoEntidad && (
                      <div>
                        <label className="font-semibold text-sm mb-2 block">2. Estación/Entidad</label>
                        {loadingEntidadesAgua ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </div>
                        ) : (
                          <Select
                            value={formData.entidadAgua}
                            onValueChange={(value) => {
                              setFormData(prev => ({ ...prev, entidadAgua: value }));
                              setSearchEntidad(''); // Limpiar búsqueda al seleccionar
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona estación..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              {/* Input de búsqueda dentro del dropdown */}
                              <div className="sticky top-0 bg-white border-b p-2 z-10">
                                <Input
                                  placeholder="Buscar estación..."
                                  value={searchEntidad}
                                  onChange={(e) => setSearchEntidad(e.target.value)}
                                  onClick={(e) => e.stopPropagation()} // Evitar que se cierre el dropdown
                                  onKeyDown={(e) => e.stopPropagation()} // Evitar que las teclas cierren el dropdown
                                  className="h-8 text-sm"
                                />
                              </div>
                              {/* Lista filtrada de entidades */}
                              <div className="max-h-60 overflow-y-auto">
                                {entidadesAgua
                                  .filter(e => e.nombre.toLowerCase().includes(searchEntidad.toLowerCase()))
                                  .length > 0 ? (
                                  entidadesAgua
                                    .filter(e => e.nombre.toLowerCase().includes(searchEntidad.toLowerCase()))
                                    .map((entidad) => (
                                      <SelectItem key={entidad.id} value={entidad.nombre}>
                                        {entidad.nombre}
                                      </SelectItem>
                                    ))
                                ) : (
                                  <div className="p-4 text-center text-sm text-gray-500">
                                    No se encontraron estaciones
                                  </div>
                                )}
                              </div>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {/* 3️⃣ Selector de Métrica (solo si hay más de 1) */}
                    {metricasAgua.length > 1 && formData.entidadAgua && (
                      <div>
                        <label className="font-semibold text-sm mb-2 block">3. Métrica</label>
                        {loadingMetricasAgua ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </div>
                        ) : (
                          <Select
                            value={formData.metricaAgua}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, metricaAgua: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona métrica..." />
                            </SelectTrigger>
                            <SelectContent>
                              {metricasAgua.map((metrica) => (
                                <SelectItem key={metrica} value={metrica}>
                                  {metrica}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {/* 4️⃣ Selector de Submétrica (solo si hay más de 1) */}
                    {submetricasAgua.length > 1 && formData.metricaAgua && (
                      <div>
                        <label className="font-semibold text-sm mb-2 block">
                          {metricasAgua.length > 1 ? '4' : '3'}. Submétrica (Campo a Graficar)
                        </label>
                        {loadingSubmetricasAgua ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </div>
                        ) : (
                          <Select
                            value={formData.submetricaAgua}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, submetricaAgua: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona campo..." />
                            </SelectTrigger>
                            <SelectContent>
                              {submetricasAgua.map((submetrica) => (
                                <SelectItem key={submetrica} value={submetrica}>
                                  {submetrica}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Botón para agregar */}
                <Button
                  onClick={agregarLinea}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={
                    dataSource === 'aire'
                      ? (
                          // Para datos de aire: validar campos completados Y estados de carga
                          !formData.submetrica ||
                          loadingRegiones ||
                          loadingEstaciones ||
                          loadingMetricas ||
                          loadingSubmetricas
                        )
                      : (
                          // Para datos de agua: validar campos completados Y estados de carga
                          !(formData.entidadAgua && (metricasAgua.length === 1 || formData.metricaAgua) && (submetricasAgua.length <= 1 || formData.submetricaAgua)) ||
                          loadingTiposEntidad ||
                          loadingEntidadesAgua ||
                          loadingMetricasAgua ||
                          loadingSubmetricasAgua
                        )
                  }
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
          <div className="lg:col-span-8 space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Visualización
                  </CardTitle>

                  {/* Controles de filtro y descarga */}
                  {lines.length > 0 && (
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap w-full sm:w-auto">
                      {/* Toggle Mensual/Anual */}
                      {datosGrafico.length > 12 && (
                        <button
                          onClick={() => setTemporalView(prev => prev === 'mensual' ? 'anual' : 'mensual')}
                          className="relative inline-flex h-9 w-28 items-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex-shrink-0"
                          title={`Cambiar a vista ${temporalView === 'mensual' ? 'anual' : 'mensual'}`}
                        >
                          <span
                            className={`inline-flex h-8 w-14 items-center justify-center rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
                              temporalView === 'anual' ? 'translate-x-[52px]' : 'translate-x-0.5'
                            }`}
                          >
                            <span className="text-xs font-semibold text-gray-900">
                              {temporalView === 'mensual' ? 'Mensual' : 'Anual'}
                            </span>
                          </span>
                          <span className="absolute left-1.5 text-xs font-medium text-gray-600 pointer-events-none">
                            {temporalView === 'mensual' ? '' : 'Mensual'}
                          </span>
                          <span className="absolute right-2 text-xs font-medium text-gray-600 pointer-events-none">
                            {temporalView === 'anual' ? '' : 'Anual'}
                          </span>
                        </button>
                      )}

                      {/* Filtro por años */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <Select
                          value={yearsFilter?.toString() || "all"}
                          onValueChange={(value) => setYearsFilter(value === "all" ? null : parseInt(value))}
                        >
                          <SelectTrigger className="w-32 h-9">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="1">Último año</SelectItem>
                            <SelectItem value="2">2 años</SelectItem>
                            <SelectItem value="3">3 años</SelectItem>
                            <SelectItem value="5">5 años</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Botones de descarga y guardado */}
                      <div className="flex gap-2">
                        <Button
                          onClick={guardarGrafico}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 bg-emerald-50 border-emerald-600 text-emerald-700 hover:bg-emerald-100"
                        >
                          <Plus className="w-4 h-4" />
                          Guardar
                        </Button>
                        <Button
                          onClick={descargarGrafico}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Descargar PNG
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="h-[400px] md:h-[500px] lg:h-[600px] p-0 relative" ref={chartRef}>
                {lines.length === 0 ? (
                  // Skeleton del gráfico vacío
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg px-4">
                    <svg className="w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    <p className="text-base md:text-lg font-medium text-center">Agrega datos para ver el gráfico</p>
                    <p className="text-xs md:text-sm mt-2 text-center">Selecciona Región → Estación → Métrica → Submétrica</p>
                  </div>
                ) : datosGrafico.length === 0 && lines.some(l => l.loading) ? (
                  // Loading state while data is being fetched
                  <div className="h-full flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4 animate-spin text-emerald-600" />
                    <p className="text-base md:text-lg font-medium text-gray-700">Cargando datos...</p>
                  </div>
                ) : (
                  <div className="h-full w-full" style={{ minHeight: '100%' }}>
                    {/* AI Explain Button */}
                    <AIExplainButton
                      chartData={datosGrafico}
                      chartConfig={{
                        lines: lines.map(l => ({
                          region: l.region,
                          estacion: l.estacion,
                          metrica: l.metrica,
                          submetrica: l.submetrica,
                          color: l.color
                        })),
                        temporalView: temporalView,
                        yearsFilter: yearsFilter
                      }}
                      userContext={{
                        userId: user?.uid,
                        selectedRegions: lines.map(l => l.region),
                        chartType: 'line'
                      }}
                      position="top-right"
                    />
                    {/* Gráfico con datos */}
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datosGrafico} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="periodo"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 10 }}
                        label={{
                          value: temporalView === 'anual' ? 'Año' : 'Período',
                          position: 'insideBottom',
                          offset: 30,
                          style: { fontSize: 11, fontWeight: '600', fill: '#374151' }
                        }}
                      />
                      <YAxis tick={{ fontSize: 10 }} width={60} />
                      <Tooltip
                        content={<CustomTooltip />}
                        wrapperStyle={{ zIndex: 1000 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
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
                          connectNulls={true}
                        />
                      ))}
                    </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 🔍 Panel de Análisis de Correlación */}
            <AnalisisCorrelacion lines={lines} />
          </div>
        </div>
        ) : (
          <div className="space-y-6">
            {loadingSavedCharts ? (
              <Card>
                <CardContent className="py-16">
                  <div className="text-center text-gray-500">
                    <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-emerald-600" />
                    <p className="text-lg font-medium mb-2">Cargando gráficos guardados...</p>
                  </div>
                </CardContent>
              </Card>
            ) : savedCharts.length === 0 ? (
              <Card>
                <CardContent className="py-16">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No hay gráficos guardados</p>
                    <p className="text-sm">Crea un gráfico y guárdalo para verlo aquí</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedCharts.map(chart => (
                  <Card key={chart.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="truncate">{chart.nombre}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarGraficoGuardado(chart.id)}
                          className="flex-shrink-0 h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(chart.fechaCreacion).toLocaleDateString('es-ES')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            <span>{chart.lines.length} línea{chart.lines.length > 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {chart.lines.slice(0, 3).map(line => (
                            <div key={line.id} className="flex items-center gap-2 text-xs">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />
                              <span className="truncate">{line.label}</span>
                            </div>
                          ))}
                          {chart.lines.length > 3 && (
                            <span className="text-xs text-gray-500">+{chart.lines.length - 3} más...</span>
                          )}
                        </div>

                        <Button
                          onClick={() => cargarGrafico(chart)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Gráfico
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Guardar Gráfico */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Guardar Gráfico</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSaveModal(false);
                    setChartName('');
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del gráfico
                </label>
                <input
                  type="text"
                  value={chartName}
                  onChange={(e) => setChartName(e.target.value)}
                  placeholder="Ej: Comparación temperaturas 2023"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') confirmarGuardado();
                  }}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowSaveModal(false);
                    setChartName('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmarGuardado}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Glosario */}
      <GlosarioModal isOpen={showGlosario} onClose={() => setShowGlosario(false)} />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </>
  );
}
