import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [vue()],
  resolve: {
    alias: {
      "@capra-ui/core": path.resolve(__dirname, "../src/index.ts"),
      "@": path.resolve(__dirname, "../src"),
    },
  },
  server: {
    port: 5174,
    open: false,
    fs: {
      // Allow vite to serve files from the parent directory (the framework src/)
      allow: [path.resolve(__dirname, "..")],
    },
  },
  optimizeDeps: {
    // Force pre-bundling of deps that are imported by files outside playground/
    // (vite's auto-scan misses imports in ../src/ when the project root is playground/)
    include: [
      "vue",
      "echarts",
      "echarts/core",
      "echarts/renderers",
      "echarts/charts",
      "echarts/components",
      "echarts/features",
      "vue-echarts",
      "lucide-vue-next",
    ],
  },
});
