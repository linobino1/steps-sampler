import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  return {
    build: {
      outDir: "build",
    },
    plugins: [
      react(),
      legacy(),
    ],
    server: {
      allowedHosts: ["localhost", "steps.leohilsheimer.com"],
    },
  };
});
