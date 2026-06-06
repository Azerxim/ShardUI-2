import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

const baseURL = "beta.tetrago.fr";
const protocolURL = "https"

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: "/",
  server: {
    allowedHosts: [baseURL, "localhost", "192.168.5.100"],
    hmr: {
      host: baseURL,
      port: 5173,
    },
    proxy: {
      "/api": {
        target: `${protocolURL}://${baseURL}/api/`, // the real API URL
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      }
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
