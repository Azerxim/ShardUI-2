import { test, expect } from "@playwright/test";
import { apiPost, blockExternalRequests, createSession, uniqueSuffix } from "./helpers.js";

// Tetrago sur l'écran d'accueil : manifeste (public/manifest.webmanifest) et service worker (public/sw.js). Le serveur
// de développement des tests ne l'enregistre pas (build de production seulement) : le test l'enregistre lui-même.
test.describe.configure({ mode: "serial" });

const suffixe = uniqueSuffix();

test("le site déclare un manifeste installable, avec ses icônes", async ({ page, request }) => {
  await blockExternalRequests(page);
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBe("/manifest.webmanifest");
  const manifeste = await (await request.get(href)).json();
  expect(manifeste).toMatchObject({ name: "Tetrago", start_url: "/", display: "standalone" });
  const tailles = manifeste.icons.map((icone) => `${icone.sizes} ${icone.purpose}`);
  expect(tailles).toEqual(expect.arrayContaining(["192x192 any", "512x512 any", "512x512 maskable"]));
  for (const icone of manifeste.icons) {
    expect((await request.get(icone.src)).status(), icone.src).toBe(200);
  }
});

test("une page déjà consultée se relit hors ligne", async ({ page, context }) => {
  const auteur = await createSession("hors-ligne");
  const livre = await apiPost("/bibliotheque/livres/create", auteur.token, { user_id: 0, author: "Veilleur", title: `Carnet sans réseau ${suffixe}`, categorie: "recits" });

  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
  });
  // Page contrôlée par le service worker : ce qu'elle charge est gardé
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.goto(`/bibliotheque/livre/${livre.id}`);
  await expect(page.getByRole("heading", { name: `Carnet sans réseau ${suffixe}` })).toBeVisible();
  await page.waitForLoadState("networkidle");

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: `Carnet sans réseau ${suffixe}` })).toBeVisible();
  await expect(page.getByText("Hors ligne : vous relisez les pages déjà consultées sur cet appareil.")).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText("Hors ligne : vous relisez les pages déjà consultées sur cet appareil.")).toHaveCount(0);
});
