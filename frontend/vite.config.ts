import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    allowedHosts: [
      'invoicesoftwareforage.up.railway.app',
      'localhost',
      '.railway.app', // Allow all Railway domains
    ],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: ['canvg'], // Mark canvg as external - loaded at runtime by jsPDF
      output: {
        globals: {
          canvg: 'canvg',
        },
      },
    },
  },
}));
