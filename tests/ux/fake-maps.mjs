// Fausse carte (Shard-Maps) pour tester la connexion de l'éditeur ouvert depuis le site : une page d'éditeur
// minimale, servie sur une autre origine, qui charge le vrai assets/scripts/core/shard-api.js. Elle sert aussi une carte
// intégrée « guerres » minimale (Leaflet sans tuiles) qui charge le vrai calque des troupes (layers/troupes.js).
// SHARD_MAPS_DIR : dossier de Shard-Maps (par défaut ../Shard-Maps à côté de ShardUI-2).
// POST /__config { uiBaseUrl, uiAllowedOrigins } change les origines autorisées (env.js).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mapsDir = path.resolve(process.env.SHARD_MAPS_DIR ?? path.join(here, "../../../Shard-Maps"));
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
    <script src="/assets/scripts/core/env.js"></script>
    <script src="/assets/scripts/core/shard-api.js"></script>
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

// {dimension}-embedfull-guerres : carte vide, avec le calque des troupes envoyées par la fiche de la guerre
const EMBED_PAGE = `<!doctype html>
<html lang="fr">
  <head><link rel="stylesheet" href="/assets/leaflet/leaflet.css" /></head>
  <body style="margin:0">
    <div id="map" style="width:100%;height:100vh"></div>
    <script src="/assets/leaflet/leaflet.js"></script>
    <script src="/assets/scripts/core/env.js"></script>
    <script src="/assets/scripts/core/functions.js"></script>
    <script src="/assets/scripts/core/shard-api.js"></script>
    <script src="/assets/scripts/layers/troupes.js"></script>
    <script>
      const map = L.map("map", { center: [0, 0], zoom: 0, crs: L.CRS.Simple });
      TroupesGuerre(map);
    </script>
  </body>
</html>`;

const STATIC_TYPES = { ".js": "text/javascript", ".css": "text/css" };

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

  if (url.pathname === "/assets/scripts/core/env.js") {
    const env = [
      `window.SHARD_API_BASE_URL = ${JSON.stringify(config.apiBaseUrl)};`,
      `window.UI_BASE_URL = ${JSON.stringify(config.uiBaseUrl)};`,
      `window.UI_ALLOWED_ORIGINS = ${JSON.stringify(config.uiAllowedOrigins)};`,
    ].join("\n");
    return send(response, 200, "text/javascript", env);
  }

  // Scripts et styles de la vraie carte (Leaflet, functions.js, shard-api.js, calques)
  const fichier = path.join(mapsDir, path.normalize(url.pathname));
  if (url.pathname.startsWith("/assets/") && fichier.startsWith(path.join(mapsDir, "assets")) && STATIC_TYPES[path.extname(fichier)] && fs.existsSync(fichier)) {
    return send(response, 200, STATIC_TYPES[path.extname(fichier)], fs.readFileSync(fichier));
  }

  if (/-embedfull-guerres$/.test(url.pathname)) return send(response, 200, "text/html; charset=utf-8", EMBED_PAGE);

  // {dimension}-editor-civilisations?type=ID
  if (/-editor-/.test(url.pathname)) return send(response, 200, "text/html; charset=utf-8", EDITOR_PAGE);

  send(response, 404, "text/plain", "Not found");
}).listen(port, "127.0.0.1");
