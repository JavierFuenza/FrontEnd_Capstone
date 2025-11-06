import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  aiExplanationService,
  type ChartExplanationRequest,
  type ChartExplanationResponse
} from '@/lib/aiExplanationService';

interface AIExplainButtonProps {
  chartData: any[];
  chartConfig: {
    nombre?: string;
    metrica?: string;
    submetrica?: string;
    temporalView?: 'mensual' | 'anual';
    yearsFilter?: number | null;
    lines?: Array<{
      region?: string;
      estacion?: string;
      metrica?: string;
      submetrica?: string;
      color?: string;
    }>;
  };
  userContext?: {
    userId?: string;
    selectedRegions?: string[];
    dateRange?: {
      start?: string;
      end?: string;
    };
    chartType?: string;
  };
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

export function AIExplainButton({
  chartData,
  chartConfig,
  userContext,
  position = 'top-right',
  className = ''
}: AIExplainButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<ChartExplanationResponse | null>(null);

  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
  };

  const handleExplain = async () => {
    if (explanation && !loading) {
      // If already have explanation, just toggle the popover
      return;
    }

    setLoading(true);
    setOpen(true);

    try {
      const request: ChartExplanationRequest = {
        chartConfig,
        dataPoints: chartData,
        userContext,
      };

      const response = await aiExplanationService.explainChart(request);
      setExplanation(response);
    } catch (error) {
      console.error('Error getting AI explanation:', error);
      setExplanation({
        explanation: 'Error al obtener la explicación. Por favor, intenta nuevamente.',
        error: 'FETCH_ERROR'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setExplanation(null);
    handleExplain();
  };

  return (
    <div className={`absolute ${positionClasses[position]} ${className} z-10`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-md"
            onClick={handleExplain}
            title="Explicar con IA"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            ) : (
              <Sparkles className="h-4 w-4 text-blue-600" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 max-h-[500px] overflow-y-auto" align="end">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-base">Explicación con IA</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                  <p className="text-sm text-gray-600">Analizando el gráfico...</p>
                </div>
              </div>
            )}

            {!loading && explanation && (
              <div className="space-y-4">
                {explanation.error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-800">{explanation.explanation}</p>
                      {explanation.error !== 'WEBHOOK_NOT_CONFIGURED' && (
                        <button
                          onClick={handleRetry}
                          className="text-sm text-red-600 hover:text-red-800 font-medium mt-2 underline"
                        >
                          Reintentar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {!explanation.error && (
                  <>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {explanation.explanation}
                      </p>
                    </div>

                    {explanation.insights && explanation.insights.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900">💡 Insights:</h4>
                        <ul className="space-y-1.5 text-sm text-gray-700">
                          {explanation.insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-600 mt-0.5">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {explanation.recommendations && explanation.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900">📋 Recomendaciones:</h4>
                        <ul className="space-y-1.5 text-sm text-gray-700">
                          {explanation.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-green-600 mt-0.5">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {!loading && !explanation && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">
                  Haz clic en el botón para obtener una explicación con IA
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
