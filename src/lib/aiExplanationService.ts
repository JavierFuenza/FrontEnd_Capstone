/**
 * AI Explanation Service
 * Handles communication with n8n webhook for AI-powered chart explanations
 */

export interface ChartExplanationRequest {
  // Chart configuration metadata
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

  // Actual data points displayed in the chart
  dataPoints: Array<{
    [key: string]: any; // e.g., { date: "2023-01", Santiago: 45, Valparaiso: 38 }
  }>;

  // User context
  userContext?: {
    userId?: string;
    selectedRegions?: string[];
    dateRange?: {
      start?: string;
      end?: string;
    };
    chartType?: string;
  };
}

export interface ChartExplanationResponse {
  explanation: string;
  insights?: string[];
  error?: string;
}

class AIExplanationService {
  private webhookUrl: string;

  constructor() {
    // Get webhook URL from environment variable
    this.webhookUrl = import.meta.env.PUBLIC_N8N_WEBHOOK_URL || '';

    if (!this.webhookUrl) {
      console.warn('PUBLIC_N8N_WEBHOOK_URL not configured in environment variables');
    }
  }

  /**
   * Request an AI explanation for a chart
   */
  async explainChart(request: ChartExplanationRequest): Promise<ChartExplanationResponse> {
    if (!this.webhookUrl) {
      return {
        explanation: 'El servicio de explicación con IA no está configurado. Por favor, agrega PUBLIC_N8N_WEBHOOK_URL a tu archivo .env',
        error: 'WEBHOOK_NOT_CONFIGURED'
      };
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();

      // If n8n returns an array, get the first item
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }

      // Unwrap if n8n Output Parser wrapped it in "output" object
      if (data.output && typeof data.output === 'object') {
        data = data.output;
      }

      // Map response keys (explicacion + insights)
      const result = {
        explanation: data.explicacion || data.explanation || data.message || 'No se proporcionó explicación',
        insights: data.insights || [],
      };

      return result;

    } catch (error) {
      console.error('Error calling AI explanation service:', error);

      return {
        explanation: 'Error al obtener la explicación. Por favor, intenta nuevamente.',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Format chart data summary for better AI understanding
   */
  getDataSummary(data: any[]): {
    totalPoints: number;
    dateRange: { start: string; end: string } | null;
    metrics: string[];
  } {
    if (!data || data.length === 0) {
      return {
        totalPoints: 0,
        dateRange: null,
        metrics: []
      };
    }

    const metrics = Object.keys(data[0] || {}).filter(
      key => key !== 'date' && key !== 'name' && key !== 'mes' && key !== 'año'
    );

    return {
      totalPoints: data.length,
      dateRange: {
        start: data[0]?.date || data[0]?.name || data[0]?.mes || 'N/A',
        end: data[data.length - 1]?.date || data[data.length - 1]?.name || data[data.length - 1]?.mes || 'N/A'
      },
      metrics
    };
  }
}

// Export singleton instance
export const aiExplanationService = new AIExplanationService();
