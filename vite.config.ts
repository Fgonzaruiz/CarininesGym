import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages sirve el repo en /CarininesGym/ (subpath). HashRouter evita problemas de rutas.
export default defineConfig({
  base: "/CarininesGym/",
  plugins: [react(), tailwindcss()],
});
