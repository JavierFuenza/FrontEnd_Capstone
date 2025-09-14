import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind'; // <-- La única integración de Tailwind que necesitas
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  integrations: [
    react(), 
    tailwind() // <-- Registra la integración aquí
  ],
  vite: {
    resolve: {
      alias: {
        // Esto define el atajo '@/' para tu carpeta 'src'
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
    // El plugin de vite ya no es necesario aquí
  }
});