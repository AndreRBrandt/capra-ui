import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "CapraUICore",
      fileName: "capra-ui-core",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["vue", "echarts", "vue-echarts", "lucide-vue-next"],
      output: {
        globals: {
          vue: "Vue",
          echarts: "echarts",
        },
      },
    },
  },
});
