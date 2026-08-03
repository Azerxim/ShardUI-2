import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
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
    chunkSizeWarningLimit: 3000,
  },
});
