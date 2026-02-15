import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    allowedHosts: ["beta.tetrago.fr"],
    hmr: {
      host: "beta.tetrago.fr",
      port: 5173,
    },
    proxy: {
      "/api": {
        target: "https://api.beta.tetrago.fr/api/", // the real API URL
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/security": {
        target: "https://api.beta.tetrago.fr/", // the real API URL
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
