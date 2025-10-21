import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/ZonaRebote/' : '/', // 👈 cambia según entorno
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
    open: true,
  },
}))
