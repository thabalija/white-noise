import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      devOptions: {
        enabled: false,
      },
      workbox: {
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,jpg,woff2,webmanifest,mp3}",
        ],
        maximumFileSizeToCacheInBytes: 32 * 1024 * 1024,
        navigateFallback: "index.html",
      },
      manifest: false,
    }),
  ],
});
