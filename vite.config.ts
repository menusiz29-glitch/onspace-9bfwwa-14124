import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages uchun base URL (repository nomi)
  // Agar custom domain ishlatilsa, base: '/' qoldiring
  base: './',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Katta chunklar uchun ogohlantirish o'chirish
    chunkSizeWarningLimit: 1000,
  },
});
