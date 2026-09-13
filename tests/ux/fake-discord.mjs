// Faux Discord pour les tests : échange du code OAuth et profil /users/@me, sans appel au vrai Discord.
// Le code d'autorisation porte l'identité : "u1001" -> utilisateur Discord 1001.
import http from "node:http";
import process from "node:process";

const port = Number(process.env.FAKE_DISCORD_PORT ?? 8013);

const readBody = (request) => new Promise((resolve) => {
  let body = "";
  request.on("data", (chunk) => { body += chunk; });
  request.on("end", () => resolve(body));
});

const send = (response, status, data) => {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(data));
};

http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);

  if (request.method === "GET" && url.pathname === "/health") return send(response, 200, { ok: true });

  if (request.method === "POST" && url.pathname === "/oauth2/token") {
    const form = new URLSearchParams(await readBody(request));
    const code = form.get("code") ?? "";
    const valid = form.get("grant_type") === "authorization_code" && form.get("client_id") && form.get("client_secret") && form.get("redirect_uri") && /^u\d+$/.test(code);
    return valid ? send(response, 200, { access_token: `tok-${code}`, token_type: "Bearer" }) : send(response, 400, { error: "invalid_grant" });
  }

  if (request.method === "GET" && url.pathname === "/users/@me") {
    const match = /^Bearer tok-u(\d+)$/.exec(request.headers.authorization ?? "");
    if (!match) return send(response, 401, { message: "401: Unauthorized" });
    return send(response, 200, { id: match[1], username: `joueur${match[1]}`, global_name: `Joueur ${match[1]}`, avatar: null });
  }

  send(response, 404, { message: "Not found" });
}).listen(port, "127.0.0.1");
