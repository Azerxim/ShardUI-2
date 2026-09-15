import { test, expect } from "@playwright/test";
import { apiGet, apiPost, blockExternalRequests, createSession, makeModerateur, readAlert, readAnnouncements, signIn, uniqueSuffix } from "./helpers.js";

// Déclaration, confidentialité, appel aux armes, modération RP et guerre de religion.
test.describe.configure({ mode: "serial" });

const suffix = uniqueSuffix();
const titles = {
  guerre: `Guerre des Cendres ${suffix}`,
  religion: `Schisme ${suffix}`,
  attaquant: `Horde ${suffix}`,
  defenseur: `Citadelle ${suffix}`,
  allie: `Clan ${suffix}`,
  cultes: [`Culte du Soleil ${suffix}`, `Culte de la Lune ${suffix}`],
};

let sessions;
let guerreId;

test.beforeAll(async () => {
  const [attaquant, defenseur, allie, moderateur] = await Promise.all(["guerreA", "guerreD", "guerreL", "guerreM"].map((prefix) => createSession(prefix)));
  await apiPost("/civilisations/create", attaquant.token, { title: titles.attaquant, is_public: true });
  await apiPost("/civilisations/create", defenseur.token, { title: titles.defenseur, is_public: true });
  await apiPost("/civilisations/create", allie.token, { title: titles.allie, is_public: true });
  await apiPost("/religions/create", attaquant.token, { title: titles.cultes[0], color: "#f59e0b", is_public: true });
  await apiPost("/religions/create", defenseur.token, { title: titles.cultes[1], color: "#6366f1", is_public: true });
  makeModerateur(moderateur.account.username);
  sessions = { attaquant, defenseur, allie, moderateur: { ...moderateur, user: { ...moderateur.user, is_moderateur: true } } };
});

const main = (page) => page.locator("main.container");

async function openAs(browser, session) {
  const context = await browser.newContext({ locale: "fr-FR" });
  await blockExternalRequests(context);
  if (session) await signIn(context, session);
  return { context, page: await context.newPage() };
}

test("déclarer une guerre au nom de sa civilisation", async ({ browser }) => {
  const { context, page } = await openAs(browser, sessions.attaquant);
  await page.goto("/guerres");
  await page.locator('button[data-tip="Déclarer une guerre"]').click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog.getByRole("note")).toContainText(/modérateur RP/);
  await dialog.locator('input[name="title"]').fill(titles.guerre);
  await dialog.locator('select[name="attaquant_id"]').selectOption({ label: titles.attaquant });
  await dialog.locator('select[name="defenseur_id"]').selectOption({ label: titles.defenseur });
  await dialog.locator('textarea[name="casus_belli"]').fill("Pillage des greniers de la Horde");
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/validation par un modérateur/i);

  await page.waitForURL(/\/guerre\/\d+$/);
  guerreId = Number(page.url().split("/").pop());
  await expect(main(page).locator("h1")).toContainText(titles.guerre);
  await expect(main(page).locator(".badge", { hasText: "En attente de validation" })).toBeVisible();
  await expect(main(page).getByRole("note")).toContainText(/visible que des camps concernés/);
  const attaquants = main(page).getByRole("region", { name: "Attaquants" });
  await expect(attaquants.locator("li", { hasText: titles.attaquant }).locator(".badge", { hasText: "Chef de camp" })).toBeVisible();
  await expect(main(page).getByRole("region", { name: "Défenseurs" })).toContainText(titles.defenseur);
  await context.close();
});

test("la déclaration reste privée jusqu'à sa validation", async ({ browser }) => {
  const { context, page } = await openAs(browser, null);
  await page.goto(`/guerre/${guerreId}`);
  await expect(main(page).locator("h1")).toContainText("Guerre introuvable");
  await page.goto("/guerres");
  await expect(main(page).getByText(titles.guerre)).toHaveCount(0);
  await context.close();

  // Le camp défenseur, lui, la voit
  const defense = await openAs(browser, sessions.defenseur);
  await defense.page.goto(`/guerre/${guerreId}`);
  await expect(main(defense.page).locator("h1")).toContainText(titles.guerre);
  await defense.context.close();
});

test("le camp attaquant appelle un allié, qui rejoint la guerre", async ({ browser }) => {
  const attaque = await openAs(browser, sessions.attaquant);
  await attaque.page.goto(`/guerre/${guerreId}`);
  await main(attaque.page).getByRole("region", { name: "Attaquants" }).getByRole("button", { name: /appeler un allié/i }).click();
  await attaque.page.locator("dialog[open] select").selectOption({ label: titles.allie });
  await attaque.page.locator("dialog[open] button[type='submit']").click();
  expect(await readAlert(attaque.page)).toMatch(/appel aux armes/i);
  await expect(main(attaque.page).locator("li", { hasText: titles.allie }).locator(".badge", { hasText: "Appel en attente" })).toBeVisible();
  await attaque.context.close();

  const allie = await openAs(browser, sessions.allie);
  await allie.page.goto("/guerres");
  const appel = main(allie.page).locator("li", { hasText: titles.guerre });
  await expect(appel).toContainText(titles.allie);
  await appel.getByRole("button", { name: "Rejoindre" }).click();
  expect(await readAlert(allie.page)).toMatch(/rejoint/i);
  await allie.context.close();

  const infos = await apiGet(`/guerres/list`);
  expect(infos.some(({ guerre }) => guerre.id === guerreId)).toBe(false);
});

test("un modérateur valide la guerre, qui devient publique", async ({ browser }) => {
  const { context, page } = await openAs(browser, sessions.moderateur);
  await page.goto(`/guerre/${guerreId}`);
  const moderation = main(page).getByRole("region", { name: "Modération" });
  await moderation.getByRole("button", { name: "Valider" }).click();
  await page.locator("dialog[open] textarea[name='note']").fill("Batailles à jouer en zone de conflit");
  await page.locator("dialog[open] button[type='submit']").click();
  expect(await readAlert(page)).toMatch(/commence/i);
  await expect(main(page).locator(".badge", { hasText: "En cours" })).toBeVisible();
  await context.close();

  const visiteur = await openAs(browser, null);
  await visiteur.page.goto("/guerres");
  await expect(main(visiteur.page).locator("a", { hasText: titles.guerre })).toBeVisible();
  await visiteur.page.goto(`/guerre/${guerreId}`);
  await expect(main(visiteur.page).getByRole("region", { name: "Attaquants" })).toContainText(titles.allie);
  await expect(main(visiteur.page).getByRole("button", { name: /valider|terminer|appeler|modifier/i })).toHaveCount(0);
  await visiteur.context.close();
});

test("la chronologie retrace la guerre et un chef de camp y raconte une bataille", async ({ browser }) => {
  const bataille = `Bataille du Gué ${suffix}`;
  const attaque = await openAs(browser, sessions.attaquant);
  await attaque.page.goto(`/guerre/${guerreId}`);
  const chronologie = main(attaque.page).getByRole("list", { name: "Chronologie" });
  await expect(chronologie).toContainText(`Déclaration de guerre de ${titles.attaquant} contre ${titles.defenseur}`);
  await expect(chronologie).toContainText(`${titles.allie} rejoint le camp attaquant`);
  await expect(chronologie).toContainText("La guerre commence");

  await main(attaque.page).getByRole("button", { name: "Raconter" }).click();
  const dialog = attaque.page.locator("dialog[open]");
  await dialog.locator('input[name="title"]').fill(bataille);
  await dialog.locator('select[name="camp"]').selectOption({ label: "Attaquants" });
  await dialog.locator('textarea[name="description"]').fill("La Horde force le passage.");
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(attaque.page)).toMatch(/chronologie/);
  await expect(chronologie.locator("li", { hasText: bataille })).toContainText("La Horde force le passage.");
  await attaque.context.close();

  // Annonces Discord (simulées) : début de la guerre et bataille
  const annonces = readAnnouncements().filter((annonce) => annonce.channel === "guerres").map((annonce) => annonce.content);
  expect(annonces.some((text) => text.includes(titles.guerre) && text.includes("La guerre commence"))).toBe(true);
  expect(annonces.some((text) => text.includes(`Bataille : ${bataille}`))).toBe(true);

  // Visiteur : chronologie visible, sans action ; un allié qui ne mène pas de camp ne peut pas raconter
  const visiteur = await openAs(browser, null);
  await visiteur.page.goto(`/guerre/${guerreId}`);
  await expect(main(visiteur.page).getByRole("list", { name: "Chronologie" })).toContainText(bataille);
  await expect(main(visiteur.page).getByRole("button", { name: "Raconter" })).toHaveCount(0);
  await visiteur.context.close();
  await expect(apiPost(`/guerres/${guerreId}/evenements`, sessions.allie.token, { title: "Exploit" })).rejects.toThrow(/403/);
});

test("un chef de camp trace une zone de conflit, affichée sur la fiche de la guerre", async ({ browser }) => {
  const dimension = (await apiGet("/cartographie/dimensions/read")).find((item) => item.link);
  expect(dimension, "une dimension avec un lien de carte est nécessaire").toBeTruthy();
  const zone = { title: "Front du Gué", type: "guerre", type_id: guerreId, dimension_id: dimension.id, shape_type: "Polygon", coordinates: "[[-100,50],[-100,80],[-130,80]]", color: "#dc2626" };
  await expect(apiPost("/cartographie/create", sessions.allie.token, zone)).rejects.toThrow(/403/);
  await apiPost("/cartographie/create", sessions.attaquant.token, zone);

  const { context, page } = await openAs(browser, sessions.attaquant);
  await page.goto(`/guerre/${guerreId}`);
  await expect(main(page).getByRole("button", { name: "Tracer" })).toBeVisible();
  await expect(main(page).getByText("1 zone de conflit tracée")).toBeVisible();
  await expect(main(page).locator(`iframe[title="Zones de conflit de ${titles.guerre}"]`)).toHaveAttribute("src", /-embedfull-guerres#x=50&z=100/);
  await context.close();

  // La chronologie et la carte tiennent sur un écran de téléphone
  const mobile = await browser.newContext({ locale: "fr-FR", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await blockExternalRequests(mobile);
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`/guerre/${guerreId}`);
  await expect(main(mobilePage).getByRole("list", { name: "Chronologie" })).toBeVisible();
  await mobilePage.waitForTimeout(800);
  expect(await mobilePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await mobile.close();
});

test("un modérateur termine la guerre, qui est archivée", async ({ browser }) => {
  const { context, page } = await openAs(browser, sessions.moderateur);
  await page.goto(`/guerre/${guerreId}`);
  await main(page).getByRole("button", { name: "Terminer la guerre" }).click();
  await page.locator("dialog[open] select[name='issue']").selectOption("Paix blanche");
  await page.locator("dialog[open] button[type='submit']").click();
  expect(await readAlert(page)).toMatch(/terminée/i);
  await expect(main(page).locator(".badge", { hasText: "Terminée" })).toBeVisible();
  await expect(main(page).getByText("Issue : Paix blanche")).toBeVisible();
  await expect(main(page).getByRole("list", { name: "Chronologie" })).toContainText("Fin de la guerre : Paix blanche");
  await context.close();
  expect(readAnnouncements().some((annonce) => annonce.content.includes(`${titles.guerre}** est terminée : Paix blanche`))).toBe(true);
});

test("déclarer une guerre de religion", async ({ browser }) => {
  const { context, page } = await openAs(browser, sessions.defenseur);
  await page.goto("/guerres");
  await page.locator('button[data-tip="Déclarer une guerre"]').click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('input[name="title"]').fill(titles.religion);
  await dialog.getByText("Guerre de religion", { exact: true }).click();
  await dialog.locator('select[name="attaquant_id"]').selectOption({ label: titles.cultes[1] });
  await dialog.locator('select[name="defenseur_id"]').selectOption({ label: titles.cultes[0] });
  await dialog.locator('textarea[name="casus_belli"]').fill("Hérésie lunaire");
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/validation/i);

  await page.waitForURL(/\/guerre\/\d+$/);
  await expect(main(page).getByText("Guerre de religion").first()).toBeVisible();
  const attaquants = main(page).getByRole("region", { name: "Attaquants" });
  await expect(attaquants.locator("li", { hasText: titles.cultes[1] }).locator(".badge", { hasText: "Religion" })).toBeVisible();
  await context.close();
});
