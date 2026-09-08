import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist", sourcemap: true },
  preview: { allowedHosts: ["4173-idq40c1kggidfsags9kji-406111b9.sg2.manus.computer"] },
});
