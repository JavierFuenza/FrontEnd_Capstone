// src/components/MapaInteractivoPage.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Filter, Wind, Droplets } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Map } from './Map';

interface Estacion {
    id: number;
    nombre: string;
    latitud: number;
    longitud: number;
    descripcion: string;
    created_at: string;
}

// Mock data para gráficos (temporal)
const temperatureData = [
    { date: "2024-09", temp: 18 }, { date: "2024-10", temp: 17 }, { date: "2024-11", temp: 22 },
    { date: "2024-12", temp: 25 }, { date: "2025-01", temp: 28 }, { date: "2025-02", temp: 31 },
    { date: "2025-03", temp: 33 }, { date: "2025-04", temp: 30 }, { date: "2025-05", temp: 27 },
    { date: "2025-06", temp: 24 }, { date: "2025-07", temp: 21 }, { date: "2025-08", temp: 19 },
    { date: "2025-09", temp: 22 },
];

export function MapaInteractivoPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [estaciones, setEstaciones] = useState<Estacion[]>([]);
    const [filteredEstaciones, setFilteredEstaciones] = useState<Estacion[]>([]);
    const [selectedEstacion, setSelectedEstacion] = useState<Estacion | null>(null);
    const [activeFilter, setActiveFilter] = useState("Aire");
    const [airFilter, setAirFilter] = useState("temperatura-maxima");
    const [waterFilter, setWaterFilter] = useState("ph");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                if (data.length > 0) {
                    setSelectedEstacion(data[0]);
                }
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

    const handleEstacionClick = (estacion: Estacion) => {
        setSelectedEstacion(estacion);
    };

    return (
        <div className="pt-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Search className="w-5 h-5 text-gray-500" />
                                    <CardTitle className="text-lg">Buscar Estación</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    placeholder="Buscar estación..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="mb-4"
                                />
                                {loading ? (
                                    <div className="text-center py-4 text-gray-500">
                                        Cargando estaciones...
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-4 text-red-500">
                                        {error}
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {filteredEstaciones.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500">
                                                No se encontraron estaciones
                                            </div>
                                        ) : (
                                            filteredEstaciones.map((estacion) => (
                                                <div
                                                    key={estacion.id}
                                                    onClick={() => handleEstacionClick(estacion)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedEstacion?.id === estacion.id ? "bg-emerald-100 border border-emerald-200" : "hover:bg-gray-100"}`}
                                                >
                                                    <MapPin className="w-4 h-4 text-emerald-600" />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{estacion.nombre}</div>
                                                        <div className="text-sm text-gray-500">{estacion.descripcion}</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-gray-500" />
                                    <CardTitle className="text-lg">Filtros</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 mb-4">
                                    <Button variant={activeFilter === "Aire" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("Aire")} className={`flex items-center gap-2 ${activeFilter === "Aire" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}>
                                        <Wind className="w-4 h-4" /> Aire
                                    </Button>
                                    <Button variant={activeFilter === "Agua" ? "default" : "outline"} size="sm" onClick={() => setActiveFilter("Agua")} className={`flex items-center gap-2 ${activeFilter === "Agua" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}>
                                        <Droplets className="w-4 h-4" /> Agua
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {activeFilter === "Aire" && (
                                        <Select value={airFilter} onValueChange={setAirFilter}>
                                            <SelectTrigger><SelectValue placeholder="Seleccionar métrica de aire" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="temperatura-maxima">Temperatura Máxima (°C)</SelectItem>
                                                <SelectItem value="pm25">PM2.5 (μg/m³)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {activeFilter === "Agua" && (
                                        <Select value={waterFilter} onValueChange={setWaterFilter}>
                                            <SelectTrigger><SelectValue placeholder="Seleccionar métrica de agua" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ph">pH</SelectItem>
                                                <SelectItem value="turbidez">Turbidez (NTU)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Section */}
                    <div className="lg:col-span-9 space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="text-xl">Mapa de Chile</CardTitle></CardHeader>
                            <CardContent>
                                <div className="h-96 w-full rounded-lg overflow-hidden">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full bg-gray-100">
                                            <p className="text-gray-500">Cargando mapa...</p>
                                        </div>
                                    ) : (
                                        <Map estaciones={estaciones} selectedEstacion={selectedEstacion} />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        {selectedEstacion && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg">Datos de {selectedEstacion.nombre}</CardTitle>
                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-sm font-medium">{activeFilter}</span>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={temperatureData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="temp" stroke="#059669" strokeWidth={2} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}