import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // React cambia poco: en su propio archivo el navegador lo reutiliza entre despliegues
          manualChunks(id: string) {
            if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
              return 'vendor-react';
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: true,
      cors: true,
      allowedHosts: true as const,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
      // HMR se puede desactivar con la variable de entorno DISABLE_HMR=true.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
