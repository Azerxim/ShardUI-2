import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
  plugins: [tailwindcss(), react()],
  base: "/",
  server: {
    allowedHosts: [
      "localhost",
      "192.168.5.100",
      "tetrago.fr",
      "beta.tetrago.fr",
      "dev.tetrago.fr",
    ],
    // Serveur de dev : /api est relayé vers Shard-API. Avec VITE_API_BASE_URL vide, le navigateur
    // n'appelle que l'origine de Vite (utile en VS Code Remote SSH : seul le port de Vite est redirigé).
    proxy: {
      "/api": {
        target: env.API_PROXY_TARGET || "http://127.0.0.1:8002",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            ["react", "react-dom", "react-router-dom"].some((pkg) =>
              id.includes(`node_modules/${pkg}/`),
            )
          ) {
            return "react-vendor";
          }
          if (id.includes("node_modules/daisyui")) {
            return "ui-vendor";
          }
          if (id.includes("node_modules/@fortawesome")) {
            return "vendor-fontawesome";
          }
          if (
            ["sweetalert2", "react-modal"].some((pkg) =>
              id.includes(`node_modules/${pkg}/`),
            )
          ) {
            return "vendor-misc";
          }
        },
      },
    },
  },
  };
});
