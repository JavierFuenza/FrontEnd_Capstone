import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIExplainButton } from './AIExplainButton';
import {
  Droplets,
  Search,
  X,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
  BarChart3,
  MapPin,
  Calendar,
  Tag,
  TrendingUp,
  Maximize2,
  SlidersHorizontal
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { EXTENDED_COLOR_PALETTE } from '@/lib/colorPalette';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8000/';

interface EntidadAgua {
  id: number;
  nombre: string;
  tipo: string;
  descripcion?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// Mapeo de nombres técnicos a nombres descriptivos
const fieldNameMapping: Record<string, string> = {
  // Cuencas
  'num_glaciares_por_cuenca': 'Número de glaciares',
  'area_cuenca_km2': 'Área de la cuenca (km²)',
  'area_glaciares_km2': 'Área de glaciares (km²)',
  'superficie_cuenca': 'Superficie (km²)',
  'longitud_cauce_principal': 'Longitud del cauce principal (km)',
  'superficie_de_glaciares_por_cuenca': 'Superficie de glaciares (km²)',
  'volumen_de_hielo_glaciar_estimado_por_cuenca': 'Volumen de hielo glaciar estimado (km³)',
  'volumen_de_agua_de_glaciares_estimada_por_cuenca': 'Volumen de agua de glaciares estimada (km³)',

  // Embalses
  'capacidad_embalse_m3': 'Capacidad del embalse (m³)',
  'volumen_util': 'Volumen útil (m³)',
  'cota_maxima': 'Cota máxima (m)',
  'cota_minima': 'Cota mínima (m)',
  'nivel_actual': 'Nivel actual (m)',
  'cota_coronamiento': 'Cota coronamiento (m)',
  'superficie_inundada': 'Superficie inundada (ha)',

  // Estaciones Meteorológicas
  'temperatura_promedio': 'Temperatura promedio (°C)',
  'temperatura_max': 'Temperatura máxima (°C)',
  'temperatura_min': 'Temperatura mínima (°C)',
  'precipitacion': 'Precipitación (mm)',
  'humedad_relativa': 'Humedad relativa (%)',
  'velocidad_viento': 'Velocidad del viento (km/h)',
  'direccion_viento': 'Dirección del viento',
  'presion_atmosferica': 'Presión atmosférica (hPa)',
  'radiacion_solar': 'Radiación solar (W/m²)',

  // Estaciones Fluviométricas
  'caudal': 'Caudal (m³/s)',
  'caudal_promedio': 'Caudal promedio (m³/s)',
  'caudal_max': 'Caudal máximo (m³/s)',
  'caudal_min': 'Caudal mínimo (m³/s)',
  'nivel_agua': 'Nivel del agua (m)',
  'altura_rio': 'Altura del río (m)',

  // Estaciones Nivométricas
  'altura_nieve': 'Altura de la nieve (cm)',
  'equivalente_agua_nieve': 'Equivalente de agua en nieve (mm)',
  'densidad_nieve': 'Densidad de la nieve (g/cm³)',
  'temperatura_nieve': 'Temperatura de la nieve (°C)',

  // Estaciones de Evaporación
  'evaporacion': 'Evaporación (mm)',
  'evaporacion_diaria': 'Evaporación diaria (mm)',
  'evaporacion_mensual': 'Evaporación mensual (mm)',
  'evaporacion_acumulada': 'Evaporación acumulada (mm)',

  // Metales y Coliformes
  'concentracion': 'Concentración (μg/L)',
  'valor_medido': 'Concentración medida',
  'unidad_medida': 'Unidad de medida',
  'limite_permitido': 'Límite permitido',
  'cumple_norma': 'Cumple norma',

  // Pozos de Monitoreo
  'profundidad_pozo': 'Profundidad del pozo (m)',
  'nivel_freatico': 'Nivel freático (m)',
  'calidad_agua': 'Calidad del agua',
  'ph': 'pH',
  'conductividad': 'Conductividad (μS/cm)',
  'temperatura_agua': 'Temperatura del agua (°C)',

  // Campos temporales
  'anio': 'Año',
  'mes': 'Mes',
  'dia': 'Día',
  'fecha': 'Fecha',

  // Otros campos comunes
  'value': 'Concentración',
  'parametros_poal': 'Parámetro',
  'estacion': 'Estación',
  'estaciones_poal': 'Estación'
};

// Función para obtener el nombre descriptivo de un campo
const getFieldLabel = (fieldName: string): string => {
  return fieldNameMapping[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export function RecursosHidricosPage() {
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<EntidadAgua[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<EntidadAgua[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<EntidadAgua | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() => {
    // En desktop (>= 1024px) el sidebar está abierto por defecto
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return true;
  });
  const [entityData, setEntityData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('recursos_hidricos_expanded_groups');
    return saved ? JSON.parse(saved) : {
      'monitoreo-costero': true,
      'clima-hidrologia': true,
      'recursos-hidricos': true,
      'monitoreo-subterraneo': true
    };
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  const [expandedChart, setExpandedChart] = useState<{
    title: string;
    data: any[];
    field: string;
    timeField: string;
    color: string;
    entityName: string;
  } | null>(null);

  // Estructura agrupada de tipos de entidades
  const entityGroups = [
    {
      id: 'monitoreo-costero',
      name: 'Monitoreo Costero',
      icon: '🌊',
      color: 'from-blue-500 to-cyan-500',
      types: [
        { value: 'Estación Costera - Coliformes Acuosos', label: 'Coliformes Acuosos', icon: '🌊' },
        { value: 'Estación Costera - Coliformes Biológicos', label: 'Coliformes Biológicos', icon: '🦠' },
        { value: 'Estación Costera - Metales Disueltos', label: 'Metales Disueltos', icon: '⚗️' },
        { value: 'Estación Costera - Metales Sedimentos', label: 'Metales Sedimentos', icon: '🧪' },
        { value: 'Estación Oceanográfica', label: 'Estación Oceanográfica', icon: '🌊' }
      ]
    },
    {
      id: 'clima-hidrologia',
      name: 'Clima e Hidrología',
      icon: '🌤️',
      color: 'from-amber-500 to-orange-500',
      types: [
        { value: 'Estación Meteorológica', label: 'Estación Meteorológica', icon: '🌤️' },
        { value: 'Estación Nivométrica', label: 'Estación Nivométrica', icon: '❄️' },
        { value: 'Estación Fluviométrica', label: 'Estación Fluviométrica', icon: '🌊' },
        { value: 'Estación de Evaporación', label: 'Estación de Evaporación', icon: '☀️' }
      ]
    },
    {
      id: 'recursos-hidricos',
      name: 'Recursos Hídricos',
      icon: '🏞️',
      color: 'from-emerald-500 to-green-500',
      types: [
        { value: 'Cuenca Hidrográfica', label: 'Cuenca Hidrográfica', icon: '🏞️' },
        { value: 'Embalse', label: 'Embalse', icon: '🏗️' }
      ]
    },
    {
      id: 'monitoreo-subterraneo',
      name: 'Monitoreo Subterráneo',
      icon: '🕳️',
      color: 'from-gray-500 to-slate-500',
      types: [
        { value: 'Pozo de Monitoreo', label: 'Pozo de Monitoreo', icon: '🕳️' }
      ]
    }
  ];

  // Crear lista plana de tipos para compatibilidad
  const entityTypes = entityGroups.flatMap(group => group.types);

  useEffect(() => {
    // Siempre cargar entidades al montar el componente
    fetchEntities();
  }, []);

  useEffect(() => {
    filterEntities();
  }, [entities, selectedEntityType, searchQuery]);

  useEffect(() => {
    if (selectedEntity) {
      fetchEntityData(selectedEntity.nombre, selectedEntity.tipo);
    } else {
      setEntityData([]);
    }
  }, [selectedEntity]);

  useEffect(() => {
    // Guardar estado de grupos expandidos en localStorage
    localStorage.setItem('recursos_hidricos_expanded_groups', JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  useEffect(() => {
    // Resetear a la primera página cuando cambien los filtros
    setCurrentPage(1);
  }, [selectedEntityType, searchQuery]);

  useEffect(() => {
    // Manejar cambios de tamaño de ventana para el sidebar
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isPanelCollapsed) {
        setIsPanelCollapsed(false);
      } else if (window.innerWidth < 1024 && !isPanelCollapsed) {
        setIsPanelCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isPanelCollapsed]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Calcular entidades paginadas
  const totalPages = Math.ceil(filteredEntities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntities = filteredEntities.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}api/private/entidades-agua/`);
      if (!response.ok) throw new Error('Error al cargar datos');
      const data = await response.json();
      setEntities(data);
    } catch (error) {
      console.error('Error fetching entities:', error);
      setEntities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntityData = async (nombre: string, tipo: string) => {
    try {
      setLoadingData(true);
      const response = await fetch(
        `${API_BASE_URL}api/private/entidades-agua/datos/${encodeURIComponent(nombre)}/${encodeURIComponent(tipo)}`
      );
      if (!response.ok) throw new Error('Error al cargar datos de la entidad');
      const data = await response.json();
      setEntityData(data);
    } catch (error) {
      console.error('Error fetching entity data:', error);
      setEntityData([]);
    } finally {
      setLoadingData(false);
    }
  };

  const filterEntities = () => {
    let filtered = entities;

    if (selectedEntityType) {
      filtered = filtered.filter(entity => entity.tipo === selectedEntityType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entity =>
        entity.nombre.toLowerCase().includes(query) ||
        entity.tipo.toLowerCase().includes(query) ||
        entity.descripcion?.toLowerCase().includes(query)
      );
    }

    setFilteredEntities(filtered);
  };

  const getEntityStats = () => {
    const stats = entityTypes.map(type => ({
      type: type.label,
      icon: type.icon,
      count: entities.filter(e => e.tipo === type.value).length
    }));
    return stats;
  };

  const clearFilters = () => {
    setSelectedEntityType(null);
    setSearchQuery('');
    setSelectedEntity(null);
  };

  return (
    <div className="flex flex-col sm:flex-row h-screen w-full overflow-hidden pt-[48px]">
      {/* Toggle Button for Mobile (solo < 640px) - Oculto cuando hay entidad seleccionada */}
      {!selectedEntity && (
        <button
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          className="sm:hidden fixed bottom-4 right-4 z-[60] bg-emerald-600 text-white rounded-full shadow-2xl hover:bg-emerald-700 transition-all flex items-center gap-2 px-4 py-3"
          aria-label="Filtros"
        >
          {isPanelCollapsed ? (
            <>
              <SlidersHorizontal className="w-5 h-5" />
              <span className="font-medium text-sm">Filtros</span>
            </>
          ) : (
            <X className="w-5 h-5" />
          )}
        </button>
      )}

      {/* Left Sidebar Panel - Responsive */}
      <div className={`
        ${isPanelCollapsed ? 'hidden lg:flex' : 'flex'}
        fixed sm:relative inset-0 sm:inset-auto
        ${isPanelCollapsed ? 'lg:w-0' : 'w-full sm:w-80 lg:w-72 xl:w-80'}
        bg-white border-r border-gray-200 flex-col transition-all duration-300 overflow-hidden
        pt-[48px] sm:pt-2
        z-[45] sm:z-auto
      `}>
        {/* Header - Responsive */}
        <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-500 to-emerald-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Droplets className="w-5 h-5 sm:w-6 sm:h-6" />
              <div>
                <h2 className="text-base sm:text-lg font-bold">Filtros</h2>
                <p className="text-[10px] sm:text-xs text-emerald-100 hidden sm:block">
                  Monitoreo de recursos hídricos
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPanelCollapsed(true)}
              className="sm:hidden text-white hover:bg-emerald-600 p-1.5 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar - Responsive */}
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar estaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9 sm:h-10 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-700">Filtros Activos</h3>
            {(selectedEntityType || searchQuery) && (
              <button
                onClick={clearFilters}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Limpiar
              </button>
            )}
          </div>
          {selectedEntityType && (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg text-xs">
              <Tag className="w-2.5 h-2.5" />
              <span className="flex-1 truncate">
                {entityTypes.find(t => t.value === selectedEntityType)?.label}
              </span>
              <button onClick={() => setSelectedEntityType(null)}>
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>

        {/* Entity Types List - Grouped */}
        <div className="flex-1 overflow-y-auto p-3">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Tipos de Estación</h3>
          <div className="space-y-2">
            {entityGroups.map((group) => {
              const isExpanded = expandedGroups[group.id];
              const groupTotal = group.types.reduce((sum, type) =>
                sum + entities.filter(e => e.tipo === type.value).length, 0
              );

              return (
                <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full px-2.5 py-2 bg-gradient-to-r ${group.color} bg-opacity-10 hover:bg-opacity-20 transition-all flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{group.icon}</span>
                      <span className="text-xs font-bold text-gray-800">{group.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white shadow-sm text-gray-700">
                        {groupTotal}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                  </button>

                  {/* Group Types */}
                  {isExpanded && (
                    <div className="p-2 space-y-0.5 bg-white">
                      {group.types.map((type) => {
                        const count = entities.filter(e => e.tipo === type.value).length;
                        const isSelected = selectedEntityType === type.value;

                        return (
                          <button
                            key={type.value}
                            onClick={() => setSelectedEntityType(isSelected ? null : type.value)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-between group ${
                              isSelected
                                ? 'bg-emerald-100 text-emerald-900 font-semibold border-2 border-emerald-500'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <span className="text-sm">{type.icon}</span>
                              <span className="text-xs truncate">{type.label}</span>
                            </div>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-xl font-bold text-emerald-600">{entities.length}</p>
            <p className="text-[10px] text-gray-600">Total de Estaciones</p>
          </div>
        </div>
      </div>

      {/* Collapse Button - Botón lateral para toggle rápido */}
      <button
        onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
        className="hidden sm:block absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-r-lg px-1 py-2.5 hover:bg-gray-50 transition-all shadow-md"
        style={{ left: isPanelCollapsed ? '0' : '320px' }}
      >
        {isPanelCollapsed ? <ChevronDown className="w-3.5 h-3.5 rotate-90" /> : <ChevronUp className="w-3.5 h-3.5 rotate-90" />}
      </button>

      {/* Main Content Area - Responsive */}
      <div className={`
        flex-1 flex flex-col overflow-hidden bg-gray-50
        ${!isPanelCollapsed ? 'hidden sm:flex' : 'flex'}
      `}>
        {/* Top Bar - Responsive */}
        <div className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-5 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 sm:mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                {selectedEntityType
                  ? entityTypes.find(t => t.value === selectedEntityType)?.label
                  : 'Todas las Estaciones'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                {loading ? 'Cargando...' : `${filteredEntities.length} estación(es) encontrada(s)`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3"
              >
                <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                Filtros
              </Button>
              <Button
                onClick={fetchEntities}
                variant="outline"
                size="sm"
                disabled={loading}
                className="h-8 text-xs px-2.5 sm:px-3"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin mr-1 sm:mr-1.5" /> : null}
                <span className="hidden sm:inline">Actualizar</span>
                <span className="sm:hidden">🔄</span>
              </Button>
            </div>
          </div>
          {/* Search bar in main content - Responsive */}
          <div className="relative max-w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar estaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9 sm:h-10 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600">Cargando recursos hídricos...</p>
              </div>
            </div>
          ) : filteredEntities.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Droplets className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                  No se encontraron estaciones
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {searchQuery || selectedEntityType
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'No hay estaciones registradas en el sistema'}
                </p>
                {(searchQuery || selectedEntityType) && (
                  <Button onClick={clearFilters} variant="outline" className="h-7 text-xs">
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className={`grid gap-2.5 sm:gap-3 ${
                isPanelCollapsed
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
              }`}>
                {paginatedEntities.map((entity) => {
                const typeInfo = entityTypes.find(t => t.value === entity.tipo);
                return (
                  <Card
                    key={entity.id}
                    className="hover:shadow-xl hover:scale-[1.02] hover:border-emerald-600 transition-all cursor-pointer border-l-[3px] border-l-emerald-500 hover:bg-emerald-50"
                    onClick={() => setSelectedEntity(entity)}
                  >
                    <CardHeader className="pb-2 px-3 pt-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl">{typeInfo?.icon}</span>
                          <CardTitle className="text-base line-clamp-1">
                            {entity.nombre}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Tag className="w-2.5 h-2.5" />
                          <span className="line-clamp-1">{entity.tipo}</span>
                        </div>
                        {entity.descripcion && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {entity.descripcion}
                          </p>
                        )}
                        <div className="pt-1.5 flex items-center justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEntity(entity);
                            }}
                          >
                            <Info className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2 pb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
                  >
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-90" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className={`h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs ${
                            currentPage === pageNum
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : ''
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 -rotate-90" />
                  </Button>
                </div>

                <div className="text-xs text-gray-600 text-center sm:text-left sm:ml-4">
                  {startIndex + 1}-{Math.min(endIndex, filteredEntities.length)} de {filteredEntities.length}
                </div>
              </div>
            )}
          </>
          )}
        </div>
      </div>

      {/* Detail Panel (Slide-in from right) */}
      {selectedEntity && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40 pt-[48px]"
            onClick={() => setSelectedEntity(null)}
          />
          <div className="fixed right-0 top-[48px] h-[calc(100vh-48px)] w-full sm:w-[90%] md:w-[500px] lg:w-[432px] bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-3 flex items-center justify-between z-10">
              <h3 className="text-base font-bold text-gray-900">Detalles</h3>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-2xl">
                    {entityTypes.find(t => t.value === selectedEntity.tipo)?.icon}
                  </span>
                  <h4 className="text-lg font-bold text-gray-900">{selectedEntity.nombre}</h4>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-emerald-50 rounded-lg p-2.5">
                  <p className="text-[10px] font-semibold text-emerald-600 mb-0.5">TIPO</p>
                  <p className="text-xs text-emerald-900">{selectedEntity.tipo}</p>
                </div>

                {selectedEntity.descripcion && (
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-[10px] font-semibold text-gray-600 mb-0.5">DESCRIPCIÓN</p>
                    <p className="text-xs text-gray-900">{selectedEntity.descripcion}</p>
                  </div>
                )}

                {/* Data Chart Section */}
                <div className="bg-white border-2 border-emerald-200 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <h5 className="text-xs font-bold text-gray-900">Datos Históricos</h5>
                  </div>

                  {loadingData ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
                    </div>
                  ) : entityData.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <BarChart3 className="w-10 h-10 mx-auto mb-1.5 opacity-50" />
                      <p className="text-xs">No hay datos disponibles</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-1.5">
                        <p className="text-[10px] text-gray-600">
                          {entityData.length} registro(s) encontrado(s)
                        </p>
                      </div>
                      {(() => {
                        // Detectar el campo de tiempo (anio, mes o dia)
                        const timeField = entityData[0]?.anio !== undefined
                          ? 'anio'
                          : entityData[0]?.mes !== undefined
                          ? 'mes'
                          : 'dia';

                        // Verificar si hay parámetros (para metales disueltos/sedimentos)
                        const hasParameters = entityData[0]?.parametros_poal !== undefined;

                        // Usar paleta accesible para daltónicos
                        const colors = EXTENDED_COLOR_PALETTE;

                        if (hasParameters) {
                          // Agrupar datos por parámetro
                          const parameterGroups = entityData.reduce((acc, item) => {
                            const param = item.parametros_poal;
                            if (!acc[param]) {
                              acc[param] = [];
                            }
                            acc[param].push(item);
                            return acc;
                          }, {} as Record<string, typeof entityData>);

                          return (
                            <div className="space-y-3">
                              {Object.entries(parameterGroups).map(([paramName, paramData], index) => {
                                const chartData = paramData as any[];
                                return (
                                <div key={paramName} className="bg-gray-50 rounded-lg p-2 relative">
                                  <h6 className="text-[10px] font-semibold text-gray-700 mb-1.5">
                                    {paramName}
                                  </h6>
                                  <button
                                    onClick={() => setExpandedChart({
                                      title: paramName,
                                      data: chartData,
                                      field: 'value',
                                      timeField: timeField,
                                      color: colors[index % colors.length],
                                      entityName: selectedEntity?.nombre || '',
                                      metricName: paramName
                                    })}
                                    className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors shadow-sm z-10"
                                    title="Expandir gráfico"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                    <span className="text-[9px] font-semibold">Expandir</span>
                                  </button>
                                  <ResponsiveContainer width="100%" height={160}>
                                    <AreaChart data={chartData}>
                                      <defs>
                                        <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                      <XAxis
                                        dataKey={timeField}
                                        tick={{ fontSize: 6 }}
                                        stroke="#6b7280"
                                        angle={-45}
                                        textAnchor="end"
                                        height={40}
                                      />
                                      <YAxis
                                        tick={{ fontSize: 8 }}
                                        stroke="#6b7280"
                                        width={35}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                          border: '1px solid #d1d5db',
                                          borderRadius: '6px',
                                          fontSize: '10px',
                                          padding: '4px 6px'
                                        }}
                                      />
                                      <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={colors[index % colors.length]}
                                        strokeWidth={1.5}
                                        fillOpacity={1}
                                        fill={`url(#gradient-${index})`}
                                        dot={{ r: 1.5, fill: colors[index % colors.length] }}
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                                );
                              })}
                            </div>
                          );
                        } else {
                          // Obtener todos los campos numéricos (excluyendo estacion y tiempo)
                          const numericFields = Object.keys(entityData[0] || {}).filter(
                            key => !['estacion', 'estaciones_poal', timeField].includes(key) && typeof entityData[0][key] === 'number'
                          );

                          return (
                            <div className="space-y-3">
                              {numericFields.map((field, index) => (
                                <div key={field} className="bg-gray-50 rounded-lg p-2 relative">
                                  <h6 className="text-[10px] font-semibold text-gray-700 mb-1.5">
                                    {getFieldLabel(field)}
                                  </h6>
                                  <button
                                    onClick={() => setExpandedChart({
                                      title: getFieldLabel(field),
                                      data: entityData,
                                      field: field,
                                      timeField: timeField,
                                      color: colors[index % colors.length],
                                      entityName: selectedEntity?.nombre || '',
                                      metricName: field
                                    })}
                                    className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors shadow-sm z-10"
                                    title="Expandir gráfico"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                    <span className="text-[9px] font-semibold">Expandir</span>
                                  </button>
                                  <ResponsiveContainer width="100%" height={160}>
                                    <AreaChart data={entityData}>
                                      <defs>
                                        <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                      <XAxis
                                        dataKey={timeField}
                                        tick={{ fontSize: 6 }}
                                        stroke="#6b7280"
                                        angle={-45}
                                        textAnchor="end"
                                        height={40}
                                      />
                                      <YAxis
                                        tick={{ fontSize: 8 }}
                                        stroke="#6b7280"
                                        width={35}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                          border: '1px solid #d1d5db',
                                          borderRadius: '6px',
                                          fontSize: '10px',
                                          padding: '4px 6px'
                                        }}
                                      />
                                      <Area
                                        type="monotone"
                                        dataKey={field}
                                        stroke={colors[index % colors.length]}
                                        strokeWidth={1.5}
                                        fillOpacity={1}
                                        fill={`url(#gradient-${index})`}
                                        dot={{ r: 1.5, fill: colors[index % colors.length] }}
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              ))}
                            </div>
                          );
                        }
                      })()}
                    </>
                  )}
                </div>

                {/* Additional fields */}
                {Object.entries(selectedEntity).map(([key, value]) => {
                  if (['id', 'nombre', 'tipo', 'descripcion', 'created_at', 'updated_at'].includes(key)) return null;
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] font-semibold text-gray-600 mb-0.5">
                        {getFieldLabel(key)}
                      </p>
                      <p className="text-xs text-gray-900">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Chart Expansion Modal */}
      {expandedChart && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-2 sm:p-4"
            onClick={() => setExpandedChart(null)}
          >
            <div
              className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-xl font-bold text-gray-900 truncate">{expandedChart.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 truncate">
                      {expandedChart.entityName}
                    </p>
                  </div>
                  {/* AI Explain Button en modal expandido */}
                  <AIExplainButton
                    chartData={expandedChart.data}
                    chartConfig={{
                      nombre: `${expandedChart.entityName} - ${expandedChart.title}`,
                      metrica: expandedChart.metricName || expandedChart.field,
                      temporalView: 'mensual',
                      field: expandedChart.field,
                      timeField: expandedChart.timeField
                    }}
                    userContext={{
                      selectedRegions: [expandedChart.entityName],
                      chartType: 'area',
                      expanded: true
                    }}
                    position="inline"
                  />
                </div>
                <button
                  onClick={() => setExpandedChart(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-3 sm:p-6">
                <ResponsiveContainer width="100%" height={350} className="sm:h-[500px]">
                  <AreaChart data={expandedChart.data}>
                    <defs>
                      <linearGradient id="expandedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={expandedChart.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={expandedChart.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey={expandedChart.timeField}
                      tick={{ fontSize: 10 }}
                      stroke="#6b7280"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="#6b7280"
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '11px',
                        padding: '6px 10px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: '10px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey={expandedChart.field}
                      stroke={expandedChart.color}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#expandedGradient)"
                      name={expandedChart.title}
                      dot={{ r: 2, fill: expandedChart.color }}
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Stats Summary */}
                <div className="mt-4 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                  {(() => {
                    const values = expandedChart.data
                      .map(d => d[expandedChart.field])
                      .filter(v => v !== null && v !== undefined && !isNaN(v));

                    if (values.length === 0) return null;

                    const max = Math.max(...values);
                    const min = Math.min(...values);
                    const avg = values.reduce((a, b) => a + b, 0) / values.length;
                    const sorted = [...values].sort((a, b) => a - b);
                    const median = sorted.length % 2 === 0
                      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                      : sorted[Math.floor(sorted.length / 2)];

                    return (
                      <>
                        <div className="bg-blue-50 rounded-lg p-2.5 sm:p-4 border border-blue-200">
                          <p className="text-[10px] sm:text-xs font-semibold text-blue-600 mb-0.5 sm:mb-1">PROMEDIO</p>
                          <p className="text-lg sm:text-2xl font-bold text-blue-900">{avg.toFixed(2)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2.5 sm:p-4 border border-purple-200">
                          <p className="text-[10px] sm:text-xs font-semibold text-purple-600 mb-0.5 sm:mb-1">MEDIANA</p>
                          <p className="text-lg sm:text-2xl font-bold text-purple-900">{median.toFixed(2)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2.5 sm:p-4 border border-green-200">
                          <p className="text-[10px] sm:text-xs font-semibold text-green-600 mb-0.5 sm:mb-1">MÁXIMO</p>
                          <p className="text-lg sm:text-2xl font-bold text-green-900">{max.toFixed(2)}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2.5 sm:p-4 border border-orange-200">
                          <p className="text-[10px] sm:text-xs font-semibold text-orange-600 mb-0.5 sm:mb-1">MÍNIMO</p>
                          <p className="text-lg sm:text-2xl font-bold text-orange-900">{min.toFixed(2)}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
