// src/components/GraficosPageContent.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

// Mock data que usaremos para construir la interfaz
const mockCities = ["Santiago", "Valparaíso", "Concepción", "Antofagasta"];
const mockVariables = ["Temperatura (°C)", "PM2.5 (μg/m³)", "Humedad (%)"];
const mockData = [
  { date: '2025-01', Santiago: 28, Valparaíso: 22, Concepción: 18, Antofagasta: 25 },
  { date: '2025-02', Santiago: 31, Valparaíso: 24, Concepción: 20, Antofagasta: 26 },
  { date: '2025-03', Santiago: 27, Valparaíso: 21, Concepción: 19, Antofagasta: 24 },
  { date: '2025-04', Santiago: 22, Valparaíso: 18, Concepción: 16, Antofagasta: 22 },
];
const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

export function GraficosPageContent() {
  const [selectedCities, setSelectedCities] = useState<string[]>(["Santiago"]);
  const [selectedVariable, setSelectedVariable] = useState<string>(mockVariables[0]);

  const handleCityChange = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  return (
    <div className="pt-32 pb-16 max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Gráficos Personalizados</h1>
        <p className="text-lg text-gray-600">
          Compara variables ambientales entre diferentes ciudades y rangos de fechas.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Panel de Filtros */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader><CardTitle>Panel de Control</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="font-semibold text-sm mb-2 block">Variable Ambiental</label>
                <Select value={selectedVariable} onValueChange={setSelectedVariable}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {mockVariables.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-semibold text-sm mb-3 block">Ciudades a Comparar</label>
                <div className="space-y-3">
                  {mockCities.map(city => (
                    <div key={city} className="flex items-center space-x-2">
                      <Checkbox
                        id={city}
                        checked={selectedCities.includes(city)}
                        onCheckedChange={() => handleCityChange(city)}
                      />
                      <label htmlFor={city} className="text-sm font-medium leading-none cursor-pointer">
                        {city}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-sm mb-2 block">Rango de Fechas</label>
                <Select defaultValue="ultimos-3-meses">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ultimo-mes">Último mes</SelectItem>
                    <SelectItem value="ultimos-3-meses">Últimos 3 meses</SelectItem>
                    <SelectItem value="ultimo-ano">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                <BarChart3 className="w-4 h-4 mr-2" />
                Generar Gráfico
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Área del Gráfico */}
        <div className="lg:col-span-9">
          <Card className="h-full">
            <CardHeader><CardTitle>Visualización Comparativa</CardTitle></CardHeader>
            <CardContent className="h-[500px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedCities.map((city, index) => (
                    <Line
                      key={city}
                      type="monotone"
                      dataKey={city}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}