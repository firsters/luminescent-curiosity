import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
const [major, minor] = packageJson.version.split(".");

// Format date as YYYYMMDDHHmm
const date = new Date();
const buildId = `${date.getFullYear()}${(date.getMonth() + 1)
  .toString()
  .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}${date
  .getHours()
  .toString()
  .padStart(2, "0")}${date.getMinutes().toString().padStart(2, "0")}`;

const version = `${major}.${minor}.${buildId}`;
// const buildDate = ... (redundant now but keeping variable if used elsewhere, though usually buildDate was YYMMDD)
// Let's just use the version as the main identifier.

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_DATE__: JSON.stringify(buildId), // detailed timestamp
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Fridgy - Refrigerator Management",
        short_name: "Fridgy",
        description: "Manage your fridge, freezer, and pantry items.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.jpg",
            sizes: "192x192",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "pwa-512x512.jpg",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "pwa-512x512.jpg",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
