// src/lib/chartService.ts
import {
  ref,
  push,
  set,
  get,
  remove,
  update,
  serverTimestamp
} from 'firebase/database';
import { database } from './firebase';

// Tipos
export interface LineConfig {
  id: string;
  region: string;
  estacion: string;
  metrica: string;
  submetrica: string;
  label: string;
  color: string;
  datos: any[];
  loading: boolean;
}

export interface SavedChart {
  id?: string; // ID de Firestore (opcional al crear)
  nombre: string;
  lines: LineConfig[];
  yearsFilter: number | null;
  temporalView: 'mensual' | 'anual';
  fechaCreacion: string;
  userId: string; // ID del usuario que creó el gráfico
}

// Path base en Realtime Database
const CHARTS_PATH = 'graficos';

/**
 * Guarda un nuevo gráfico en Realtime Database vinculado al usuario
 */
export async function saveChart(
  userId: string,
  chartData: Omit<SavedChart, 'id' | 'userId' | 'fechaCreacion'>
): Promise<string> {
  try {
    const chartsRef = ref(database, CHARTS_PATH);
    const newChartRef = push(chartsRef);

    const chartToSave = {
      ...chartData,
      userId,
      fechaCreacion: new Date().toISOString(),
      createdAt: serverTimestamp() // Para ordenar
    };

    await set(newChartRef, chartToSave);
    console.log('[ChartService] Gráfico guardado con ID:', newChartRef.key);
    return newChartRef.key!;
  } catch (error) {
    console.error('[ChartService] Error al guardar gráfico:', error);
    throw new Error('No se pudo guardar el gráfico. Por favor, intenta de nuevo.');
  }
}

/**
 * Obtiene todos los gráficos de un usuario específico
 */
export async function getUserCharts(userId: string): Promise<SavedChart[]> {
  try {
    const chartsRef = ref(database, CHARTS_PATH);
    const snapshot = await get(chartsRef);

    const charts: SavedChart[] = [];

    if (snapshot.exists()) {
      const allCharts = snapshot.val();

      // Filtrar por userId y ordenar por fecha de creación
      Object.entries(allCharts).forEach(([id, data]: [string, any]) => {
        if (data.userId === userId) {
          charts.push({
            id,
            nombre: data.nombre,
            lines: data.lines,
            yearsFilter: data.yearsFilter,
            temporalView: data.temporalView,
            fechaCreacion: data.fechaCreacion,
            userId: data.userId
          });
        }
      });

      // Ordenar por fecha de creación (más reciente primero)
      charts.sort((a, b) =>
        new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      );
    }

    console.log(`[ChartService] Se encontraron ${charts.length} gráficos para el usuario`);
    return charts;
  } catch (error) {
    console.error('[ChartService] Error al obtener gráficos:', error);
    throw new Error('No se pudieron cargar los gráficos. Por favor, intenta de nuevo.');
  }
}

/**
 * Elimina un gráfico por su ID
 */
export async function deleteChart(chartId: string): Promise<void> {
  try {
    const chartRef = ref(database, `${CHARTS_PATH}/${chartId}`);
    await remove(chartRef);
    console.log('[ChartService] Gráfico eliminado:', chartId);
  } catch (error) {
    console.error('[ChartService] Error al eliminar gráfico:', error);
    throw new Error('No se pudo eliminar el gráfico. Por favor, intenta de nuevo.');
  }
}

/**
 * Actualiza un gráfico existente
 */
export async function updateChart(
  chartId: string,
  updates: Partial<Omit<SavedChart, 'id' | 'userId'>>
): Promise<void> {
  try {
    const chartRef = ref(database, `${CHARTS_PATH}/${chartId}`);
    await update(chartRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('[ChartService] Gráfico actualizado:', chartId);
  } catch (error) {
    console.error('[ChartService] Error al actualizar gráfico:', error);
    throw new Error('No se pudo actualizar el gráfico. Por favor, intenta de nuevo.');
  }
}

/**
 * Migra los gráficos existentes de localStorage a Realtime Database
 */
export async function migrateLocalStorageCharts(userId: string): Promise<number> {
  try {
    const localCharts = localStorage.getItem('graficos_savedCharts');
    if (!localCharts) {
      return 0;
    }

    const charts: SavedChart[] = JSON.parse(localCharts);
    let migratedCount = 0;

    for (const chart of charts) {
      await saveChart(userId, {
        nombre: chart.nombre,
        lines: chart.lines,
        yearsFilter: chart.yearsFilter,
        temporalView: chart.temporalView
      });
      migratedCount++;
    }

    // Limpiar localStorage después de migrar
    localStorage.removeItem('graficos_savedCharts');
    console.log(`[ChartService] Se migraron ${migratedCount} gráficos a Realtime Database`);

    return migratedCount;
  } catch (error) {
    console.error('[ChartService] Error al migrar gráficos:', error);
    throw new Error('No se pudieron migrar los gráficos. Por favor, intenta de nuevo.');
  }
}
