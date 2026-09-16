import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createDiscordJournal, createSession, linkDiscordAccount, linkPlatform, makeModerateur, uniqueSuffix } from "./helpers.js";

// Profil public : rôles, compte Minecraft, appartenances et écrits publics, personnages ; rien de privé.
test.describe.configure({ mode: "serial" });

const suffix = uniqueSuffix();
const discordUid = `5${Date.now()}`;
let joueur;

test.beforeAll(async () => {
  joueur = await createSession("public");
  makeModerateur(joueur.account.username);
  await apiPost("/civilisations/create", joueur.token, { title: `Empire ${suffix}`, is_public: true });
  await apiPost("/civilisations/create", joueur.token, { title: `Secte ${suffix}`, is_public: false });
  createDiscordJournal({ title: `Gazette ${suffix}`, uid: `6${Date.now()}`, userId: joueur.user.id });
  await apiPost("/personnages/create", joueur.token, { name: `Héros ${suffix}` });
  linkPlatform(joueur.user.id, "microsoft", `mc${suffix}`);
  linkDiscordAccount(joueur.user.id, discordUid);
});

test("le profil public présente rôles, compte Minecraft, appartenances et écrits publics", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto(`/profil/${joueur.user.id}`);
  const main = page.locator("main.container");

  await expect(main.locator("h1")).toContainText(joueur.account.full_name);
  await expect(main.locator(".badge", { hasText: "Modérateur RP" })).toBeVisible();
  await expect(main.getByText(`Joueur mc${suffix}`)).toBeVisible();
  await expect(main.getByRole("link", { name: new RegExp(`Empire ${suffix}`) })).toContainText("Fondateur");
  await expect(main.getByRole("link", { name: new RegExp(`Gazette ${suffix}`) })).toBeVisible();
  await expect(main.getByRole("link", { name: new RegExp(`Héros ${suffix}`) })).toBeVisible();

  // Rien de privé : civilisation privée, e-mail, compte Discord
  await expect(main.getByText(`Secte ${suffix}`)).toHaveCount(0);
  await expect(main.getByText(joueur.account.email)).toHaveCount(0);
  await expect(main.getByText(discordUid)).toHaveCount(0);
});

test("seul le compte Minecraft est public, et plus rien si le profil devient privé", async ({ page }) => {
  expect((await apiGet(`/users/id/${joueur.user.id}/platforms`)).map((platform) => platform.platform)).toEqual(["microsoft"]);

  const response = await fetch(`${API_URL}/users/update/${joueur.user.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${joueur.token}` },
    body: JSON.stringify({ is_visible: false }),
  });
  expect(response.ok).toBe(true);
  expect(await apiGet(`/users/id/${joueur.user.id}/platforms`)).toEqual([]);

  await blockExternalRequests(page);
  await page.goto(`/profil/${joueur.user.id}`);
  await expect(page.getByText("Ce profil est privé.")).toBeVisible();
});
