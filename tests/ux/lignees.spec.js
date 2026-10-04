import { test, expect } from "@playwright/test";
import { API_URL, apiPost, blockExternalRequests, createSession, readAlert, readAnnouncements, signIn, uniqueSuffix } from "./helpers.js";

// Lignées et généalogie : liens de parenté depuis la fiche d'un personnage (accord de l'autre joueur quand le personnage
// n'est pas le sien), maisons nobles avec leur arbre, entrée des mariages et fondations datés dans les chroniques, et
// leur annonce sur Discord (salon « lignees », simulé par l'API de test).
test.describe.configure({ mode: "serial" });

let roiJoueur;
let reineJoueur;
let roi;
let prince;
let reine;
const suffixe = uniqueSuffix();
const nom = (prenom) => `${prenom} ${suffixe}`;

const apiStatus = async (method, path, token, body) => {
  const response = await fetch(`${API_URL}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  return response.status;
};

test.beforeAll(async () => {
  roiJoueur = await createSession("souverain");
  reineJoueur = await createSession("souveraine");
  roi = (await apiPost("/personnages/create", roiJoueur.token, { name: nom("Aldric"), date_naissance: "0400-01-01" })).personnage;
  prince = (await apiPost("/personnages/create", roiJoueur.token, { name: nom("Edmond"), date_naissance: "0420-05-05" })).personnage;
  reine = (await apiPost("/personnages/create", reineJoueur.token, { name: nom("Ysolde"), date_naissance: "0402-02-02" })).personnage;
});

const main = (page) => page.locator("main.container");

test("on ne lie que ses personnages, et on ne désigne que ses propres héritiers", async () => {
  const tiers = await createSession("intrus");
  expect(await apiStatus("POST", "/lignees/liens", tiers.token, { type: "parent", source_id: roi.id, cible_id: prince.id })).toBe(403);
  expect(await apiStatus("POST", "/lignees/liens", reineJoueur.token, { type: "heritier", source_id: roi.id, cible_id: reine.id })).toBe(403);
  expect(await apiStatus("POST", "/lignees/liens", roiJoueur.token, { type: "parent", source_id: roi.id, cible_id: roi.id })).toBe(400);
});

test("entre ses propres personnages, le lien est établi aussitôt", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, roiJoueur);
  await page.goto(`/personnage/${roi.id}`);
  await main(page).getByRole("button", { name: "Lier", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('select[name="relation"]').selectOption("enfant");
  await dialog.locator('select[name="autre"]').selectOption(String(prince.id));
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/lien de parenté est établi/);
  const famille = main(page).locator("#famille");
  await expect(famille.locator("li", { hasText: nom("Edmond") })).toContainText("420");
  // Une boucle est refusée : l'enfant ne peut pas devenir le parent de son parent
  expect(await apiStatus("POST", "/lignees/liens", roiJoueur.token, { type: "parent", source_id: prince.id, cible_id: roi.id })).toBe(400);
});

test("vers le personnage d'un autre joueur, le lien devient une demande", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, roiJoueur);
  await page.goto(`/personnage/${roi.id}`);
  await main(page).getByRole("button", { name: "Lier", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('select[name="relation"]').selectOption("conjoint");
  await dialog.locator('select[name="autre"]').selectOption(String(reine.id));
  await dialog.locator('input[name="date_rp"]').fill("0419-06-21");
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/demande est envoyée/);
  await expect(main(page).getByRole("region", { name: "Demandes de parenté" })).toContainText("en attente de l'accord");
  await expect(main(page).locator("#famille li", { hasText: nom("Ysolde") })).toHaveCount(0);
  // Rien n'est annoncé tant que l'autre joueur n'a pas accepté
  expect(readAnnouncements().some((a) => a.channel === "lignees" && a.content.includes(nom("Ysolde")))).toBe(false);
});

test("l'autre joueur trouve la demande sur la page des personnages et l'accepte", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, reineJoueur);
  await page.goto("/personnages");
  const demandes = main(page).getByRole("region", { name: "Demandes de parenté" });
  await expect(demandes).toContainText(`${nom("Aldric")} et ${nom("Ysolde")}, conjoints`);
  await demandes.getByRole("button", { name: "Accepter" }).click();
  expect(await readAlert(page)).toMatch(/lien de parenté est établi/);
  await expect(demandes).toHaveCount(0);
  const annonce = readAnnouncements().find((a) => a.channel === "lignees" && a.content.includes(nom("Ysolde")));
  expect(annonce?.content).toContain(`Mariage de **${nom("Aldric")}** et **${nom("Ysolde")}**, le 21 juin de l'an 419.`);
  expect(annonce?.content).toMatch(new RegExp(`/personnage/${roi.id}#famille$`));
});

test("le mariage accepté figure sur la fiche, avec sa date RP", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto(`/personnage/${roi.id}`);
  await expect(main(page).locator("#famille li", { hasText: nom("Ysolde") })).toContainText("marié le 21 juin de l'an 419");
});

test("une maison fondée dessine l'arbre de sa lignée", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, roiJoueur);
  await page.goto("/maisons");
  await main(page).getByRole("button", { name: "Fonder une maison" }).first().click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('input[name="title"]').fill(`Orval ${suffixe}`);
  await dialog.locator('select[name="chef_id"]').selectOption(String(roi.id));
  await dialog.locator('input[name="devise"]').fill("Plutôt rompre que plier");
  await dialog.locator('input[name="date_fondation"]').fill("0398-03-01");
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/maison est fondée/);
  await expect(page).toHaveURL(/\/maison\/\d+$/);
  await expect(main(page)).toContainText("« Plutôt rompre que plier »");
  const fondation = readAnnouncements().find((a) => a.channel === "lignees" && a.content.includes(`Orval ${suffixe}`));
  expect(fondation?.content).toContain(`Fondation de la maison Orval ${suffixe}, sous la conduite de **${nom("Aldric")}**, le 1er mars de l'an 398. Devise : « Plutôt rompre que plier ».`);

  // Le prince entre dans la maison : il apparaît sous ses parents, la reine à côté du roi, en alliée
  await main(page).getByRole("button", { name: "Faire entrer" }).click();
  await page.locator(".swal2-select").selectOption({ label: nom("Edmond") });
  await page.locator(".swal2-confirm").click();
  await page.locator(".swal2-popup", { hasText: "entre dans la maison" }).waitFor();
  await readAlert(page);
  const arbre = main(page).getByRole("list", { name: "Arbre de la maison" });
  const branche = arbre.locator(":scope > li").filter({ hasText: nom("Aldric") });
  await expect(branche).toContainText(nom("Ysolde"));
  await expect(branche).toContainText("allié");
  await expect(branche.locator("ul li", { hasText: nom("Edmond") })).toHaveCount(1);
  await expect(main(page).getByRole("heading", { name: "Membres (2)" })).toBeVisible();
});

test("les fondations de maisons et les mariages datés entrent dans les chroniques", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/chroniques");
  await expect(main(page).locator("li", { hasText: `Mariage : ${nom("Aldric")} et ${nom("Ysolde")}` })).toContainText("21 juin de l'an 419");
  await expect(main(page).locator("li", { hasText: `Fondation : maison Orval ${suffixe}` })).toContainText("1er mars de l'an 398");
  await expect(main(page).locator("li", { hasText: `Naissance : ${nom("Edmond")}` })).toContainText("Maison Orval");
});
