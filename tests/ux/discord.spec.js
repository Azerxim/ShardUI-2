import { test, expect } from "@playwright/test";
import { blockExternalRequests, createSession, readAlert, refreshSession, signIn } from "./helpers.js";

// Connexion Discord : pas de création de compte, liaison depuis le profil, puis connexion.
// La page d'autorisation de discord.com est simulée dans le navigateur ; l'API échange le code auprès de tests/ux/fake-discord.mjs.
test.describe.configure({ mode: "serial" });

const discordId = `${Date.now()}`.slice(-9);
const code = `u${discordId}`;

let proprietaire;
let autre;

test.beforeAll(async () => {
  proprietaire = await createSession("discordA");
  autre = await createSession("discordB");
});

const main = (page) => page.locator("main.container");

// Autorise immédiatement sur « discord.com » et renvoie vers l'adresse de retour du site avec le code choisi
async function simulateDiscord(page, authorizationCode = code) {
  await page.route(/^https:\/\/discord\.com\/oauth2\/authorize/, async (route) => {
    const url = new URL(route.request().url());
    const target = new URL(url.searchParams.get("redirect_uri"));
    target.searchParams.set("code", authorizationCode);
    target.searchParams.set("state", url.searchParams.get("state"));
    await route.fulfill({ status: 302, headers: { location: target.toString() } });
  });
}

async function openAs(browser, session) {
  const context = await browser.newContext({ locale: "fr-FR" });
  await blockExternalRequests(context);
  if (session) await signIn(context, session);
  const page = await context.newPage();
  await simulateDiscord(page);
  return { context, page };
}

test("se connecter avec un Discord non lié ne crée pas de compte et explique quoi faire", async ({ browser }) => {
  const { context, page } = await openAs(browser, null);
  await page.goto("/login");
  await page.getByRole("button", { name: "Se connecter avec Discord" }).click();
  await page.waitForURL("**/auth/discord/callback**");

  await expect(page.getByRole("alert")).toContainText(/Aucun compte Tetrago n'est lié à ce compte Discord/);
  await expect(page.getByRole("link", { name: "Créer un compte" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  await context.close();
});

test("lier son compte Discord depuis le profil", async ({ browser }) => {
  const { context, page } = await openAs(browser, proprietaire);
  await page.goto("/profil");
  const discord = main(page).locator("li", { hasText: "Discord" });
  await discord.getByRole("button", { name: "Lier mon compte Discord" }).click();

  expect(await readAlert(page)).toMatch(/Discord lié/);
  await page.waitForURL("**/profil");
  await expect(main(page).locator("li", { hasText: "Discord" })).toContainText(`Lié à Joueur ${discordId}`);
  await expect(main(page).locator("li", { hasText: "Discord" }).getByRole("button", { name: "Délier" })).toBeVisible();
  await context.close();
});

test("se connecter avec Discord une fois le compte lié", async ({ browser }) => {
  const { context, page } = await openAs(browser, null);
  await page.goto("/login");
  await page.getByRole("button", { name: "Se connecter avec Discord" }).click();
  await page.waitForURL("**/profil");

  await expect(main(page).locator("h1")).toContainText(proprietaire.account.full_name);
  const session = await page.evaluate(() => ({ token: localStorage.getItem("token"), user: JSON.parse(localStorage.getItem("user")) }));
  expect(session.token).toBeTruthy();
  expect(session.user.username).toBe(proprietaire.account.username);
  await context.close();
});

test("un compte Discord ne peut être lié qu'à un seul compte Tetrago", async ({ browser }) => {
  const { context, page } = await openAs(browser, autre);
  await page.goto("/profil");
  await main(page).locator("li", { hasText: "Discord" }).getByRole("button", { name: "Lier mon compte Discord" }).click();
  await page.waitForURL("**/auth/discord/callback**");
  await expect(page.getByRole("alert")).toContainText("déjà lié à un autre compte Tetrago");
  await expect(page.getByRole("link", { name: "Retour au profil" })).toBeVisible();
  await context.close();
});

test("délier Discord empêche de se connecter avec", async ({ browser }) => {
  // La connexion Discord du test précédent a fermé l'ancienne session du propriétaire
  const owner = await openAs(browser, await refreshSession(proprietaire));
  await owner.page.goto("/profil");
  await main(owner.page).locator("li", { hasText: "Discord" }).getByRole("button", { name: "Délier" }).click();
  // Confirmation, puis alerte de succès (la première se ferme pendant que la seconde s'ouvre)
  await owner.page.locator(".swal2-confirm", { hasText: "Délier" }).click();
  await expect(owner.page.locator(".swal2-popup")).toContainText("a été délié");
  await owner.page.locator(".swal2-confirm").click();
  await expect(main(owner.page).locator("li", { hasText: "Discord" }).getByRole("button", { name: "Lier mon compte Discord" })).toBeVisible();
  await owner.context.close();

  const visitor = await openAs(browser, null);
  await visitor.page.goto("/login");
  await visitor.page.getByRole("button", { name: "Se connecter avec Discord" }).click();
  await expect(visitor.page.getByRole("alert")).toContainText(/Aucun compte Tetrago n'est lié/);
  await visitor.context.close();
});
