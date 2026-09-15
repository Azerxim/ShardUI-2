// Faux fournisseurs OAuth pour les tests, sans appel aux vrais services.
// Discord : échange du code et profil /users/@me. Le code porte l'identité : "u1001" -> utilisateur Discord 1001.
// Microsoft : jeton, Xbox Live, XSTS, Minecraft. Codes "m1001" (compte valide, joueur Steve1001),
// "x1001" (compte sans profil Xbox), "g1001" (compte sans Minecraft Java).
import http from "node:http";
import process from "node:process";

const port = Number(process.env.FAKE_DISCORD_PORT ?? 8013);

const readBody = (request) => new Promise((resolve) => {
  let body = "";
  request.on("data", (chunk) => { body += chunk; });
  request.on("end", () => resolve(body));
});

const readJson = async (request) => {
  try {
    return JSON.parse(await readBody(request));
  } catch {
    return {};
  }
};

const send = (response, status, data) => {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(data));
};

http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);

  if (request.method === "GET" && url.pathname === "/health") return send(response, 200, { ok: true });

  // Discord
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

  // Microsoft (compte personnel)
  if (request.method === "POST" && url.pathname === "/consumers/oauth2/v2.0/token") {
    const form = new URLSearchParams(await readBody(request));
    const code = form.get("code") ?? "";
    const valid = form.get("grant_type") === "authorization_code" && form.get("client_id") && form.get("client_secret") && form.get("redirect_uri") && /^[mxg]\d+$/.test(code);
    return valid ? send(response, 200, { access_token: `ms-${code}`, token_type: "Bearer" }) : send(response, 400, { error: "invalid_grant", error_description: "AADSTS70000: code invalide" });
  }

  // Xbox Live
  if (request.method === "POST" && url.pathname === "/user/authenticate") {
    const match = /^d=ms-([mxg]\d+)$/.exec((await readJson(request)).Properties?.RpsTicket ?? "");
    if (!match) return send(response, 400, {});
    return send(response, 200, { Token: `xbl-${match[1]}`, DisplayClaims: { xui: [{ uhs: `uhs-${match[1]}` }] } });
  }

  if (request.method === "POST" && url.pathname === "/xsts/authorize") {
    const match = /^xbl-([mxg]\d+)$/.exec((await readJson(request)).Properties?.UserTokens?.[0] ?? "");
    if (!match) return send(response, 400, {});
    if (match[1].startsWith("x")) return send(response, 401, { XErr: 2148916233, Message: "" });
    return send(response, 200, { Token: `xsts-${match[1]}`, DisplayClaims: { xui: [{ uhs: `uhs-${match[1]}` }] } });
  }

  // Minecraft
  if (request.method === "POST" && url.pathname === "/authentication/login_with_xbox") {
    const match = /^XBL3\.0 x=uhs-([mxg]\d+);xsts-\1$/.exec((await readJson(request)).identityToken ?? "");
    if (!match) return send(response, 401, { errorMessage: "Invalid token" });
    return send(response, 200, { access_token: `mc-${match[1]}` });
  }

  if (request.method === "GET" && url.pathname === "/minecraft/profile") {
    const match = /^Bearer mc-([mxg])(\d+)$/.exec(request.headers.authorization ?? "");
    if (!match) return send(response, 401, { errorMessage: "Unauthorized" });
    if (match[1] === "g") return send(response, 404, { error: "NOT_FOUND", errorMessage: "The server has not found anything matching the request URI" });
    return send(response, 200, { id: match[2].padStart(32, "0"), name: `Steve${match[2].slice(-6)}`, skins: [], capes: [] });
  }

  send(response, 404, { message: "Not found" });
}).listen(port, "127.0.0.1");
