import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

const baseURL = "beta.tetrago.fr";
const apiURL = "api.beta.tetrago.fr";
const protocolURL = "https"

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: "/",
  server: {
    allowedHosts: [baseURL, "localhost", "192.168.1.49"],
    hmr: {
      host: baseURL,
      port: 5173,
    },
    proxy: {
      "/api": {
        target: `${protocolURL}://${apiURL}/api/`, // the real API URL
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/security": {
        target: `${protocolURL}://${apiURL}/`, // the real API URL
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
