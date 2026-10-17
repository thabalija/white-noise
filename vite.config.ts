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
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        navigateFallback: "index.html",
      },
      manifest: {
        name: "White noise",
        short_name: "White noise",
        description: "Ambient noise for sleep and focus",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#0c0f14",
        background_color: "#0c0f14",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
