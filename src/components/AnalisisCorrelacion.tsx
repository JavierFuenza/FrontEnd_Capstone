import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

interface LineConfig {
  id: string;
  label: string;
  color: string;
  datos: any[];
  loading: boolean;
}

interface AnalisisCorrelacionProps {
  lines: LineConfig[];
}

interface Correlacion {
  line1: LineConfig;
  line2: LineConfig;
  coeficiente: number;
  interpretacion: string;
  tipo: 'positiva' | 'negativa' | 'nula';
  fuerza: string;
  scatterData: Array<{ x: number; y: number }>;
}

// Función para calcular correlación de Pearson
function calcularCorrelacion(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0 || n !== y.length) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerador = n * sumXY - sumX * sumY;
  const denominador = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominador === 0) return 0;
  return numerador / denominador;
}

// Función para interpretar la correlación
function interpretarCorrelacion(r: number): { tipo: 'positiva' | 'negativa' | 'nula'; fuerza: string; interpretacion: string } {
  const abs = Math.abs(r);

  let fuerza = '';
  if (abs >= 0.9) fuerza = 'muy fuerte';
  else if (abs >= 0.7) fuerza = 'fuerte';
  else if (abs >= 0.5) fuerza = 'moderada';
  else if (abs >= 0.3) fuerza = 'débil';
  else fuerza = 'muy débil o nula';

  const tipo = r > 0.1 ? 'positiva' : r < -0.1 ? 'negativa' : 'nula';

  let interpretacion = '';
  if (tipo === 'positiva') {
    if (abs >= 0.7) {
      interpretacion = 'Cuando una variable aumenta, la otra tiende a aumentar significativamente.';
    } else if (abs >= 0.3) {
      interpretacion = 'Existe cierta tendencia: cuando una variable aumenta, la otra también tiende a aumentar.';
    } else {
      interpretacion = 'La relación es muy débil o prácticamente inexistente.';
    }
  } else if (tipo === 'negativa') {
    if (abs >= 0.7) {
      interpretacion = 'Cuando una variable aumenta, la otra tiende a disminuir significativamente.';
    } else if (abs >= 0.3) {
      interpretacion = 'Existe cierta tendencia: cuando una variable aumenta, la otra tiende a disminuir.';
    } else {
      interpretacion = 'La relación es muy débil o prácticamente inexistente.';
    }
  } else {
    interpretacion = 'No se observa una relación lineal clara entre las variables.';
  }

  return { tipo, fuerza, interpretacion };
}

export function AnalisisCorrelacion({ lines }: AnalisisCorrelacionProps) {
  const correlaciones = useMemo(() => {
    const lineasCompletas = lines.filter(line => !line.loading && line.datos.length > 0);

    if (lineasCompletas.length < 2) return [];

    const resultados: Correlacion[] = [];

    // Calcular correlación para cada par de líneas
    for (let i = 0; i < lineasCompletas.length; i++) {
      for (let j = i + 1; j < lineasCompletas.length; j++) {
        const line1 = lineasCompletas[i];
        const line2 = lineasCompletas[j];

        // Encontrar periodos comunes
        const periodosComunes = new Set(
          line1.datos.map(d => d.periodo).filter(p =>
            line2.datos.some(d2 => d2.periodo === p)
          )
        );

        if (periodosComunes.size < 3) continue; // Necesitamos al menos 3 puntos

        // Extraer valores para periodos comunes
        const valores1: number[] = [];
        const valores2: number[] = [];
        const scatterData: Array<{ x: number; y: number }> = [];

        periodosComunes.forEach(periodo => {
          const val1 = line1.datos.find(d => d.periodo === periodo)?.valor;
          const val2 = line2.datos.find(d => d.periodo === periodo)?.valor;

          if (val1 !== undefined && val2 !== undefined && !isNaN(val1) && !isNaN(val2)) {
            valores1.push(val1);
            valores2.push(val2);
            scatterData.push({ x: val1, y: val2 });
          }
        });

        if (valores1.length < 3) continue;

        const coeficiente = calcularCorrelacion(valores1, valores2);
        const { tipo, fuerza, interpretacion } = interpretarCorrelacion(coeficiente);

        resultados.push({
          line1,
          line2,
          coeficiente,
          interpretacion,
          tipo,
          fuerza,
          scatterData
        });
      }
    }

    return resultados;
  }, [lines]);

  if (correlaciones.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <AlertCircle className="w-5 h-5" />
            Análisis de Relaciones
          </CardTitle>
          <p className="text-sm text-blue-600 mt-1">
            Correlaciones encontradas entre las métricas seleccionadas
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {correlaciones.map((corr, index) => {
            const IconComponent = corr.tipo === 'positiva' ? TrendingUp :
                                 corr.tipo === 'negativa' ? TrendingDown : Minus;

            const colorClasses =
              Math.abs(corr.coeficiente) >= 0.7 ? 'bg-red-100 border-red-300 text-red-800' :
              Math.abs(corr.coeficiente) >= 0.5 ? 'bg-orange-100 border-orange-300 text-orange-800' :
              Math.abs(corr.coeficiente) >= 0.3 ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
              'bg-gray-100 border-gray-300 text-gray-800';

            return (
              <div key={index}>
                <Card className={`border-2 ${colorClasses}`}>
                  <CardContent className="p-4">
                    {/* Header con nombres de variables */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: corr.line1.color }} />
                          <span className="text-sm font-medium">{corr.line1.label}</span>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">vs</div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: corr.line2.color }} />
                          <span className="text-sm font-medium">{corr.line2.label}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <IconComponent className="w-5 h-5" />
                          <span className="text-2xl font-bold">{corr.coeficiente.toFixed(2)}</span>
                        </div>
                        <div className="text-xs font-semibold mt-1">
                          {corr.tipo === 'positiva' ? '📈' : corr.tipo === 'negativa' ? '📉' : '➖'} {corr.fuerza}
                        </div>
                      </div>
                    </div>

                    {/* Interpretación */}
                    <div className="p-3 bg-white/80 rounded-lg border border-current/20">
                      <p className="text-sm leading-relaxed">
                        {corr.interpretacion}
                      </p>
                    </div>

                    {/* Gráfico de dispersión */}
                    {corr.scatterData.length >= 3 && (
                      <div className="mt-4 bg-white rounded-lg p-2">
                        <p className="text-xs font-semibold mb-2 text-center text-gray-700">
                          Gráfico de Dispersión
                        </p>
                        <ResponsiveContainer width="100%" height={200}>
                          <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              type="number"
                              dataKey="x"
                              name={corr.line1.label}
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis
                              type="number"
                              dataKey="y"
                              name={corr.line2.label}
                              tick={{ fontSize: 10 }}
                            />
                            <ZAxis range={[60, 60]} />
                            <Tooltip
                              cursor={{ strokeDasharray: '3 3' }}
                              formatter={(value: any) => value.toFixed(2)}
                            />
                            <Scatter
                              data={corr.scatterData}
                              fill={corr.line1.color}
                              fillOpacity={0.6}
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Información adicional */}
                    <div className="mt-3 pt-3 border-t border-current/20">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          {corr.scatterData.length} puntos analizados
                        </span>
                        <span className="font-semibold">
                          Coeficiente de Pearson: r = {corr.coeficiente.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {/* Nota explicativa */}
          <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
            <p className="text-xs text-blue-800 leading-relaxed">
              <strong>💡 Nota:</strong> El coeficiente de correlación varía entre -1 y 1.
              Valores cercanos a 1 indican correlación positiva fuerte, cercanos a -1 indican
              correlación negativa fuerte, y cercanos a 0 indican poca o ninguna correlación lineal.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
