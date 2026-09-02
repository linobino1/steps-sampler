import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => {
  return {
    build: {
      outDir: "build",
    },
    plugins: [
      react(),
      // support old browsers
      legacy(),
      // make it a PWA
      VitePWA({
        registerType: "autoUpdate",
        manifestFilename: "site.webmanifest",
        includeAssets: [
          "sounds/*.{mp3,wav}",
          "fonts/*.{woff,woff2}",
          "img/*.{png,svg}",
        ],
        manifest: {
          id: "/",
          name: "Steps Sampler",
          short_name: "Steps Sampler",
          description: "Create beats with a simple step sequencer and sampler.",
          start_url: "/",
          scope: "/",
          display: "standalone",
          theme_color: "#fefcf3",
          background_color: "#fefcf3",
          icons: [
            {
              src: "/android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
    ],
    server: {
      allowedHosts: ["localhost", "steps.leohilsheimer.com"],
    },
  };
});
