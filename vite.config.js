import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: "/",
  server: {
    allowedHosts: ["localhost", "192.168.5.100", "tetrago.fr", "beta.tetrago.fr", "dev.tetrago.fr"],
  },
  build: {
    outDir: "dist", 
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "daisyui",
          ],
          "vendor-fontawesome": [
            "@fortawesome/fontawesome-svg-core",
            "@fortawesome/free-solid-svg-icons",
            "@fortawesome/free-regular-svg-icons",
            "@fortawesome/free-brands-svg-icons",
            "@fortawesome/react-fontawesome",
          ],
          "vendor-misc": ["sweetalert2", "react-modal"],
        },
      },
    },
    chunkSizeWarningLimit: 3000,
  },
});
