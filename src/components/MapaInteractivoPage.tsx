// src/components/MapaInteractivoPage.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Filter, Wind, Droplets } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock data
const cities = [
    { id: 1, name: "Santiago", region: "Metropolitana", lat: -33.4489, lng: -70.6693 },
    { id: 2, name: "Valparaíso", region: "Valparaíso", lat: -33.0472, lng: -71.6127 },
    { id: 3, name: "Concepción", region: "Bío Bío", lat: -36.8201, lng: -73.0444 },
    { id: 4, name: "La Serena", region: "Coquimbo", lat: -29.9027, lng: -71.2519 },
    { id: 5, name: "Antofagasta", region: "Antofagasta", lat: -23.6509, lng: -70.3975 },
    { id: 6, name: "Temuco", region: "Araucanía", lat: -38.7359, lng: -72.5904 },
];
const temperatureData = [
    { date: "2024-09", temp: 18 }, { date: "2024-10", temp: 17 }, { date: "2024-11", temp: 22 },
    { date: "2024-12", temp: 25 }, { date: "2025-01", temp: 28 }, { date: "2025-02", temp: 31 },
    { date: "2025-03", temp: 33 }, { date: "2025-04", temp: 30 }, { date: "2025-05", temp: 27 },
    { date: "2025-06", temp: 24 }, { date: "2025-07", temp: 21 }, { date: "2025-08", temp: 19 },
    { date: "2025-09", temp: 22 },
];

export function MapaInteractivoPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCity, setSelectedCity] = useState<(typeof cities)[0] | null>(cities[0]);
    const [activeFilter, setActiveFilter] = useState("Aire");
    const [filteredCities, setFilteredCities] = useState(cities);
    const [airFilter, setAirFilter] = useState("temperatura-maxima");
    const [waterFilter, setWaterFilter] = useState("ph");

    useEffect(() => {
        const filtered = cities.filter(city =>
            city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            city.region.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCities(filtered);
    }, [searchTerm]);

    const handleCityClick = (city: (typeof cities)[0]) => {
        setSelectedCity(city);
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
                                    <CardTitle className="text-lg">Buscar Ubicación</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    placeholder="Buscar ciudad o comuna..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="mb-4"
                                />
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {filteredCities.map((city) => (
                                        <div
                                            key={city.id}
                                            onClick={() => handleCityClick(city)}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedCity?.id === city.id ? "bg-emerald-100 border border-emerald-200" : "hover:bg-gray-100"}`}
                                        >
                                            <MapPin className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <div className="font-medium text-gray-900">{city.name}</div>
                                                <div className="text-sm text-gray-500">{city.region}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                                <div className="relative w-full h-80 bg-gradient-to-b from-blue-100 to-green-100 rounded-lg overflow-hidden">
                                    {cities.map((city) => (
                                        <div
                                            key={city.id}
                                            onClick={() => handleCityClick(city)}
                                            className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${selectedCity?.id === city.id ? "bg-emerald-600 text-white" : "bg-white text-gray-700 hover:bg-emerald-50"} px-3 py-2 rounded-lg shadow-md transition-all duration-200 border`}
                                            style={{ left: `${((city.lng + 75) / 15) * 100}%`, top: `${((city.lat + 45) / 25) * 100}%` }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span className="text-sm font-medium">{city.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        {selectedCity && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg">Datos de {selectedCity.name}</CardTitle>
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