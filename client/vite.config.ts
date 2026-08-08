import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const sharedDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../shared",
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      shared: sharedDir,
    },
  },
  optimizeDeps: {
    exclude: ["shared"],
  },
});
