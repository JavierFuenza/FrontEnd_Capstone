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
  TrendingUp
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

export function RecursosHidricosPage() {
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<EntidadAgua[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<EntidadAgua[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<EntidadAgua | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [entityData, setEntityData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const entityTypes = [
    { value: 'Cuenca Hidrográfica', label: 'Cuenca Hidrográfica', icon: '🏞️' },
    { value: 'Embalse', label: 'Embalse', icon: '🏗️' },
    { value: 'Estación Costera - Coliformes Acuosos', label: 'Est. Costera - Coliformes Acuosos', icon: '🌊' },
    { value: 'Estación Costera - Coliformes Biológicos', label: 'Est. Costera - Coliformes Biológicos', icon: '🦠' },
    { value: 'Estación Costera - Metales Disueltos', label: 'Est. Costera - Metales Disueltos', icon: '⚗️' },
    { value: 'Estación Costera - Metales Sedimentos', label: 'Est. Costera - Metales Sedimentos', icon: '🧪' },
    { value: 'Estación Fluviométrica', label: 'Estación Fluviométrica', icon: '🌊' },
    { value: 'Estación Meteorológica', label: 'Estación Meteorológica', icon: '🌤️' },
    { value: 'Estación Nivométrica', label: 'Estación Nivométrica', icon: '❄️' },
    { value: 'Estación Oceanográfica', label: 'Estación Oceanográfica', icon: '🌊' },
    { value: 'Estación de Evaporación', label: 'Estación de Evaporación', icon: '☀️' },
    { value: 'Pozo de Monitoreo', label: 'Pozo de Monitoreo', icon: '🕳️' }
  ];

  useEffect(() => {
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
    <div className="flex h-screen w-full overflow-hidden pt-[60px]">
      {/* Left Sidebar Panel */}
      <div className={`${isPanelCollapsed ? 'w-0' : 'w-80'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-500 to-emerald-600">
          <div className="flex items-center gap-2 text-white mb-2">
            <Droplets className="w-6 h-6" />
            <h2 className="text-lg font-bold">Recursos Hídricos</h2>
          </div>
          <p className="text-sm text-emerald-100">
            Sistema de gestión de recursos acuáticos
          </p>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar entidades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Filtros Activos</h3>
            {(selectedEntityType || searchQuery) && (
              <button
                onClick={clearFilters}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Limpiar
              </button>
            )}
          </div>
          {selectedEntityType && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm">
              <Tag className="w-3 h-3" />
              <span className="flex-1 truncate">
                {entityTypes.find(t => t.value === selectedEntityType)?.label}
              </span>
              <button onClick={() => setSelectedEntityType(null)}>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Entity Types List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Tipos de Entidad</h3>
          <div className="space-y-1">
            {entityTypes.map((type) => {
              const count = entities.filter(e => e.tipo === type.value).length;
              const isSelected = selectedEntityType === type.value;

              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedEntityType(isSelected ? null : type.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-emerald-100 text-emerald-900 font-semibold border-2 border-emerald-500'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-sm truncate">{type.label}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{entities.length}</p>
            <p className="text-xs text-gray-600">Total de Entidades</p>
          </div>
        </div>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
        className="absolute left-80 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-r-lg px-1 py-3 hover:bg-gray-50 transition-all shadow-md"
        style={{ left: isPanelCollapsed ? '0' : '320px' }}
      >
        {isPanelCollapsed ? <ChevronDown className="w-4 h-4 rotate-90" /> : <ChevronUp className="w-4 h-4 rotate-90" />}
      </button>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedEntityType
                  ? entityTypes.find(t => t.value === selectedEntityType)?.label
                  : 'Todas las Entidades'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {loading ? 'Cargando...' : `${filteredEntities.length} entidad(es) encontrada(s)`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchEntities}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Actualizar
              </Button>
            </div>
          </div>
          {/* Search bar in main content */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar estaciones por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Cargando recursos hídricos...</p>
              </div>
            </div>
          ) : filteredEntities.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Droplets className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No se encontraron entidades
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedEntityType
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'No hay entidades registradas en el sistema'}
                </p>
                {(searchQuery || selectedEntityType) && (
                  <Button onClick={clearFilters} variant="outline">
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEntities.map((entity) => {
                const typeInfo = entityTypes.find(t => t.value === entity.tipo);
                return (
                  <Card
                    key={entity.id}
                    className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-emerald-500"
                    onClick={() => setSelectedEntity(entity)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{typeInfo?.icon}</span>
                          <CardTitle className="text-lg line-clamp-1">
                            {entity.nombre}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Tag className="w-3 h-3" />
                          <span className="line-clamp-1">{entity.tipo}</span>
                        </div>
                        {entity.descripcion && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {entity.descripcion}
                          </p>
                        )}
                        <div className="pt-2 flex items-center justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEntity(entity);
                            }}
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel (Slide-in from right) */}
      {selectedEntity && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40 pt-[60px]"
            onClick={() => setSelectedEntity(null)}
          />
          <div className="fixed right-0 top-[60px] h-[calc(100vh-60px)] w-[480px] bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-gray-900">Detalles</h3>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">
                    {entityTypes.find(t => t.value === selectedEntity.tipo)?.icon}
                  </span>
                  <h4 className="text-xl font-bold text-gray-900">{selectedEntity.nombre}</h4>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-emerald-600 mb-1">TIPO</p>
                  <p className="text-sm text-emerald-900">{selectedEntity.tipo}</p>
                </div>

                {selectedEntity.descripcion && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">DESCRIPCIÓN</p>
                    <p className="text-sm text-gray-900">{selectedEntity.descripcion}</p>
                  </div>
                )}

                {/* Data Chart Section */}
                <div className="bg-white border-2 border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h5 className="text-sm font-bold text-gray-900">Datos Históricos</h5>
                  </div>

                  {loadingData ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    </div>
                  ) : entityData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay datos disponibles</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2">
                        <p className="text-xs text-gray-600">
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

                        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

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
                            <div className="space-y-4">
                              {Object.entries(parameterGroups).map(([paramName, paramData], index) => (
                                <div key={paramName} className="bg-gray-50 rounded-lg p-3 relative">
                                  <h6 className="text-xs font-semibold text-gray-700 mb-2">
                                    {paramName}
                                  </h6>
                                  <AIExplainButton
                                    chartData={paramData}
                                    chartConfig={{
                                      nombre: `${selectedEntity?.nombre} - ${paramName}`,
                                      metrica: paramName,
                                      temporalView: 'mensual'
                                    }}
                                    userContext={{
                                      chartType: 'area'
                                    }}
                                    position="top-right"
                                  />
                                  <ResponsiveContainer width="100%" height={180}>
                                    <AreaChart data={paramData}>
                                      <defs>
                                        <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                      <XAxis
                                        dataKey={timeField}
                                        tick={{ fontSize: 7 }}
                                        stroke="#6b7280"
                                        angle={-45}
                                        textAnchor="end"
                                        height={50}
                                      />
                                      <YAxis
                                        tick={{ fontSize: 9 }}
                                        stroke="#6b7280"
                                        width={45}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                          border: '1px solid #d1d5db',
                                          borderRadius: '6px',
                                          fontSize: '11px',
                                          padding: '6px 8px'
                                        }}
                                      />
                                      <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={colors[index % colors.length]}
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill={`url(#gradient-${index})`}
                                        dot={{ r: 2, fill: colors[index % colors.length] }}
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              ))}
                            </div>
                          );
                        } else {
                          // Obtener todos los campos numéricos (excluyendo estacion y tiempo)
                          const numericFields = Object.keys(entityData[0] || {}).filter(
                            key => !['estacion', 'estaciones_poal', timeField].includes(key) && typeof entityData[0][key] === 'number'
                          );

                          return (
                            <div className="space-y-4">
                              {numericFields.map((field, index) => (
                                <div key={field} className="bg-gray-50 rounded-lg p-3 relative">
                                  <h6 className="text-xs font-semibold text-gray-700 mb-2 uppercase">
                                    {field.replace(/_/g, ' ')}
                                  </h6>
                                  <AIExplainButton
                                    chartData={entityData}
                                    chartConfig={{
                                      nombre: `${selectedEntity?.nombre} - ${field.replace(/_/g, ' ')}`,
                                      metrica: field,
                                      temporalView: 'mensual'
                                    }}
                                    userContext={{
                                      chartType: 'area'
                                    }}
                                    position="top-right"
                                  />
                                  <ResponsiveContainer width="100%" height={180}>
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
                                        tick={{ fontSize: 7 }}
                                        stroke="#6b7280"
                                        angle={-45}
                                        textAnchor="end"
                                        height={50}
                                      />
                                      <YAxis
                                        tick={{ fontSize: 9 }}
                                        stroke="#6b7280"
                                        width={45}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                          border: '1px solid #d1d5db',
                                          borderRadius: '6px',
                                          fontSize: '11px',
                                          padding: '6px 8px'
                                        }}
                                      />
                                      <Area
                                        type="monotone"
                                        dataKey={field}
                                        stroke={colors[index % colors.length]}
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill={`url(#gradient-${index})`}
                                        dot={{ r: 2, fill: colors[index % colors.length] }}
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
                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1 uppercase">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-900">
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
    </div>
  );
}
