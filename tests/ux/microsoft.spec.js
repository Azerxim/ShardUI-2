import { test, expect } from "@playwright/test";
import { blockExternalRequests, createSession, readAlert, signIn } from "./helpers.js";

// Compte Minecraft (Microsoft) : liaison depuis le profil, connexion, et comptes Microsoft non utilisables.
// La page d'autorisation Microsoft est simulée dans le navigateur ; l'API parle à tests/ux/fake-discord.mjs.
test.describe.configure({ mode: "serial" });

const digits = `${Date.now()}`.slice(-9);
const pseudo = `Steve${digits.slice(-6)}`;

let joueur;
let sansJeu;

test.beforeAll(async () => {
  joueur = await createSession("minecraftA");
  sansJeu = await createSession("minecraftB");
});

const main = (page) => page.locator("main.container");

async function openAs(browser, session, code) {
  const context = await browser.newContext({ locale: "fr-FR" });
  await blockExternalRequests(context);
  if (session) await signIn(context, session);
  const page = await context.newPage();
  await page.route(/^https:\/\/login\.microsoftonline\.com\/consumers\/oauth2\/v2\.0\/authorize/, async (route) => {
    const url = new URL(route.request().url());
    const target = new URL(url.searchParams.get("redirect_uri"));
    target.searchParams.set("code", code);
    target.searchParams.set("state", url.searchParams.get("state"));
    await route.fulfill({ status: 302, headers: { location: target.toString() } });
  });
  return { context, page };
}

const minecraftRow = (page) => main(page).locator("li", { hasText: "Minecraft" });

test("lier son compte Minecraft depuis le profil", async ({ browser }) => {
  const { context, page } = await openAs(browser, joueur, `m${digits}`);
  await page.goto("/profil");
  await expect(minecraftRow(page)).not.toContainText("Bientôt disponible");
  await minecraftRow(page).getByRole("button", { name: "Lier mon compte Minecraft" }).click();

  expect(await readAlert(page)).toMatch(/Minecraft lié/);
  await page.waitForURL("**/profil");
  await expect(minecraftRow(page)).toContainText(`Lié à ${pseudo}`);
  await context.close();
});

test("se connecter avec Minecraft une fois le compte lié", async ({ browser }) => {
  const { context, page } = await openAs(browser, null, `m${digits}`);
  await page.goto("/login");
  await page.getByRole("button", { name: "Se connecter avec Minecraft" }).click();
  await page.waitForURL("**/profil");

  const session = await page.evaluate(() => JSON.parse(localStorage.getItem("user")));
  expect(session.username).toBe(joueur.account.username);
  await context.close();
});

test("un compte Microsoft sans Minecraft Java est refusé avec une explication", async ({ browser }) => {
  const { context, page } = await openAs(browser, sansJeu, `g${digits}`);
  await page.goto("/profil");
  await minecraftRow(page).getByRole("button", { name: "Lier mon compte Minecraft" }).click();
  await page.waitForURL("**/auth/microsoft/callback**");

  await expect(page.getByRole("alert")).toContainText("ne possède pas Minecraft Java Edition");
  await expect(page.getByRole("link", { name: "Retour au profil" })).toBeVisible();
  await context.close();
});

test("un compte Microsoft sans profil Xbox est guidé", async ({ browser }) => {
  const { context, page } = await openAs(browser, sansJeu, `x${digits}`);
  await page.goto("/profil");
  await minecraftRow(page).getByRole("button", { name: "Lier mon compte Minecraft" }).click();
  await page.waitForURL("**/auth/microsoft/callback**");

  await expect(page.getByRole("alert")).toContainText("pas encore de profil Xbox");
  await context.close();
});
