import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Base relativa para que funcione en GitHub Pages sea cual sea el nombre del repo,
// ya usamos HashRouter asi que las rutas no dependen del path.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});
