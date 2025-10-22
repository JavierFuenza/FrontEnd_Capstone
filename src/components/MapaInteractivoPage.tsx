// src/components/MapaInteractivoPage.tsx
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, X, BarChart3, Maximize2, Calendar, TrendingUp, Info, Loader2, Download, BookOpen } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { Map } from './Map';
import { Badge } from "@/components/ui/badge";
import { GlosarioModal } from './GlosarioModal';
import html2canvas from 'html2canvas';

interface Estacion {
    id: number;
    nombre: string;
    latitud: number;
    longitud: number;
    descripcion: string;
    created_at: string;
}

type MetricType = 'temperatura' | 'mp25' | 'mp10' | 'o3' | 'so2' | 'no2' | 'co' | 'otros';

interface MetricData {
    temperatura?: any[];
    mp25?: any;
    mp10?: any;
    o3?: any;
    so2?: any;
    no2?: any;
    co?: any;
    otros?: any;
}

export function MapaInteractivoPage() {
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

    const [searchTerm, setSearchTerm] = useState("");
    const [estaciones, setEstaciones] = useState<Estacion[]>([]);
    const [filteredEstaciones, setFilteredEstaciones] = useState<Estacion[]>([]);
    const [selectedEstacion, setSelectedEstacion] = useState<Estacion | null>(() =>
        getFromLocalStorage('mapa_selectedEstacion', null)
    );
    const [selectedMetric, setSelectedMetric] = useState<MetricType>(() =>
        getFromLocalStorage('mapa_selectedMetric', 'temperatura')
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metricData, setMetricData] = useState<MetricData>({});
    const [loadingMetric, setLoadingMetric] = useState(false);
    const [availableMetrics, setAvailableMetrics] = useState<MetricType[]>([]);


    // Sidebar states
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(() =>
        getFromLocalStorage('mapa_leftSidebarOpen', true)
    );
    const [rightSidebarOpen, setRightSidebarOpen] = useState(() =>
        getFromLocalStorage('mapa_rightSidebarOpen', false)
    );

    // Modal state for chart expansion
    const [expandedChart, setExpandedChart] = useState<{
        data: any[],
        config: any,
        chartKey: string,
        allowTemporalSwitch: boolean,
        allowTimeRangeFilter: boolean,
        rawData: any[]
    } | null>(null);

    // Temporal view states for each chart (keyed by chartKey)
    const [chartViews, setChartViews] = useState<Record<string, 'mensual' | 'anual'>>(() =>
        getFromLocalStorage('mapa_chartViews', {})
    );

    // Stats visibility states for each chart (keyed by chartKey)
    const [statsVisible, setStatsVisible] = useState<Record<string, boolean>>({});

    // Time range filter states for temperature charts (keyed by chartKey)
    const [timeRangeFilters, setTimeRangeFilters] = useState<Record<string, '1year' | '2years' | '5years' | 'all'>>(() =>
        getFromLocalStorage('mapa_timeRangeFilters', {})
    );

    // Force modal re-render counter
    const [modalRenderKey, setModalRenderKey] = useState(0);

    // Glosario modal state
    const [showGlosario, setShowGlosario] = useState(false);

    // Ref para captura de pantalla
    const contentRef = useRef<HTMLDivElement>(null);

    // Fetch estaciones desde el backend
    useEffect(() => {
        const fetchEstaciones = async () => {
            try {
                setLoading(true);
                const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8000/';
                const url = `${API_BASE}api/private/estaciones/`;
                console.log('[MapaInteractivoPage] Fetching estaciones from:', url);

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Error al cargar estaciones');
                }
                const data = await response.json();
                console.log('[MapaInteractivoPage] Estaciones cargadas:', data.length);
                setEstaciones(data);
                setFilteredEstaciones(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
                console.error('[MapaInteractivoPage] Error fetching estaciones:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEstaciones();
    }, []);

    // Filtrar estaciones por búsqueda
    useEffect(() => {
        const filtered = estaciones.filter(estacion =>
            estacion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            estacion.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredEstaciones(filtered);
    }, [searchTerm, estaciones]);

    // Persistir estado en localStorage
    useEffect(() => {
        saveToLocalStorage('mapa_selectedEstacion', selectedEstacion);
    }, [selectedEstacion]);

    useEffect(() => {
        saveToLocalStorage('mapa_selectedMetric', selectedMetric);
    }, [selectedMetric]);

    useEffect(() => {
        saveToLocalStorage('mapa_leftSidebarOpen', leftSidebarOpen);
    }, [leftSidebarOpen]);

    useEffect(() => {
        saveToLocalStorage('mapa_rightSidebarOpen', rightSidebarOpen);
    }, [rightSidebarOpen]);

    useEffect(() => {
        saveToLocalStorage('mapa_chartViews', chartViews);
    }, [chartViews]);

    useEffect(() => {
        saveToLocalStorage('mapa_timeRangeFilters', timeRangeFilters);
    }, [timeRangeFilters]);

    // Restaurar métrica cuando se carga una estación guardada
    useEffect(() => {
        if (selectedEstacion && estaciones.length > 0) {
            // Verificar que la estación guardada todavía existe
            const exists = estaciones.find(e => e.id === selectedEstacion.id);
            if (exists) {
                checkAvailableMetrics(selectedEstacion);
                setRightSidebarOpen(true);
            } else {
                // Si la estación ya no existe, limpiar la selección
                setSelectedEstacion(null);
            }
        }
    }, [estaciones]);

    // Función para determinar métricas disponibles
    const checkAvailableMetrics = async (estacion: Estacion) => {
        const metricsToCheck: MetricType[] = ['temperatura', 'mp25', 'mp10', 'o3', 'so2', 'no2', 'co', 'otros'];
        const available: MetricType[] = [];

        for (const metric of metricsToCheck) {
            try {
                const response = await fetch(
                    `${import.meta.env.PUBLIC_API_BASE_URL}api/private/metricas/${metric}/${estacion.nombre}`
                );
                if (response.ok) {
                    const data = await response.json();

                    // Verificar si tiene datos según el tipo de métrica
                    if (metric === 'temperatura' && Array.isArray(data) && data.length > 0) {
                        available.push(metric);
                    } else if (data.tiene_datos) {
                        available.push(metric);
                    }
                }
            } catch (err) {
                console.error(`Error checking ${metric}:`, err);
            }
        }

        setAvailableMetrics(available);
        // Si la métrica seleccionada no está disponible, cambiar a la primera disponible
        if (available.length > 0 && !available.includes(selectedMetric)) {
            setSelectedMetric(available[0]);
        }
    };

    const handleEstacionClick = (estacion: Estacion) => {
        setSelectedEstacion(estacion);
        setRightSidebarOpen(true);
        checkAvailableMetrics(estacion);
        // En móvil, cerrar sidebar izquierdo al seleccionar
        if (window.innerWidth < 1024) {
            setLeftSidebarOpen(false);
        }
    };

    const handleMarkerClick = (estacion: Estacion) => {
        setSelectedEstacion(estacion);
        setRightSidebarOpen(true);
        checkAvailableMetrics(estacion);
    };

    // Fetch métrica específica cuando se selecciona
    useEffect(() => {
        const fetchMetric = async () => {
            if (!selectedEstacion) return;

            setLoadingMetric(true);
            try {
                const response = await fetch(
                    `${import.meta.env.PUBLIC_API_BASE_URL}api/private/metricas/${selectedMetric}/${selectedEstacion.nombre}`
                );

                if (!response.ok) {
                    throw new Error('Error al cargar métrica');
                }

                const data = await response.json();
                setMetricData(prev => ({
                    ...prev,
                    [selectedMetric]: data
                }));
            } catch (err) {
                console.error(`Error fetching ${selectedMetric}:`, err);
            } finally {
                setLoadingMetric(false);
            }
        };

        fetchMetric();
    }, [selectedEstacion, selectedMetric]);

    const metricLabels: Record<MetricType, string> = {
        temperatura: 'Temperatura',
        mp25: 'MP2.5',
        mp10: 'MP10',
        o3: 'Ozono (O₃)',
        so2: 'SO₂',
        no2: 'NO₂',
        co: 'CO',
        otros: 'Otros'
    };

    // Función auxiliar para filtrar datos vacíos (remover registros sin valores válidos)
    const filterEmptyData = (data: any[], dataKeys: string[]) => {
        return data.filter(item =>
            dataKeys.some(key => item[key] !== null && item[key] !== undefined && item[key] !== '')
        );
    };

    // Función para calcular estadísticas descriptivas
    const calculateStats = (data: any[], dataKey: string) => {
        const values = data
            .map(item => item[dataKey])
            .filter(val => val !== null && val !== undefined && val !== '' && !isNaN(val))
            .map(Number);

        if (values.length === 0) return null;

        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((acc, val) => acc + val, 0);
        const mean = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];

        return { mean, min, max, median, count: values.length };
    };

    // Función para calcular estadísticas de múltiples dataKeys
    const calculateMultiStats = (data: any[], dataKeys: string[]) => {
        return dataKeys.map(key => {
            const stats = calculateStats(data, key);
            return stats ? { dataKey: key, ...stats } : null;
        }).filter(stat => stat !== null);
    };

    // Función para calcular el rango dinámico del eje Y
    const getYAxisDomain = (data: any[], dataKeys: string[]) => {
        let min = Infinity;
        let max = -Infinity;

        data.forEach(dataPoint => {
            dataKeys.forEach(key => {
                const value = dataPoint[key];
                if (value !== null && value !== undefined && value !== '' && !isNaN(value)) {
                    const numValue = Number(value);
                    min = Math.min(min, numValue);
                    max = Math.max(max, numValue);
                }
            });
        });

        if (min === Infinity || max === -Infinity) return undefined;

        const range = max - min;
        const padding = range * 0.1; // 10% de padding arriba y abajo

        return [
            Math.floor(min - padding),
            Math.ceil(max + padding)
        ];
    };

    // Función para parsear fechas en formato "YYYY Mes" a Date
    const parseMonthYear = (dateStr: string): Date | null => {
        if (!dateStr) return null;

        const monthNames: Record<string, number> = {
            'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3,
            'Mayo': 4, 'Junio': 5, 'Julio': 6, 'Agosto': 7,
            'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
        };

        const parts = dateStr.trim().split(' ');
        if (parts.length !== 2) return null;

        const year = parseInt(parts[0]);
        const month = monthNames[parts[1]];

        if (isNaN(year) || month === undefined) return null;

        return new Date(year, month, 1);
    };

    // Función para filtrar datos por rango temporal desde el último registro
    const filterByTimeRange = (data: any[], range: '1year' | '2years' | '5years' | 'all', dateKey = 'mes') => {
        if (range === 'all' || data.length === 0) return data;

        // Encontrar la fecha más reciente
        const sortedData = [...data].sort((a, b) => {
            const dateA = parseMonthYear(a[dateKey]);
            const dateB = parseMonthYear(b[dateKey]);
            if (!dateA || !dateB) return 0;
            return dateB.getTime() - dateA.getTime();
        });

        const latestDate = parseMonthYear(sortedData[0][dateKey]);
        if (!latestDate) return data;

        // Calcular fecha de inicio según el rango (inclusive del mismo mes)
        const startDate = new Date(latestDate);
        switch (range) {
            case '1year':
                startDate.setFullYear(latestDate.getFullYear() - 1);
                break;
            case '2years':
                startDate.setFullYear(latestDate.getFullYear() - 2);
                break;
            case '5years':
                startDate.setFullYear(latestDate.getFullYear() - 5);
                break;
        }

        // Filtrar datos dentro del rango (>= startDate incluye el mes inicial)
        return data.filter(item => {
            const itemDate = parseMonthYear(item[dateKey]);
            if (!itemDate) return false;
            return itemDate >= startDate && itemDate <= latestDate;
        });
    };

    // Función para agrupar datos mensuales por año
    const aggregateByYear = (data: any[], dataKeys: string[]) => {
        const yearGroups: { [key: string]: any } = {};

        data.forEach(item => {
            // Extraer año del campo 'mes' (formato esperado: "YYYY Mes" o similar)
            const yearMatch = item.mes?.toString().match(/(\d{4})/);
            if (!yearMatch) return;

            const year = yearMatch[1];
            if (!yearGroups[year]) {
                yearGroups[year] = { anio: year, counts: {} };
                dataKeys.forEach(key => {
                    yearGroups[year][`${key}_values`] = [];
                });
            }

            dataKeys.forEach(key => {
                const value = item[key];
                if (value !== null && value !== undefined && value !== '' && !isNaN(value)) {
                    yearGroups[year][`${key}_values`].push(Number(value));
                }
            });
        });

        // Calcular promedios anuales y ordenar por año
        return Object.values(yearGroups).map(yearData => {
            const result: any = { anio: yearData.anio };
            dataKeys.forEach(key => {
                const values = yearData[`${key}_values`];
                if (values && values.length > 0) {
                    result[key] = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                }
            });
            return result;
        }).sort((a, b) => {
            const yearA = parseInt(a.anio);
            const yearB = parseInt(b.anio);
            return yearA - yearB;
        });
    };

    // Función para descargar toda la información visible como PNG
    const descargarInformacion = async () => {
        if (!contentRef.current) return;

        try {
            // Guardamos el scroll original
            const element = contentRef.current;
            const originalHeight = element.style.height;
            const originalOverflow = element.style.overflow;
            const originalMaxHeight = element.style.maxHeight;
            const scrollTop = element.scrollTop;

            // Expandimos temporalmente el elemento para capturar todo el contenido
            element.style.height = 'auto';
            element.style.maxHeight = 'none';
            element.style.overflow = 'visible';

            // Esperamos un momento para que los gráficos se re-rendericen correctamente
            await new Promise(resolve => setTimeout(resolve, 300));

            // Capturamos con html2canvas
            const canvas = await html2canvas(element, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: '#ffffff',
                windowHeight: element.scrollHeight,
                height: element.scrollHeight,
                onclone: (clonedDoc) => {
                    // Buscamos todos los divs con overflow auto/scroll en el documento clonado
                    const scrollableElements = clonedDoc.querySelectorAll('.overflow-y-auto, .overflow-auto, .overflow-scroll');
                    scrollableElements.forEach((el: any) => {
                        el.style.overflow = 'visible';
                        el.style.maxHeight = 'none';
                        el.style.height = 'auto';
                    });
                }
            });

            // Restauramos el estado original
            element.style.height = originalHeight;
            element.style.maxHeight = originalMaxHeight;
            element.style.overflow = originalOverflow;
            element.scrollTop = scrollTop;

            const link = document.createElement('a');
            const metricaActual = selectedMetric === 'temperatura' ? 'Temperatura'
                : selectedMetric === 'mp25' ? 'MP2.5'
                : selectedMetric === 'mp10' ? 'MP10'
                : selectedMetric.toUpperCase();

            const estacionNombre = selectedEstacion?.nombre.replace(/\s+/g, '_') || 'estacion';
            link.download = `Mapa_${estacionNombre}_${metricaActual}_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.png`;
            link.href = canvas.toDataURL();
            link.click();
        } catch (error) {
            console.error('Error al descargar la información:', error);
            alert('Hubo un error al descargar la imagen. Por favor, intenta nuevamente.');
        }
    };

    // Función genérica para renderizar gráfico con botón de expansión y funcionalidades avanzadas
    const renderGenericChart = (
        data: any[],
        dataKeys: string[],
        title: string,
        colors: string[],
        labels: string[],
        xAxisKey = 'mes',
        yAxisLabel = '',
        chartKey = '',
        unit = '',
        allowTemporalSwitch = false,
        description = '',
        allowTimeRangeFilter = false
    ) => {
        // Contar registros válidos
        const validCounts = dataKeys.map(key =>
            data.filter(item => item[key] !== null && item[key] !== undefined && item[key] !== '').length
        );

        // Si todos tienen 0, no renderizar
        if (validCounts.every(count => count === 0)) return null;

        // Filtrar datos vacíos
        let validData = filterEmptyData(data, dataKeys);
        if (validData.length === 0) return null;

        // Ordenar datos temporalmente si el eje X es 'mes' o 'anio'
        if (xAxisKey === 'mes') {
            validData = validData.sort((a, b) => {
                const dateA = parseMonthYear(a[xAxisKey]);
                const dateB = parseMonthYear(b[xAxisKey]);
                if (!dateA || !dateB) return 0;
                return dateA.getTime() - dateB.getTime();
            });
        } else if (xAxisKey === 'anio') {
            validData = validData.sort((a, b) => {
                const yearA = parseInt(a[xAxisKey]);
                const yearB = parseInt(b[xAxisKey]);
                if (isNaN(yearA) || isNaN(yearB)) return 0;
                return yearA - yearB;
            });
        }

        // Obtener vista actual de este gráfico desde el estado global
        const currentView = chartViews[chartKey] || 'mensual';
        const shouldShowTemporalSwitch = allowTemporalSwitch && xAxisKey === 'mes' && validData.length > 12;

        // Guardar datos sin filtrar para el modal
        const unfilteredValidData = validData;

        // Aplicar filtro de rango temporal si está habilitado
        // Por defecto: 1 año en vista mensual, 2 años en vista anual
        const defaultRange = currentView === 'anual' ? '2years' : '1year';
        const currentTimeRange = timeRangeFilters[chartKey] || defaultRange;
        if (allowTimeRangeFilter) {
            validData = filterByTimeRange(validData, currentTimeRange, xAxisKey);
            if (validData.length === 0) return null;
        }

        let displayData = validData;
        let displayXAxisKey = xAxisKey;

        if (shouldShowTemporalSwitch && currentView === 'anual') {
            displayData = aggregateByYear(validData, dataKeys);
            displayXAxisKey = 'anio';
            // Ordenar datos anuales
            displayData = displayData.sort((a, b) => {
                const yearA = parseInt(a.anio);
                const yearB = parseInt(b.anio);
                if (isNaN(yearA) || isNaN(yearB)) return 0;
                return yearA - yearB;
            });
        }

        // Función para cambiar la vista de este gráfico específico
        const toggleView = (view: 'mensual' | 'anual') => {
            setChartViews(prev => ({ ...prev, [chartKey]: view }));
        };

        // Calcular estadísticas para todos los dataKeys
        const allStats = calculateMultiStats(displayData, dataKeys);
        const totalRecords = displayData.length;

        // Determinar tipo de gráfico
        const maxCount = Math.max(...validCounts);
        const useBarChart = maxCount <= 1;
        const ChartComponent = useBarChart ? BarChart : LineChart;

        const chartConfig = {
            dataKeys,
            colors,
            labels,
            useBarChart,
            yAxisLabel,
            title,
            xAxisKey: displayXAxisKey,
            originalXAxisKey: xAxisKey, // Guardar el eje original (siempre 'mes' para datos temporales)
            unit,
            allStats
        };

        // Tooltip personalizado con más información
        const CustomTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                return (
                    <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900 mb-2">{label}</p>
                        {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: <span className="font-bold">{Math.trunc(entry.value * 10) / 10}{unit}</span>
                            </p>
                        ))}
                    </div>
                );
            }
            return null;
        };

        return (
            <Card key={chartKey || title} className="group relative">
                <CardHeader>
                    <div className="flex flex-row items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-base">
                                {title}
                            </CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setExpandedChart({
                                data: displayData,
                                config: chartConfig,
                                chartKey: chartKey,
                                allowTemporalSwitch: shouldShowTemporalSwitch,
                                allowTimeRangeFilter: allowTimeRangeFilter,
                                rawData: unfilteredValidData
                            })}
                        >
                            <Maximize2 className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Controles: Estadísticas, Vista Temporal y Filtro de Rango */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {/* Botón para mostrar/ocultar estadísticas */}
                        {allStats.length > 0 && (
                            <Button
                                variant={statsVisible[chartKey] ? "secondary" : "outline"}
                                size="sm"
                                className="text-xs h-8 px-2.5 border-dashed hover:border-solid transition-all flex-shrink"
                                onClick={() => setStatsVisible(prev => ({ ...prev, [chartKey]: !prev[chartKey] }))}
                            >
                                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                                <span className="whitespace-nowrap">
                                    {statsVisible[chartKey] ? 'Ocultar análisis' : 'Ver análisis'}
                                </span>
                            </Button>
                        )}

                        {/* Selector de vista temporal */}
                        {shouldShowTemporalSwitch && (
                            <button
                                onClick={() => toggleView(currentView === 'mensual' ? 'anual' : 'mensual')}
                                className="relative inline-flex h-8 w-28 items-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex-shrink-0"
                            >
                                <span
                                    className={`inline-flex h-7 w-14 items-center justify-center rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
                                        currentView === 'anual' ? 'translate-x-[52px]' : 'translate-x-0.5'
                                    }`}
                                >
                                    <span className="text-xs font-semibold text-gray-900">
                                        {currentView === 'mensual' ? 'Mensual' : 'Anual'}
                                    </span>
                                </span>
                                <span className="absolute left-1.5 text-xs font-medium text-gray-600 pointer-events-none">
                                    {currentView === 'mensual' ? '' : 'Mensual'}
                                </span>
                                <span className="absolute right-2 text-xs font-medium text-gray-600 pointer-events-none">
                                    {currentView === 'anual' ? '' : 'Anual'}
                                </span>
                            </button>
                        )}

                        {/* Filtro de rango temporal para temperatura */}
                        {allowTimeRangeFilter && (
                            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-shrink-0">
                                {(['1year', '2years', '5years', 'all'] as const).map((range) => {
                                    const labels = { '1year': '1 año', '2years': '2 años', '5years': '5 años', 'all': 'Todo' };
                                    return (
                                        <button
                                            key={range}
                                            onClick={() => setTimeRangeFilters(prev => ({ ...prev, [chartKey]: range }))}
                                            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                                                currentTimeRange === range
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            {labels[range]}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Estadísticas descriptivas colapsables */}
                    {allStats.length > 0 && statsVisible[chartKey] && (
                        <div className="mt-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs font-semibold text-gray-700">Análisis Estadístico Detallado</span>
                                <Badge variant="secondary" className="text-xs ml-auto">
                                    {totalRecords} registros
                                </Badge>
                            </div>
                            <div className="space-y-3">
                                {allStats.map((stat: any, idx: number) => {
                                    const labelIndex = dataKeys.indexOf(stat.dataKey);
                                    const label = labels[labelIndex] || stat.dataKey;
                                    const color = colors[labelIndex] || '#6b7280';

                                    return (
                                        <div key={stat.dataKey} className="bg-white rounded-md p-3 shadow-sm border border-gray-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: color }}
                                                />
                                                <span className="text-xs font-semibold text-gray-800">{label}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <Badge variant="outline" className="bg-blue-50 border-blue-200 justify-between">
                                                    <span className="font-medium">Promedio:</span>
                                                    <span className="font-bold">{(Math.trunc(stat.mean * 10) / 10).toFixed(1)}{unit}</span>
                                                </Badge>
                                                <Badge variant="outline" className="bg-purple-50 border-purple-200 justify-between">
                                                    <span className="font-medium">Mediana:</span>
                                                    <span className="font-bold">{(Math.trunc(stat.median * 10) / 10).toFixed(1)}{unit}</span>
                                                </Badge>
                                                <Badge variant="outline" className="bg-green-50 border-green-200 justify-between">
                                                    <span className="font-medium">Máximo:</span>
                                                    <span className="font-bold">{(Math.trunc(stat.max * 10) / 10).toFixed(1)}{unit}</span>
                                                </Badge>
                                                <Badge variant="outline" className="bg-orange-50 border-orange-200 justify-between">
                                                    <span className="font-medium">Mínimo:</span>
                                                    <span className="font-bold">{(Math.trunc(stat.min * 10) / 10).toFixed(1)}{unit}</span>
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                        <ChartComponent data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey={displayXAxisKey}
                                tick={{ fontSize: 11 }}
                                tickMargin={8}
                                label={{
                                    value: currentView === 'anual' ? 'Año' : 'Periodo',
                                    position: 'insideBottom',
                                    offset: -10,
                                    style: { fontSize: 13, fontWeight: '600', fill: '#374151' }
                                }}
                                height={60}
                            />
                            <YAxis
                                domain={getYAxisDomain(displayData, dataKeys)}
                                tick={{ fontSize: 11 }}
                                label={yAxisLabel ? {
                                    value: yAxisLabel,
                                    angle: -90,
                                    position: 'insideLeft',
                                    offset: 10,
                                    style: { fontSize: 12, fontWeight: '600', fill: '#374151', textAnchor: 'middle' }
                                } : undefined}
                                width={85}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: 12, paddingTop: '15px' }}
                                iconType="line"
                                verticalAlign="top"
                            />
                            {allStats.length > 0 && statsVisible[chartKey] && allStats.map((stat: any, idx: number) => (
                                <ReferenceLine
                                    key={`ref-${stat.dataKey}`}
                                    y={stat.mean}
                                    stroke={colors[dataKeys.indexOf(stat.dataKey)]}
                                    strokeDasharray="5 5"
                                    strokeOpacity={0.5}
                                    label={{
                                        value: `Media ${labels[dataKeys.indexOf(stat.dataKey)]}`,
                                        position: idx % 2 === 0 ? 'right' : 'left',
                                        fontSize: 9,
                                        fill: colors[dataKeys.indexOf(stat.dataKey)]
                                    }}
                                />
                            ))}
                            {dataKeys.map((dataKey, index) => {
                                const hasData = displayData.some(item =>
                                    item[dataKey] !== null && item[dataKey] !== undefined && item[dataKey] !== ''
                                );
                                if (!hasData) return null;

                                return useBarChart ? (
                                    <Bar key={dataKey} dataKey={dataKey} fill={colors[index]} name={labels[index]} />
                                ) : (
                                    <Line
                                        key={dataKey}
                                        type="monotone"
                                        dataKey={dataKey}
                                        stroke={colors[index]}
                                        name={labels[index]}
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                );
                            })}
                        </ChartComponent>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    };

    // Función para renderizar los gráficos según la métrica
    const renderMetricCharts = () => {
        if (loadingMetric) {
            return (
                <div className="space-y-4">
                    {/* Skeleton de carga para gráficos */}
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px] bg-gray-100 rounded flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            );
        }

        const currentData = metricData[selectedMetric];

        if (!currentData) {
            return (
                <div className="text-center py-8 text-gray-500">
                    No hay datos disponibles
                </div>
            );
        }

        // Temperatura - 3 gráficos separados
        if (selectedMetric === 'temperatura' && Array.isArray(currentData) && currentData.length > 0) {
            // Función auxiliar para contar registros válidos de una métrica
            const countValidRecords = (dataKey: string) => {
                return currentData.filter(item =>
                    item[dataKey] !== null &&
                    item[dataKey] !== undefined &&
                    item[dataKey] !== ''
                ).length;
            };

            // Contar registros válidos para cada métrica
            const validCounts = {
                temp_max_absoluta: countValidRecords('temp_max_absoluta'),
                temp_min_absoluta: countValidRecords('temp_min_absoluta'),
                temp_max_med: countValidRecords('temp_max_med'),
                temp_min_med: countValidRecords('temp_min_med'),
                temp_med: countValidRecords('temp_med')
            };

            // Función para renderizar gráfico de línea o barra según cantidad de datos
            const renderChart = (dataKeys: string[], title: string, colors: string[], labels: string[], yAxisLabel = '°C') => {
                // Filtrar datos válidos y contar registros por cada dataKey
                const validDataCounts = dataKeys.map(key => ({
                    key,
                    count: currentData.filter(item =>
                        item[key] !== null && item[key] !== undefined && item[key] !== ''
                    ).length
                }));

                // Si todos los dataKeys tienen 0 registros, no renderizar
                if (validDataCounts.every(item => item.count === 0)) return null;

                // Filtrar datos que tienen al menos un valor válido en algún dataKey
                // Y filtrar registros vacíos (donde ningún dataKey tiene valor)
                let validData = filterEmptyData(currentData, dataKeys);

                if (validData.length === 0) return null;

                // Ordenar datos temporalmente
                validData = validData.sort((a, b) => {
                    const dateA = parseMonthYear(a.mes);
                    const dateB = parseMonthYear(b.mes);
                    if (!dateA || !dateB) return 0;
                    return dateA.getTime() - dateB.getTime();
                });

                // Usar barras si alguno de los dataKeys tiene <= 1 registro
                const maxCount = Math.max(...validDataCounts.map(item => item.count));
                const useBarChart = maxCount <= 1;

                const ChartComponent = useBarChart ? BarChart : LineChart;

                const chartConfig = {
                    dataKeys,
                    colors,
                    labels,
                    useBarChart,
                    yAxisLabel,
                    title,
                    xAxisKey: 'mes'
                };

                return (
                    <Card key={title} className="group relative">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">{title}</CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setExpandedChart({
                                    data: validData,
                                    config: chartConfig,
                                    chartKey: title,
                                    allowTemporalSwitch: false,
                                    allowTimeRangeFilter: false,
                                    rawData: validData
                                })}
                            >
                                <Maximize2 className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <ChartComponent data={validData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                                    <YAxis domain={getYAxisDomain(validData, dataKeys)} tick={{ fontSize: 12 }} label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
                                    <Tooltip />
                                    <Legend />
                                    {dataKeys.map((dataKey, index) => {
                                        const hasData = validData.some(item =>
                                            item[dataKey] !== null && item[dataKey] !== undefined && item[dataKey] !== ''
                                        );
                                        if (!hasData) return null;

                                        return useBarChart ? (
                                            <Bar key={dataKey} dataKey={dataKey} fill={colors[index]} name={labels[index]} />
                                        ) : (
                                            <Line key={dataKey} type="monotone" dataKey={dataKey} stroke={colors[index]} name={labels[index]} strokeWidth={2} />
                                        );
                                    })}
                                </ChartComponent>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                );
            };

            const charts = [];

            // Gráfico 1: Temperaturas Máxima y Mínima Absolutas
            if (validCounts.temp_max_absoluta > 0 || validCounts.temp_min_absoluta > 0) {
                const chart = renderGenericChart(
                    currentData,
                    ['temp_max_absoluta', 'temp_min_absoluta'],
                    'Temperaturas Máxima y Mínima Absolutas',
                    ['#ef4444', '#3b82f6'],
                    ['Máx Absoluta', 'Mín Absoluta'],
                    'mes',
                    'Temperatura (°C)',
                    'temp-max-min-abs',
                    '°C',
                    true,
                    'Temperaturas extremas absolutas registradas mensualmente',
                    true
                );
                if (chart) charts.push(chart);
            }

            // Gráfico 2: Temperaturas Máxima y Mínima Medias
            if (validCounts.temp_max_med > 0 || validCounts.temp_min_med > 0) {
                const chart = renderGenericChart(
                    currentData,
                    ['temp_max_med', 'temp_min_med'],
                    'Temperaturas Máxima y Mínima Medias',
                    ['#f97316', '#06b6d4'],
                    ['Máx Media', 'Mín Media'],
                    'mes',
                    'Temperatura (°C)',
                    'temp-max-min-med',
                    '°C',
                    true,
                    'Promedio mensual de temperaturas máximas y mínimas',
                    true
                );
                if (chart) charts.push(chart);
            }

            // Gráfico 3: Temperatura Media
            if (validCounts.temp_med > 0) {
                const chart = renderGenericChart(
                    currentData,
                    ['temp_med'],
                    'Temperatura Media',
                    ['#059669'],
                    ['Media'],
                    'mes',
                    'Temperatura (°C)',
                    'temp-med',
                    '°C',
                    true,
                    'Temperatura promedio mensual registrada',
                    true
                );
                if (chart) charts.push(chart);
            }

            if (charts.length === 0) {
                return (
                    <div className="text-center py-8 text-gray-500">
                        No hay datos de temperatura disponibles
                    </div>
                );
            }

            return <div className="space-y-4">{charts}</div>;
        }

        // Contaminantes (mp25, mp10, o3, so2, no2, co)
        if (['mp25', 'mp10', 'o3', 'so2', 'no2', 'co'].includes(selectedMetric)) {
            const { datos_mensuales = [], datos_anuales = [], tiene_datos } = currentData;

            if (!tiene_datos) {
                return (
                    <div className="text-center py-8 text-gray-500">
                        Esta estación no tiene datos para {metricLabels[selectedMetric]}
                    </div>
                );
            }

            const charts = [];

            const metricUnits: Record<string, string> = {
                mp25: 'µg/m³',
                mp10: 'µg/m³',
                o3: 'ppb',
                so2: 'ppb',
                no2: 'ppb',
                co: 'ppm'
            };
            const currentUnit = metricUnits[selectedMetric] || '';

            // Gráfico 1: Medias Mensuales
            if (datos_mensuales.length > 0) {
                const chart = renderGenericChart(
                    datos_mensuales,
                    ['med_mens'],
                    `Concentración Media Mensual de ${metricLabels[selectedMetric]}`,
                    ['#059669'],
                    ['Media Mensual'],
                    'mes',
                    `Concentración (${currentUnit})`,
                    'medias-mensuales',
                    currentUnit,
                    true,
                    'Promedio mensual de concentraciones registradas en la estación'
                );
                if (chart) charts.push(chart);
            }

            // Gráfico 2: Máximos y Mínimos Anuales
            if (datos_anuales.length > 0) {
                const chart = renderGenericChart(
                    datos_anuales,
                    ['max_hor_anual', 'min_hor_anual'],
                    `Valores Extremos Anuales de ${metricLabels[selectedMetric]}`,
                    ['#ef4444', '#3b82f6'],
                    ['Máximo Horario', 'Mínimo Horario'],
                    'anio',
                    `Concentración (${currentUnit})`,
                    'max-min-anuales',
                    currentUnit,
                    false,
                    'Valores máximos y mínimos horarios registrados cada año'
                );
                if (chart) charts.push(chart);
            }

            // Gráfico 3: Percentiles
            if (datos_anuales.length > 0) {
                const chart = renderGenericChart(
                    datos_anuales,
                    ['perc50', 'perc90', 'perc95', 'perc98', 'perc99'],
                    `Distribución Percentil Anual de ${metricLabels[selectedMetric]}`,
                    ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'],
                    ['P50 (Mediana)', 'P90', 'P95', 'P98', 'P99'],
                    'anio',
                    `Concentración (${currentUnit})`,
                    'percentiles',
                    currentUnit,
                    false,
                    'Percentiles que representan la distribución de valores a lo largo del año'
                );
                if (chart) charts.push(chart);
            }

            if (charts.length === 0) {
                return (
                    <div className="text-center py-8 text-gray-500">
                        No hay datos disponibles para {metricLabels[selectedMetric]}
                    </div>
                );
            }

            return <div className="space-y-4">{charts}</div>;
        }

        // Otros (Humedad, Radiación UV, Olas de Calor)
        if (selectedMetric === 'otros') {
            const { humedad_radiacion_uv = [], olas_de_calor = [], tiene_datos } = currentData;

            if (!tiene_datos) {
                return (
                    <div className="text-center py-8 text-gray-500">
                        Esta estación no tiene datos adicionales
                    </div>
                );
            }

            const charts = [];

            // Gráfico 1: Humedad
            if (humedad_radiacion_uv.length > 0) {
                const chart = renderGenericChart(
                    humedad_radiacion_uv,
                    ['humedad_rel_med_mens'],
                    'Humedad Relativa Media Mensual',
                    ['#3b82f6'],
                    ['Humedad Relativa'],
                    'mes',
                    'Humedad Relativa (%)',
                    'humedad',
                    '%',
                    true,
                    'Porcentaje promedio de humedad relativa en el aire registrado mensualmente',
                    true
                );
                if (chart) charts.push(chart);
            }

            // Gráfico 2: Radiación Global
            if (humedad_radiacion_uv.length > 0) {
                const chart = renderGenericChart(
                    humedad_radiacion_uv,
                    ['rad_global_med'],
                    'Radiación Solar Global Media',
                    ['#f59e0b'],
                    ['Radiación Global'],
                    'mes',
                    'Radiación (W/m²)',
                    'radiacion',
                    ' W/m²',
                    true,
                    'Energía solar total recibida por unidad de superficie horizontal'
                );
                if (chart) charts.push(chart);
            }

            // Gráfico 3: UVB Promedio
            if (humedad_radiacion_uv.length > 0) {
                const chart = renderGenericChart(
                    humedad_radiacion_uv,
                    ['uvb_prom'],
                    'Radiación Ultravioleta B (UVB) Promedio',
                    ['#8b5cf6'],
                    ['Índice UVB'],
                    'mes',
                    'Índice UVB',
                    'uvb',
                    '',
                    true,
                    'Índice de radiación ultravioleta B que alcanza la superficie terrestre'
                );
                if (chart) charts.push(chart);
            }

            // Gráfico 4: Olas de Calor
            if (olas_de_calor.length > 0) {
                const chart = renderGenericChart(
                    olas_de_calor,
                    ['num_eventos'],
                    'Frecuencia de Eventos de Olas de Calor',
                    ['#ef4444'],
                    ['Número de Eventos'],
                    'mes',
                    'Eventos Registrados',
                    'olas-calor',
                    ' eventos',
                    true,
                    'Número de episodios de temperaturas anormalmente altas por período prolongado'
                );
                if (chart) charts.push(chart);
            }

            if (charts.length === 0) {
                return (
                    <div className="text-center py-8 text-gray-500">
                        No hay datos adicionales disponibles
                    </div>
                );
            }

            return <div className="space-y-4">{charts}</div>;
        }

        return null;
    };

    return (
        <div className="relative h-screen pt-16 overflow-hidden bg-gray-50">

            {/* LEFT SIDEBAR - Buscar + Filtros */}
            <div
                className={`absolute top-16 left-0 h-full bg-white shadow-xl z-[1100] transition-transform duration-300 flex flex-col
                    ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    w-full sm:w-96`}
            >
                {/* Header del sidebar */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Buscar Estación
                    </h2>
                    <button
                        onClick={() => setLeftSidebarOpen(false)}
                        className="hover:bg-gray-100 p-2 rounded-full transition-colors"
                        title="Cerrar búsqueda"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Contenido scrolleable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Búsqueda */}
                    <Input
                        placeholder="Buscar estación..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                    />

                    {/* Lista de estaciones */}
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">
                            Cargando estaciones...
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">
                            {error}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">
                                {filteredEstaciones.length} estaciones encontradas
                            </p>
                            {filteredEstaciones.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No se encontraron estaciones
                                </div>
                            ) : (
                                filteredEstaciones.map((estacion) => (
                                    <div
                                        key={estacion.id}
                                        onClick={() => handleEstacionClick(estacion)}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                                            ${selectedEstacion?.id === estacion.id
                                                ? "bg-emerald-100 border-2 border-emerald-500"
                                                : "hover:bg-gray-100 border border-transparent"
                                            }`}
                                    >
                                        <MapPin className={`w-4 h-4 flex-shrink-0 ${selectedEstacion?.id === estacion.id ? 'text-emerald-600' : 'text-gray-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                                {estacion.nombre}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate">
                                                {estacion.descripcion}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT SIDEBAR - Panel de Datos */}
            <div
                className={`absolute top-16 right-0 h-full bg-white shadow-xl z-[1200] transition-transform duration-300 flex flex-col
                    ${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                    w-full sm:w-96 lg:w-[28rem]`}
            >
                {selectedEstacion && (
                    <>
                        {/* Header del panel */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <BarChart3 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h2 className="font-semibold truncate">{selectedEstacion.nombre}</h2>
                                    <p className="text-sm text-gray-500 truncate">{selectedEstacion.descripcion}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={descargarInformacion}
                                    className="flex items-center gap-2"
                                    title="Descargar como PNG"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowGlosario(true)}
                                    className="flex items-center gap-2"
                                    title="Ver Glosario"
                                >
                                    <BookOpen className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setRightSidebarOpen(false)}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Tabs de métricas */}
                        <div className="border-b overflow-x-auto">
                            <div className="flex p-2 gap-1 min-w-max">
                                {availableMetrics.map((metric) => (
                                    <Button
                                        key={metric}
                                        variant={selectedMetric === metric ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setSelectedMetric(metric)}
                                        className={`${selectedMetric === metric ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                                    >
                                        {metricLabels[metric]}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Contenido del gráfico */}
                        <div ref={contentRef} className="flex-1 overflow-y-auto p-4 pb-16 space-y-4">
                            {renderMetricCharts()}
                        </div>
                    </>
                )}
            </div>

            {/* MAPA PRINCIPAL */}
            <div className="w-full h-full relative z-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                        <p className="text-gray-700 font-medium">Cargando estaciones...</p>
                        <p className="text-sm text-gray-500 mt-1">Preparando datos ambientales</p>
                    </div>
                ) : (
                    <Map
                        estaciones={filteredEstaciones}
                        selectedEstacion={selectedEstacion}
                        onEstacionSelect={handleMarkerClick}
                        showZoomControls={!leftSidebarOpen}
                    />
                )}
            </div>

            {/* BOTÓN FLOTANTE - Buscar estaciones */}
            {!leftSidebarOpen && (
                <div className="fixed top-20 left-4 z-[1100] flex flex-col gap-2">
                    <button
                        className="shadow-2xl bg-white hover:bg-gray-100 text-gray-700 border-2 border-gray-300 w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer"
                        onClick={() => setLeftSidebarOpen(true)}
                        title="Buscar estación"
                    >
                        <Search className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* MODAL DE GRÁFICO EXPANDIDO */}
            {expandedChart && (() => {
                // Forzar uso de modalRenderKey para que React detecte cambios
                const _renderKey = modalRenderKey;

                const currentView = chartViews[expandedChart.chartKey] || 'mensual';
                const currentTimeRange = timeRangeFilters[expandedChart.chartKey] || (currentView === 'anual' ? '2years' : '1year');
                const currentStatsVisible = statsVisible[expandedChart.chartKey] || false;

                // Recalcular displayData con filtros actuales
                let modalDisplayData = expandedChart.rawData;
                const originalXAxisKey = expandedChart.config.originalXAxisKey || expandedChart.config.xAxisKey; // Usar el eje original guardado
                let modalDisplayXAxisKey = originalXAxisKey;

                // Aplicar filtro de tiempo ANTES de cualquier agregación (siempre con el eje original 'mes')
                if (expandedChart.allowTimeRangeFilter) {
                    modalDisplayData = filterByTimeRange(modalDisplayData, currentTimeRange, originalXAxisKey);
                }

                // Aplicar vista anual si está habilitado y seleccionado
                if (expandedChart.allowTemporalSwitch && currentView === 'anual') {
                    // Vista ANUAL: Agregar datos por año
                    modalDisplayData = aggregateByYear(modalDisplayData, expandedChart.config.dataKeys);
                    modalDisplayXAxisKey = 'anio';
                    modalDisplayData = modalDisplayData.sort((a, b) => {
                        const yearA = parseInt(a.anio);
                        const yearB = parseInt(b.anio);
                        if (isNaN(yearA) || isNaN(yearB)) return 0;
                        return yearA - yearB;
                    });
                } else {
                    // Vista MENSUAL: Mantener datos mensuales con eje 'mes'
                    modalDisplayXAxisKey = originalXAxisKey; // 'mes'
                }

                // Recalcular estadísticas con los datos filtrados
                const modalStats = calculateMultiStats(modalDisplayData, expandedChart.config.dataKeys);

                // Recalcular el tipo de gráfico basado en los datos actuales
                const validCounts = expandedChart.config.dataKeys.map((key: string) =>
                    modalDisplayData.filter((item: any) => item[key] !== null && item[key] !== undefined && item[key] !== '').length
                );
                const maxCount = Math.max(...validCounts);
                const useBarChart = maxCount <= 1;
                const ChartComponent = useBarChart ? BarChart : LineChart;

                return (
                    <div
                        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                        onClick={() => setExpandedChart(null)}
                    >
                        <div
                            className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[75vh] overflow-y-auto animate-in zoom-in-95 duration-300"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                                <h3 className="text-2xl font-bold">{expandedChart.config.title}</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setExpandedChart(null)}
                                    className="hover:bg-gray-100"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>

                            {/* Controles en modal */}
                            <div className="px-6 pt-4 pb-2 border-b bg-gray-50">
                                <div className="flex items-center gap-3 flex-wrap">
                                    {/* Toggle mensual/anual */}
                                    {expandedChart.allowTemporalSwitch && (
                                        <button
                                            onClick={() => {
                                                if (!expandedChart) return;
                                                setChartViews(prev => ({
                                                    ...prev,
                                                    [expandedChart.chartKey]: currentView === 'mensual' ? 'anual' : 'mensual'
                                                }));
                                                setModalRenderKey(prev => prev + 1);
                                            }}
                                            className="relative inline-flex h-9 w-32 items-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                                        >
                                            <span
                                                className={`inline-flex h-8 w-16 items-center justify-center rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
                                                    currentView === 'anual' ? 'translate-x-[60px]' : 'translate-x-0.5'
                                                }`}
                                            >
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {currentView === 'mensual' ? 'Mensual' : 'Anual'}
                                                </span>
                                            </span>
                                            <span className="absolute left-2 text-sm font-medium text-gray-600 pointer-events-none">
                                                {currentView === 'mensual' ? '' : 'Mensual'}
                                            </span>
                                            <span className="absolute right-2 text-sm font-medium text-gray-600 pointer-events-none">
                                                {currentView === 'anual' ? '' : 'Anual'}
                                            </span>
                                        </button>
                                    )}

                                    {/* Filtros de rango temporal */}
                                    {expandedChart.allowTimeRangeFilter && (
                                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                                            {(['1year', '2years', '5years', 'all'] as const).map((range) => {
                                                const labels = { '1year': '1 año', '2years': '2 años', '5years': '5 años', 'all': 'Todo' };
                                                return (
                                                    <button
                                                        key={range}
                                                        onClick={() => {
                                                            if (!expandedChart) return;
                                                            setTimeRangeFilters(prev => ({ ...prev, [expandedChart.chartKey]: range }));
                                                            setModalRenderKey(prev => prev + 1);
                                                        }}
                                                        className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                                                            currentTimeRange === range
                                                                ? 'bg-white text-gray-900 shadow-sm'
                                                                : 'text-gray-600 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        {labels[range]}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Gráfico */}
                            <div className="p-6">
                                <ResponsiveContainer width="100%" height={600} key={`chart-${currentView}-${useBarChart}`}>
                                {useBarChart ? (
                                    <BarChart data={modalDisplayData} margin={{ top: 10, right: 40, left: 10, bottom: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey={modalDisplayXAxisKey}
                                            tick={{ fontSize: 14 }}
                                            angle={-45}
                                            textAnchor="end"
                                            tickMargin={10}
                                            label={{
                                                value: currentView === 'anual' ? 'Año' : 'Periodo',
                                                position: 'insideBottom',
                                                offset: 5,
                                                style: { fontSize: 14, fontWeight: '600', fill: '#374151' }
                                            }}
                                            height={130}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            domain={getYAxisDomain(modalDisplayData, expandedChart.config.dataKeys)}
                                            tick={{ fontSize: 14 }}
                                            label={{
                                                value: expandedChart.config.yAxisLabel,
                                                angle: -90,
                                                position: 'insideLeft',
                                                style: { fontSize: 16 }
                                            }}
                                        />
                                        <Tooltip contentStyle={{ fontSize: 14 }} />
                                        <Legend wrapperStyle={{ fontSize: 14 }} />
                                        {modalStats.map((stat: any, idx: number) => (
                                            <ReferenceLine
                                                key={`ref-${stat.dataKey}`}
                                                y={stat.mean}
                                                stroke={expandedChart.config.colors[expandedChart.config.dataKeys.indexOf(stat.dataKey)]}
                                                strokeDasharray="5 5"
                                                strokeOpacity={0.5}
                                                label={{
                                                    value: `Media ${expandedChart.config.labels[expandedChart.config.dataKeys.indexOf(stat.dataKey)]}`,
                                                    position: idx % 2 === 0 ? 'right' : 'left',
                                                    fontSize: 11,
                                                    fill: expandedChart.config.colors[expandedChart.config.dataKeys.indexOf(stat.dataKey)]
                                                }}
                                            />
                                        ))}
                                        {expandedChart.config.dataKeys.map((dataKey: string, index: number) => {
                                            const hasData = modalDisplayData.some((item: any) =>
                                                item[dataKey] !== null && item[dataKey] !== undefined && item[dataKey] !== ''
                                            );
                                            if (!hasData) return null;

                                            return (
                                                <Bar
                                                    key={dataKey}
                                                    dataKey={dataKey}
                                                    fill={expandedChart.config.colors[index]}
                                                    name={expandedChart.config.labels[index]}
                                                />
                                            );
                                        })}
                                    </BarChart>
                                ) : (
                                    <LineChart data={modalDisplayData} margin={{ top: 10, right: 40, left: 10, bottom: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey={modalDisplayXAxisKey}
                                            tick={{ fontSize: 14 }}
                                            angle={-45}
                                            textAnchor="end"
                                            tickMargin={10}
                                            label={{
                                                value: currentView === 'anual' ? 'Año' : 'Periodo',
                                                position: 'insideBottom',
                                                offset: 5,
                                                style: { fontSize: 14, fontWeight: '600', fill: '#374151' }
                                            }}
                                            height={130}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            domain={getYAxisDomain(modalDisplayData, expandedChart.config.dataKeys)}
                                            tick={{ fontSize: 14 }}
                                            label={{
                                                value: expandedChart.config.yAxisLabel,
                                                angle: -90,
                                                position: 'insideLeft',
                                                style: { fontSize: 16 }
                                            }}
                                        />
                                        <Tooltip contentStyle={{ fontSize: 14 }} />
                                        <Legend wrapperStyle={{ fontSize: 14 }} />
                                        {modalStats.map((stat: any, idx: number) => (
                                            <ReferenceLine
                                                key={`ref-${stat.dataKey}`}
                                                y={stat.mean}
                                                stroke={expandedChart.config.colors[expandedChart.config.dataKeys.indexOf(stat.dataKey)]}
                                                strokeDasharray="5 5"
                                                strokeOpacity={0.5}
                                                label={{
                                                    value: `Media ${expandedChart.config.labels[expandedChart.config.dataKeys.indexOf(stat.dataKey)]}`,
                                                    position: idx % 2 === 0 ? 'right' : 'left',
                                                    fontSize: 11,
                                                    fill: expandedChart.config.colors[expandedChart.config.dataKeys.indexOf(stat.dataKey)]
                                                }}
                                            />
                                        ))}
                                        {expandedChart.config.dataKeys.map((dataKey: string, index: number) => {
                                            const hasData = modalDisplayData.some((item: any) =>
                                                item[dataKey] !== null && item[dataKey] !== undefined && item[dataKey] !== ''
                                            );
                                            if (!hasData) return null;

                                            return (
                                                <Line
                                                    key={dataKey}
                                                    type="monotone"
                                                    dataKey={dataKey}
                                                    stroke={expandedChart.config.colors[index]}
                                                    name={expandedChart.config.labels[index]}
                                                    strokeWidth={3}
                                                />
                                            );
                                        })}
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                            </div>

                            {/* Análisis Estadístico Detallado - Siempre visible en modal */}
                            {modalStats.length > 0 && (
                                <div className="px-6 pb-6">
                                    <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                                            <h4 className="text-base font-semibold text-gray-800">Análisis Estadístico Detallado</h4>
                                            <Badge variant="secondary" className="text-sm ml-auto">
                                                {modalDisplayData.length} registros
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {modalStats.map((stat: any) => {
                                                const labelIndex = expandedChart.config.dataKeys.indexOf(stat.dataKey);
                                                const label = expandedChart.config.labels[labelIndex] || stat.dataKey;
                                                const color = expandedChart.config.colors[labelIndex] || '#6b7280';

                                                return (
                                                    <div key={stat.dataKey} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div
                                                                className="w-4 h-4 rounded-full"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                            <span className="text-sm font-bold text-gray-800">{label}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            <Badge variant="outline" className="bg-blue-50 border-blue-200 justify-between">
                                                                <span className="font-medium">Promedio:</span>
                                                                <span className="font-bold">{(Math.trunc(stat.mean * 10) / 10).toFixed(1)}{expandedChart.config.unit}</span>
                                                            </Badge>
                                                            <Badge variant="outline" className="bg-purple-50 border-purple-200 justify-between">
                                                                <span className="font-medium">Mediana:</span>
                                                                <span className="font-bold">{(Math.trunc(stat.median * 10) / 10).toFixed(1)}{expandedChart.config.unit}</span>
                                                            </Badge>
                                                            <Badge variant="outline" className="bg-green-50 border-green-200 justify-between">
                                                                <span className="font-medium">Máximo:</span>
                                                                <span className="font-bold">{(Math.trunc(stat.max * 10) / 10).toFixed(1)}{expandedChart.config.unit}</span>
                                                            </Badge>
                                                            <Badge variant="outline" className="bg-orange-50 border-orange-200 justify-between">
                                                                <span className="font-medium">Mínimo:</span>
                                                                <span className="font-bold">{(Math.trunc(stat.min * 10) / 10).toFixed(1)}{expandedChart.config.unit}</span>
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Modal de Glosario */}
            <GlosarioModal isOpen={showGlosario} onClose={() => setShowGlosario(false)} />
        </div>
    );
}
