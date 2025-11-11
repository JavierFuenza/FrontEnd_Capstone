// src/lib/colorPalette.ts

/**
 * Paleta de colores accesible para personas con daltonismo
 *
 * Esta paleta está basada en las mejores prácticas de accesibilidad:
 * - Colores distinguibles para deuteranopia (dificultad rojo-verde más común)
 * - Colores distinguibles para protanopia (dificultad rojo-verde)
 * - Colores distinguibles para tritanopia (dificultad azul-amarillo)
 * - Alto contraste
 * - Basada en la paleta de Paul Tol y IBM Design
 */

// Paleta principal - 12 colores distinguibles para daltónicos
export const COLOR_PALETTE = [
  '#0173B2', // Azul vibrante
  '#DE8F05', // Naranja
  '#029E73', // Verde azulado (teal)
  '#CC78BC', // Rosa/Magenta
  '#CA9161', // Marrón claro
  '#FBAFE4', // Rosa claro
  '#949494', // Gris
  '#ECE133', // Amarillo
  '#56B4E9', // Azul cielo
  '#000000', // Negro
  '#882255', // Vino/Púrpura oscuro
  '#44AA99', // Verde agua
];

// Paleta extendida para casos con más de 12 líneas
export const EXTENDED_COLOR_PALETTE = [
  ...COLOR_PALETTE,
  '#88CCEE', // Cian claro
  '#DDCC77', // Amarillo arena
  '#117733', // Verde bosque
  '#AA4499', // Magenta oscuro
  '#6699CC', // Azul pálido
  '#999933', // Oliva
  '#661100', // Marrón oscuro
  '#332288', // Índigo
];

/**
 * Obtiene un color de la paleta basado en el índice
 * Si el índice excede la paleta, se repite cíclicamente
 */
export function getChartColor(index: number): string {
  return EXTENDED_COLOR_PALETTE[index % EXTENDED_COLOR_PALETTE.length];
}

/**
 * Genera un color único basado en región y métrica
 * Esto asegura que la misma métrica de diferentes regiones tenga colores distintos
 */
export function getColorForRegionMetric(regionIndex: number, metricIndex: number): string {
  // Combinar los índices para crear un índice único
  const combinedIndex = (regionIndex * 7 + metricIndex * 3) % EXTENDED_COLOR_PALETTE.length;
  return EXTENDED_COLOR_PALETTE[combinedIndex];
}

/**
 * Obtiene colores para un conjunto de líneas asegurando máxima distinción
 * @param count Número de líneas que necesitan colores
 * @returns Array de colores
 */
export function getDistinctColors(count: number): string[] {
  if (count <= EXTENDED_COLOR_PALETTE.length) {
    return EXTENDED_COLOR_PALETTE.slice(0, count);
  }

  // Si necesitamos más colores que los disponibles, repetimos la paleta
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(EXTENDED_COLOR_PALETTE[i % EXTENDED_COLOR_PALETTE.length]);
  }
  return colors;
}

/**
 * Genera colores para gráficos agrupados por región
 * Asegura que regiones diferentes tengan tonalidades claramente distintas
 */
export function getColorsByRegion(regions: string[]): Map<string, string[]> {
  const colorMap = new Map<string, string[]>();

  regions.forEach((region, index) => {
    // Asignar un color base por región
    const baseColorIndex = index % COLOR_PALETTE.length;
    colorMap.set(region, [COLOR_PALETTE[baseColorIndex]]);
  });

  return colorMap;
}

// Colores específicos para tipos de datos comunes
export const DATA_TYPE_COLORS = {
  temperature: '#DE8F05', // Naranja (asociado con calor)
  humidity: '#0173B2',    // Azul (asociado con agua)
  pressure: '#949494',    // Gris
  wind: '#56B4E9',        // Azul cielo
  pollution: '#882255',   // Púrpura oscuro
  precipitation: '#029E73', // Verde azulado
};

export default {
  COLOR_PALETTE,
  EXTENDED_COLOR_PALETTE,
  getChartColor,
  getColorForRegionMetric,
  getDistinctColors,
  getColorsByRegion,
  DATA_TYPE_COLORS,
};
