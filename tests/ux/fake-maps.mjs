// Fausse carte (ShardUI-2-Maps) pour tester la connexion de l'éditeur ouvert depuis le site : une page d'éditeur
// minimale, servie sur une autre origine, qui charge le vrai assets/scripts/shard-api.js.
// POST /__config { uiBaseUrl, uiAllowedOrigins } change les origines autorisées (env.js).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mapsDir = path.resolve(process.env.SHARD_MAPS_DIR ?? path.join(here, "../../../ShardUI-2-Maps"));
const port = Number(process.env.FAKE_MAPS_PORT ?? 8014);
const config = {
  apiBaseUrl: process.env.SHARD_API_BASE_URL ?? "http://127.0.0.1:8011/api",
  uiBaseUrl: process.env.UI_BASE_URL ?? "http://127.0.0.1:5183",
  uiAllowedOrigins: "",
};

const EDITOR_PAGE = `<!doctype html>
<html lang="fr">
  <body>
    <p id="status">Chargement…</p>
    <p id="user"></p>
    <button id="again" type="button">Requête authentifiée</button>
    <button id="reconnect" type="button">Redemander la session</button>
    <script src="/assets/scripts/env.js"></script>
    <script src="/assets/scripts/shard-api.js"></script>
    <script>
      const status = document.getElementById("status");
      const user = document.getElementById("user");
      async function connect(options) {
        const token = await shardApiToken(options);
        status.textContent = token ? "connecté" : "non connecté : " + (shardApiAuthError() || "");
      }
      async function whoami() {
        user.textContent = "";
        try {
          user.textContent = (await shardApiRequest("GET", "/users/verify")).user.username;
        } catch (error) {
          user.textContent = "erreur : " + error.message;
        }
      }
      document.getElementById("again").addEventListener("click", whoami);
      document.getElementById("reconnect").addEventListener("click", () => connect({ refresh: true }).then(whoami));
      connect().then(whoami);
    </script>
  </body>
</html>`;

const send = (response, status, type, body) => {
  response.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  response.end(body);
};

http.createServer((request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);

  if (url.pathname === "/health") return send(response, 200, "application/json", '{"ok":true}');

  if (request.method === "POST" && url.pathname === "/__config") {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      Object.assign(config, JSON.parse(body || "{}"));
      send(response, 200, "application/json", JSON.stringify(config));
    });
    return;
  }

  if (url.pathname === "/assets/scripts/env.js") {
    const env = [
      `window.SHARD_API_BASE_URL = ${JSON.stringify(config.apiBaseUrl)};`,
      `window.UI_BASE_URL = ${JSON.stringify(config.uiBaseUrl)};`,
      `window.UI_ALLOWED_ORIGINS = ${JSON.stringify(config.uiAllowedOrigins)};`,
    ].join("\n");
    return send(response, 200, "text/javascript", env);
  }

  if (url.pathname === "/assets/scripts/shard-api.js") {
    return send(response, 200, "text/javascript", fs.readFileSync(path.join(mapsDir, "assets/scripts/shard-api.js")));
  }

  // {dimension}-editor-civilisations?type=ID
  if (/-editor-/.test(url.pathname)) return send(response, 200, "text/html; charset=utf-8", EDITOR_PAGE);

  send(response, 404, "text/plain", "Not found");
}).listen(port, "127.0.0.1");
