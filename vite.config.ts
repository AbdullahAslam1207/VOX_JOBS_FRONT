import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/backend': {
        target: 'https://hmmpwkwg-8000.asse.devtunnels.ms',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/backend/, ''),
      },
      '/vectors': {
        target: 'https://52079c78a4be.ngrok-free.app',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/vectors/, ''),
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
