import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist", sourcemap: true },
  // Used only by `npm run preview`; Vercel serves the built `dist` directory directly.
  preview: { allowedHosts: true },
});
