// src/lib/chartService.ts
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

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

// Nombre de la colección en Firestore
const CHARTS_COLLECTION = 'graficos';

/**
 * Guarda un nuevo gráfico en Firestore vinculado al usuario
 */
export async function saveChart(
  userId: string,
  chartData: Omit<SavedChart, 'id' | 'userId' | 'fechaCreacion'>
): Promise<string> {
  try {
    const chartToSave = {
      ...chartData,
      userId,
      fechaCreacion: new Date().toISOString(),
      createdAt: serverTimestamp() // Para ordenar en Firestore
    };

    const docRef = await addDoc(collection(db, CHARTS_COLLECTION), chartToSave);
    console.log('[ChartService] Gráfico guardado con ID:', docRef.id);
    return docRef.id;
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
    const q = query(
      collection(db, CHARTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const charts: SavedChart[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      charts.push({
        id: doc.id,
        nombre: data.nombre,
        lines: data.lines,
        yearsFilter: data.yearsFilter,
        temporalView: data.temporalView,
        fechaCreacion: data.fechaCreacion,
        userId: data.userId
      });
    });

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
    await deleteDoc(doc(db, CHARTS_COLLECTION, chartId));
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
    const chartRef = doc(db, CHARTS_COLLECTION, chartId);
    await updateDoc(chartRef, {
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
 * Migra los gráficos existentes de localStorage a Firestore
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
    console.log(`[ChartService] Se migraron ${migratedCount} gráficos a Firestore`);

    return migratedCount;
  } catch (error) {
    console.error('[ChartService] Error al migrar gráficos:', error);
    throw new Error('No se pudieron migrar los gráficos. Por favor, intenta de nuevo.');
  }
}
