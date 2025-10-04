// src/components/MapaInteractivoPage.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, X, BarChart3, Maximize2, Calendar, TrendingUp, Info } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { Map } from './Map';
import { Badge } from "@/components/ui/badge";

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
    const [searchTerm, setSearchTerm] = useState("");
    const [estaciones, setEstaciones] = useState<Estacion[]>([]);
    const [filteredEstaciones, setFilteredEstaciones] = useState<Estacion[]>([]);
    const [selectedEstacion, setSelectedEstacion] = useState<Estacion | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('temperatura');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metricData, setMetricData] = useState<MetricData>({});
    const [loadingMetric, setLoadingMetric] = useState(false);
    const [availableMetrics, setAvailableMetrics] = useState<MetricType[]>([]);


    // Sidebar states
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

    // Modal state for chart expansion
    const [expandedChart, setExpandedChart] = useState<{ data: any[], config: any } | null>(null);

    // Temporal view states for each chart (keyed by chartKey)
    const [chartViews, setChartViews] = useState<Record<string, 'mensual' | 'anual'>>({});

    // Stats visibility states for each chart (keyed by chartKey)
    const [statsVisible, setStatsVisible] = useState<Record<string, boolean>>({});

    // Fetch estaciones desde el backend
    useEffect(() => {
        const fetchEstaciones = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:8000/api/private/estaciones/');
                if (!response.ok) {
                    throw new Error('Error al cargar estaciones');
                }
                const data = await response.json();
                setEstaciones(data);
                setFilteredEstaciones(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
                console.error('Error fetching estaciones:', err);
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

    // Función para determinar métricas disponibles
    const checkAvailableMetrics = async (estacion: Estacion) => {
        const metricsToCheck: MetricType[] = ['temperatura', 'mp25', 'mp10', 'o3', 'so2', 'no2', 'co', 'otros'];
        const available: MetricType[] = [];

        for (const metric of metricsToCheck) {
            try {
                const response = await fetch(
                    `http://localhost:8000/api/private/metricas/${metric}/${estacion.nombre}`
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
                    `http://localhost:8000/api/private/metricas/${selectedMetric}/${selectedEstacion.nombre}`
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

        // Calcular promedios anuales
        return Object.values(yearGroups).map(yearData => {
            const result: any = { anio: yearData.anio };
            dataKeys.forEach(key => {
                const values = yearData[`${key}_values`];
                if (values && values.length > 0) {
                    result[key] = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                }
            });
            return result;
        }).sort((a, b) => a.anio.localeCompare(b.anio));
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
        description = ''
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

        // Obtener vista actual de este gráfico desde el estado global
        const currentView = chartViews[chartKey] || 'mensual';
        const shouldShowTemporalSwitch = allowTemporalSwitch && xAxisKey === 'mes' && validData.length > 12;

        let displayData = validData;
        let displayXAxisKey = xAxisKey;

        if (shouldShowTemporalSwitch && currentView === 'anual') {
            displayData = aggregateByYear(validData, dataKeys);
            displayXAxisKey = 'anio';
        }

        // Función para cambiar la vista de este gráfico específico
        const toggleView = (view: 'mensual' | 'anual') => {
            setChartViews(prev => ({ ...prev, [chartKey]: view }));
        };

        // Calcular estadísticas para el primer dataKey (principal)
        const stats = calculateStats(displayData, dataKeys[0]);
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
            unit,
            stats
        };

        // Tooltip personalizado con más información
        const CustomTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                return (
                    <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900 mb-2">{label}</p>
                        {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: <span className="font-bold">{entry.value?.toFixed(2)}{unit}</span>
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
                            onClick={() => setExpandedChart({ data: displayData, config: chartConfig })}
                        >
                            <Maximize2 className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Botón para mostrar/ocultar estadísticas */}
                    {stats && (
                        <div className="mt-3">
                            <Button
                                variant={statsVisible[chartKey] ? "secondary" : "outline"}
                                size="sm"
                                className="text-xs h-8 px-3 border-dashed hover:border-solid transition-all"
                                onClick={() => setStatsVisible(prev => ({ ...prev, [chartKey]: !prev[chartKey] }))}
                            >
                                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                                {statsVisible[chartKey] ? 'Ocultar análisis estadístico' : 'Ver análisis estadístico'}
                                <Info className="w-3 h-3 ml-1.5 text-gray-400" />
                            </Button>

                            {/* Estadísticas descriptivas colapsables */}
                            {statsVisible[chartKey] && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in duration-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                                        <span className="text-xs font-semibold text-gray-700">Análisis Estadístico</span>
                                        <Badge variant="secondary" className="text-xs ml-auto">
                                            {totalRecords} registros
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <Badge variant="outline" className="bg-blue-50 border-blue-200">
                                            <span className="font-medium">Promedio:</span>
                                            <span className="ml-1 font-bold">{stats.mean.toFixed(2)}{unit}</span>
                                        </Badge>
                                        <Badge variant="outline" className="bg-green-50 border-green-200">
                                            <span className="font-medium">Máximo:</span>
                                            <span className="ml-1 font-bold">{stats.max.toFixed(2)}{unit}</span>
                                        </Badge>
                                        <Badge variant="outline" className="bg-orange-50 border-orange-200">
                                            <span className="font-medium">Mínimo:</span>
                                            <span className="ml-1 font-bold">{stats.min.toFixed(2)}{unit}</span>
                                        </Badge>
                                        <Badge variant="outline" className="bg-purple-50 border-purple-200">
                                            <span className="font-medium">Mediana:</span>
                                            <span className="ml-1 font-bold">{stats.median.toFixed(2)}{unit}</span>
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Selector de vista temporal */}
                    {shouldShowTemporalSwitch && (
                        <div className="flex gap-2 mt-3">
                            <Button
                                variant={currentView === 'mensual' ? 'default' : 'outline'}
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => toggleView('mensual')}
                            >
                                <Calendar className="w-3 h-3 mr-1" />
                                Vista Mensual
                            </Button>
                            <Button
                                variant={currentView === 'anual' ? 'default' : 'outline'}
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => toggleView('anual')}
                            >
                                <Calendar className="w-3 h-3 mr-1" />
                                Vista Anual
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                        <ChartComponent data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey={displayXAxisKey}
                                tick={{ fontSize: 11 }}
                                label={{
                                    value: currentView === 'anual' ? 'Año' : 'Mes',
                                    position: 'insideBottom',
                                    offset: -10,
                                    style: { fontSize: 13, fontWeight: '600', fill: '#374151' }
                                }}
                                height={60}
                            />
                            <YAxis
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
                            {stats && statsVisible[chartKey] && <ReferenceLine y={stats.mean} stroke="#9ca3af" strokeDasharray="5 5" label={{ value: 'Media', position: 'right', fontSize: 10, fill: '#6b7280' }} />}
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
                <div className="text-center py-8 text-gray-500">
                    Cargando datos...
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
                const validData = filterEmptyData(currentData, dataKeys);

                if (validData.length === 0) return null;

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
                                onClick={() => setExpandedChart({ data: validData, config: chartConfig })}
                            >
                                <Maximize2 className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <ChartComponent data={validData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
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
                    'Temperaturas extremas absolutas registradas mensualmente'
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
                    'Promedio mensual de temperaturas máximas y mínimas'
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
                    'Temperatura promedio mensual registrada'
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
                    'Porcentaje promedio de humedad relativa en el aire registrado mensualmente'
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
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRightSidebarOpen(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
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
                        <div className="flex-1 overflow-y-auto p-4 pb-16 space-y-4">
                            {renderMetricCharts()}
                        </div>
                    </>
                )}
            </div>

            {/* MAPA PRINCIPAL */}
            <div className="w-full h-full relative z-0">
                {loading ? (
                    <div className="flex items-center justify-center h-full bg-gray-100">
                        <p className="text-gray-500">Cargando mapa...</p>
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
            {expandedChart && (
                <div
                    className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setExpandedChart(null)}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b">
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
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={600}>
                                {expandedChart.config.useBarChart ? (
                                    <BarChart data={expandedChart.data}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey={expandedChart.config.xAxisKey}
                                            tick={{ fontSize: 14 }}
                                        />
                                        <YAxis
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
                                        {expandedChart.config.dataKeys.map((dataKey: string, index: number) => {
                                            const hasData = expandedChart.data.some((item: any) =>
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
                                    <LineChart data={expandedChart.data}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey={expandedChart.config.xAxisKey}
                                            tick={{ fontSize: 14 }}
                                        />
                                        <YAxis
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
                                        {expandedChart.config.dataKeys.map((dataKey: string, index: number) => {
                                            const hasData = expandedChart.data.some((item: any) =>
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
                    </div>
                </div>
            )}
        </div>
    );
}
