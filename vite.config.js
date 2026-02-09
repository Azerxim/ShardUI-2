import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    allowedHosts: ["amethyst.spinelle.eu"],
    hmr: {
      host: "amethyst.spinelle.eu",
      port: 5173,
    },
    proxy: {
      "/api": {
        target: "https://api.amethyst.spinelle.eu/api/", // the real API URL
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/security": {
        target: "https://api.amethyst.spinelle.eu/", // the real API URL
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/security/, ""),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "ui-vendor": [
            "@fortawesome/react-fontawesome",
            "@fortawesome/fontawesome-svg-core",
            "daisyui",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 3000,
  },
});
