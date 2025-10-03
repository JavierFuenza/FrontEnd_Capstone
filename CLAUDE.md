# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos Esenciales

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo en localhost:4321

# Construcción y despliegue
npm run build           # Compila el sitio para producción en ./dist/
npm run preview         # Previsualiza la compilación de producción

# Utilidades Astro
npm run astro ...       # Ejecuta comandos CLI de Astro
```

## Arquitectura del Proyecto

### Stack Tecnológico

- **Framework**: Astro 4.x con integración de React 18
- **Estilos**: TailwindCSS con configuración de shadcn/ui (estilo "new-york")
- **Componentes UI**: shadcn/ui con Radix UI primitives
- **Visualización de Datos**:
  - Leaflet + React-Leaflet para mapas interactivos
  - Recharts para gráficos y visualizaciones
- **Iconos**: Lucide React
- **TypeScript**: Configuración estricta de Astro

### Patrón de Arquitectura

Este proyecto utiliza el **patrón Islands Architecture** de Astro, donde:

1. **Páginas Astro** (`src/pages/*.astro`) son el punto de entrada:
   - Renderizan HTML estático por defecto
   - Utilizan el layout compartido `src/layouts/Layout.astro`
   - Incluyen componentes React con directivas de hidratación

2. **Componentes React** (`src/components/*.tsx`) son "islas" interactivas:
   - Se hidratan selectivamente en el cliente usando directivas como `client:load`, `client:visible`
   - Contienen la lógica de estado y efectos del lado del cliente
   - Ejemplo: `<HomePageContent client:load />` se hidrata inmediatamente

3. **Componentes UI** (`src/components/ui/*.tsx`):
   - Biblioteca de componentes reutilizables de shadcn/ui
   - Pre-estilizados con Tailwind y variables CSS

### Alias de Importación

El proyecto utiliza alias `@/` para importaciones:
```typescript
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

Configurado en:
- `tsconfig.json`: `"@/*": ["src/*"]`
- `astro.config.mjs`: Vite alias
- `components.json`: shadcn/ui aliases

### Estructura de Datos Clave

**Mapa Interactivo** (`src/components/Map.tsx`):
- Centro por defecto: `[-39.8142, -73.2459]` (Chile central)
- Marcadores de ciudades: Santiago, Valparaíso, Concepción
- Usa OSM tiles para el mapa base
- Incluye `MapUpdater` para invalidar tamaño al montar

**Gráficos** (`src/components/GraficosPageContent.tsx`):
- Datos simulados con estructura `{ date, Santiago, Valparaíso, ... }`
- Comparación multi-ciudad con selección por checkbox
- Variables: Temperatura, PM2.5, Humedad

### Layout Global

`src/layouts/Layout.astro` proporciona:
- NavBar persistente con `client:load`
- Footer estático
- ScrollToTopButton con `client:visible`
- Integración de Leaflet CSS
- Estilos globales de `src/styles/global.css`

### Directivas de Hidratación

- `client:load` - Hidrata inmediatamente al cargar la página (NavBar, contenido principal)
- `client:visible` - Hidrata cuando el componente es visible (ScrollToTopButton)
- Sin directiva - Solo renderiza en el servidor (Footer)

### Consideraciones Especiales

1. **Leaflet**: Requiere chequeo `typeof window === 'undefined'` para SSR
2. **Iconos de Leaflet**: Se configuran manualmente con `L.icon()` y `L.Marker.prototype.options.icon`
3. **Conflictos Git**: El README.md tiene conflictos de merge sin resolver entre documentación de proyecto y template de Astro
4. **shadcn/ui**: Usa `cn()` utility de `src/lib/utils.ts` para merge de clases Tailwind
