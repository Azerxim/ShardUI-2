import { test, expect } from "@playwright/test";
import { apiGet, blockExternalRequests, submitOpenModal, uniqueSuffix } from "./helpers.js";

// Parcours complet d'un nouveau joueur, dans une même session de navigateur : chaque étape s'appuie sur la précédente.
test.describe.configure({ mode: "serial" });

const suffix = uniqueSuffix();
const account = { username: `nouveau${suffix}`, pseudo: `Nouveau ${suffix}`, email: `nouveau${suffix}@test.local`, password: "MotDePasse123" };
const titles = { religion: `Foi ${suffix}`, civilisation: `Royaume ${suffix}`, commerce: `Échoppe ${suffix}` };

let context;
let page;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext({ locale: "fr-FR" });
  await blockExternalRequests(context);
  page = await context.newPage();
});

test.afterAll(async () => {
  await context.close();
});

const main = () => page.locator("main.container");

test("l'inscription ouvre directement la session avec le pseudo choisi", async () => {
  await page.goto("/register");
  await expect(page.getByText("Nom affiché aux autres joueurs")).toBeVisible();
  await page.fill("#username", account.username);
  await page.fill("#pseudo", account.pseudo);
  await page.fill("#email", account.email);
  await page.fill("#password", account.password);
  await page.fill("#confirmPassword", account.password);
  await page.getByRole("button", { name: "Inscription", exact: true }).click();
  await page.waitForURL("**/profil");

  const session = await page.evaluate(() => ({ user: JSON.parse(localStorage.getItem("user")), token: localStorage.getItem("token") }));
  expect(session.token).toBeTruthy();
  expect(session.user.full_name).toBe(account.pseudo);
  await expect(main().locator("h1")).toContainText(account.pseudo);
});

test("le profil guide les premières étapes", async () => {
  await expect(main().getByText("Prochaines étapes")).toBeVisible();
  await expect(main().getByText(/aucune civilisation, religion ou commerce/i)).toBeVisible();
  await expect(main().getByRole("link", { name: /lire le codex/i })).toBeVisible();
});

test("fonder une religion sans date de fondation fonctionne dès l'inscription", async () => {
  await page.goto("/religions");
  await page.locator('button[data-tip="Nouvelle Religion"]').first().click();
  expect(await submitOpenModal(page, titles.religion)).toMatch(/succès/i);
  await expect(main().locator("a", { hasText: titles.religion })).toBeVisible();
});

test("sur sa religion, le fondateur voit ses actions et son rôle", async () => {
  await main().locator("a", { hasText: titles.religion }).click();
  await expect(main().getByRole("button", { name: "Modifier" })).toBeVisible();
  await expect(main().getByRole("button", { name: "Ajouter" })).toBeVisible();
  await expect(main().locator(".badge", { hasText: "Fondateur" })).toBeVisible();
  await expect(main().getByRole("note")).toHaveCount(0);
});

test("fonder une civilisation sans date de fondation fonctionne", async () => {
  await page.goto("/civilisations");
  await page.locator('button[data-tip="Nouvelle Civilisation"]').first().click();
  expect(await submitOpenModal(page, titles.civilisation)).toMatch(/succès/i);
  await expect(main().locator("a", { hasText: titles.civilisation })).toBeVisible();
});

test("ouvrir un commerce, puis comprendre comment le compléter", async () => {
  await page.goto("/commerces");
  await page.locator('button[data-tip="Nouveau commerce"]').first().click();
  expect(await submitOpenModal(page, titles.commerce)).toMatch(/succès/i);
  await main().locator("a", { hasText: titles.commerce }).click();
  await expect(main().getByRole("button", { name: "Ajouter" })).toHaveCount(2);
  await expect(main().getByText(/aucun magasin/i)).toBeVisible();
});

test("une session expirée est expliquée au lieu d'une erreur générique", async () => {
  await page.goto("/religions");
  const token = await page.evaluate(() => localStorage.getItem("token"));
  await page.evaluate(() => localStorage.setItem("token", "jeton-expire"));
  await page.locator('button[data-tip="Nouvelle Religion"]').first().click();
  expect(await submitOpenModal(page, `Refusée ${suffix}`)).toMatch(/connecté/i);
  await page.evaluate((value) => localStorage.setItem("token", value), token);
});

test("sur une civilisation dont il n'est pas membre, il sait comment la rejoindre", async () => {
  const civilisations = await apiGet("/civilisations/list");
  const other = civilisations.find(({ civilisation, members }) => civilisation.is_public && !members.some((m) => m.username === account.username));
  test.skip(!other, "aucune autre civilisation publique dans la base de test");
  await page.goto(`/civilisation/${other.civilisation.id}`);
  await expect(main().getByRole("note")).toContainText(/pour rejoindre cette civilisation, contactez/i);
  await expect(main().getByRole("button", { name: /ajouter|modifier|marqueurs|nouveau/i })).toHaveCount(0);
});

test("le profil liste ses civilisations, religions et commerces", async () => {
  await page.goto("/profil");
  for (const title of Object.values(titles)) {
    await expect(main().getByRole("link", { name: new RegExp(title) })).toBeVisible();
  }
});

test("la déconnexion ferme complètement la session", async () => {
  await main().getByRole("button", { name: "Déconnexion" }).click();
  await page.locator(".swal2-confirm").click();
  await page.waitForURL("**/login");
  const session = await page.evaluate(() => ({ user: localStorage.getItem("user"), token: localStorage.getItem("token") }));
  expect(session).toEqual({ user: null, token: null });
  // L'alerte « Déconnecté » se ferme seule ; la barre propose de nouveau de se connecter
  await expect(page.locator(".navbar").getByRole("button", { name: "Connexion ou inscription" })).toBeVisible();
});
