import { defineConfig, devices } from "@playwright/test";

// Tests d'utilisabilité « nouvel utilisateur » : npm run test:ux
// Playwright démarre une Shard-API sur une copie jetable de ShardDB.db (tests/ux/start-test-api.mjs)
// et un serveur Vite relié à cette API, sur des ports dédiés (la vraie base n'est jamais modifiée).
const API_PORT = 8011;
const UI_PORT = 5183;
const FAKE_DISCORD_PORT = 8013;
const FAKE_MAPS_PORT = 8014;

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
      // Faux Discord (échange du code OAuth), voir tests/ux/fake-discord.mjs
      command: "node tests/ux/fake-discord.mjs",
      url: `http://127.0.0.1:${FAKE_DISCORD_PORT}/health`,
      env: { FAKE_DISCORD_PORT: String(FAKE_DISCORD_PORT) },
      timeout: 30_000,
      reuseExistingServer: false,
    },
    {
      command: "node tests/ux/start-test-api.mjs",
      url: `http://127.0.0.1:${API_PORT}/api/religions/list`,
      env: {
        SHARD_TEST_API_PORT: String(API_PORT),
        DISCORD_OAUTH_CLIENT_ID: "client-de-test",
        DISCORD_OAUTH_CLIENT_SECRET: "secret-de-test",
        DISCORD_OAUTH_REDIRECT_URI: `http://127.0.0.1:${UI_PORT}/auth/discord/callback`,
        DISCORD_API_BASE_URL: `http://127.0.0.1:${FAKE_DISCORD_PORT}`,
        // Chaîne Microsoft → Xbox Live → Minecraft simulée par le même faux serveur
        MICROSOFT_OAUTH_CLIENT_ID: "azure-de-test",
        MICROSOFT_OAUTH_CLIENT_SECRET: "secret-azure-de-test",
        MICROSOFT_OAUTH_REDIRECT_URI: `http://127.0.0.1:${UI_PORT}/auth/microsoft/callback`,
        MICROSOFT_API_BASE_URL: `http://127.0.0.1:${FAKE_DISCORD_PORT}`,
        // Messages des journaux lus dans ce fichier (dossier tests/ux/.env-api) au lieu du vrai Discord
        SHARD_FAKE_JOURNAL_MESSAGES: "fake-journal-messages.json",
        // Annonces Discord (guerres…) écrites dans ce fichier au lieu d'être envoyées
        SHARD_FAKE_DISCORD_ANNOUNCEMENTS: "fake-discord-announcements.jsonl",
      },
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      // Fausse carte pour la connexion de l'éditeur, voir tests/ux/fake-maps.mjs
      command: "node tests/ux/fake-maps.mjs",
      url: `http://127.0.0.1:${FAKE_MAPS_PORT}/health`,
      env: {
        FAKE_MAPS_PORT: String(FAKE_MAPS_PORT),
        SHARD_API_BASE_URL: `http://127.0.0.1:${API_PORT}/api`,
        UI_BASE_URL: `http://127.0.0.1:${UI_PORT}`,
      },
      timeout: 30_000,
      reuseExistingServer: false,
    },
    {
      command: `npx vite --mode development --host 127.0.0.1 --port ${UI_PORT} --strictPort`,
      url: `http://127.0.0.1:${UI_PORT}`,
      env: { API_PROXY_TARGET: `http://127.0.0.1:${API_PORT}`, VITE_MAPS_BASE_URL: `http://127.0.0.1:${FAKE_MAPS_PORT}` },
      // Vite relaie la console du navigateur : les appels externes bloqués par les tests y ajouteraient du bruit
      stderr: "ignore",
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
});
