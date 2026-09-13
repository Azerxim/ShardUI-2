import { test, expect } from "@playwright/test";
import { apiPost, blockExternalRequests, createSession, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Une civilisation fonde une alliance, en invite une autre qui accepte depuis son profil ; un visiteur comprend comment y entrer.
test.describe.configure({ mode: "serial" });

const suffix = uniqueSuffix();
const titles = { alliance: `Pacte ${suffix}`, fondatrice: `Marche ${suffix}`, invitee: `Comté ${suffix}` };

let fondateur;
let invite;
let civInvitee;
let allianceId;

test.beforeAll(async () => {
  fondateur = await createSession("allianceA");
  invite = await createSession("allianceB");
  await apiPost("/civilisations/create", fondateur.token, { title: titles.fondatrice, is_public: true });
  civInvitee = (await apiPost("/civilisations/create", invite.token, { title: titles.invitee, is_public: true })).civilisation;
});

const main = (page) => page.locator("main.container");

async function openAs(browser, session) {
  const context = await browser.newContext({ locale: "fr-FR" });
  await blockExternalRequests(context);
  if (session) await signIn(context, session);
  return { context, page: await context.newPage() };
}

test("fonder une alliance au nom de sa civilisation", async ({ browser }) => {
  const { context, page } = await openAs(browser, fondateur);
  await page.goto("/alliances");
  await page.locator('button[data-tip="Nouvelle alliance"]').click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog.locator('select[name="civilisation_id"]')).toHaveValue(/\d+/);
  await dialog.locator('input[name="title"]').fill(titles.alliance);
  await dialog.getByText("Diplomatique").click();
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/alliance fondée/i);

  await page.waitForURL(/\/alliance\/\d+$/);
  allianceId = Number(page.url().split("/").pop());
  await expect(main(page).locator("h1")).toContainText(titles.alliance);
  await expect(main(page).getByText("Alliance diplomatique")).toBeVisible();
  await expect(main(page).locator(".badge", { hasText: "Chef de file" })).toBeVisible();
  for (const name of ["Modifier", "Dissoudre", "Inviter"]) {
    await expect(main(page).getByRole("button", { name, exact: true })).toBeVisible();
  }
  await context.close();
});

test("inviter une civilisation", async ({ browser }) => {
  const { context, page } = await openAs(browser, fondateur);
  await page.goto(`/alliance/${allianceId}`);
  await main(page).getByRole("button", { name: "Inviter", exact: true }).click();
  await page.locator("dialog[open] select").selectOption({ label: titles.invitee });
  await page.locator("dialog[open] button[type='submit']").click();
  expect(await readAlert(page)).toMatch(/succès/i);
  await expect(main(page).getByText("est invitée à rejoindre l'alliance")).toBeVisible();
  await context.close();
});

test("la civilisation invitée voit l'invitation sur son profil et l'accepte", async ({ browser }) => {
  const { context, page } = await openAs(browser, invite);
  await page.goto("/profil");
  const pending = main(page).getByRole("link", { name: new RegExp(`invitée à rejoindre l'alliance ${titles.alliance}`) });
  await expect(pending).toBeVisible();
  await pending.click();
  await page.waitForURL(`**/alliance/${allianceId}`);

  await main(page).getByRole("button", { name: "Accepter" }).click();
  expect(await readAlert(page)).toMatch(/acceptée|succès/i);
  const membre = main(page).locator("li", { hasText: titles.invitee });
  await expect(membre.locator(".badge", { hasText: "Membre" })).toBeVisible();
  await expect(main(page).getByRole("button", { name: "Quitter l'alliance" })).toBeVisible();
  await context.close();
});

test("un visiteur voit l'alliance sans actions et comprend comment la rejoindre", async ({ browser }) => {
  const { context, page } = await openAs(browser, null);
  await page.goto(`/alliance/${allianceId}`);
  await expect(main(page).locator("h1")).toContainText(titles.alliance);
  await expect(main(page).getByRole("note")).toContainText(/demande/i);
  await expect(main(page).getByRole("button", { name: /modifier|dissoudre|inviter|accepter/i })).toHaveCount(0);

  await page.goto("/alliances");
  await expect(main(page).locator("a", { hasText: titles.alliance })).toBeVisible();
  await context.close();
});

test("la fiche de la civilisation affiche son alliance", async ({ browser }) => {
  const { context, page } = await openAs(browser, null);
  await page.goto(`/civilisation/${civInvitee.id}`);
  const lien = main(page).getByRole("link", { name: new RegExp(titles.alliance) });
  await expect(lien).toBeVisible();
  await expect(lien.locator(".badge", { hasText: "Membre" })).toBeVisible();
  await context.close();
});
