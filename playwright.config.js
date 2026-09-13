import { defineConfig, devices } from "@playwright/test";

// Tests d'utilisabilité « nouvel utilisateur » : npm run test:ux
// Playwright démarre une Shard-API sur une copie jetable de ShardDB.db (tests/ux/start-test-api.mjs)
// et un serveur Vite relié à cette API, sur des ports dédiés (la vraie base n'est jamais modifiée).
const API_PORT = 8011;
const UI_PORT = 5183;

export default defineConfig({
  testDir: "./tests/ux",
  outputDir: "./tests/ux/.results",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://127.0.0.1:${UI_PORT}`,
    locale: "fr-FR",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node tests/ux/start-test-api.mjs",
      url: `http://127.0.0.1:${API_PORT}/api/religions/list`,
      env: { SHARD_TEST_API_PORT: String(API_PORT) },
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      command: `npx vite --mode development --host 127.0.0.1 --port ${UI_PORT} --strictPort`,
      url: `http://127.0.0.1:${UI_PORT}`,
      env: { API_PROXY_TARGET: `http://127.0.0.1:${API_PORT}` },
      // Vite relaie la console du navigateur : les appels externes bloqués par les tests y ajouteraient du bruit
      stderr: "ignore",
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
});
