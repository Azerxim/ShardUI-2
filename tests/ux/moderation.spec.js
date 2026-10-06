import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, makeModerateur, signIn, uniqueSuffix } from "./helpers.js";

// Tableau de bord des modérateurs RP : ce qui attend une décision (guerres, population, fermes, pièges), le suivi et
// l'historique ; un piège déclaré au dépôt ne tue qu'une fois validé après sa révélation.
test.describe.configure({ mode: "serial" });

const suffixe = uniqueSuffix();
let joueur;
let moderateur;
let guerre;
let piege;

const apiPut = async (path, token, body = {}) => {
  const response = await fetch(`${API_URL}${path}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`PUT ${path} : ${response.status}`);
  return response.json();
};
const main = (page) => page.locator("main.container");

test.beforeAll(async () => {
  joueur = await createSession("seigneur");
  const voisin = await createSession("voisin");
  moderateur = await createSession("arbitrerp");
  makeModerateur(moderateur.account.username);
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  const civ = async (session, nom) => (await apiPost("/civilisations/create", session.token, { title: `${nom} ${suffixe}`, is_public: true })).civilisation.id;
  const nord = await civ(joueur, "Marche");
  const sud = await civ(voisin, "Comté");
  guerre = (await apiPost("/guerres/declarer", joueur.token, { title: `Guerre du tableau ${suffixe}`, attaquant_id: nord, defenseur_id: sud, casus_belli: "Un pont disputé" })).guerre;
  await apiPost("/fermes/create", joueur.token, { title: `Moulin ${suffixe}`, type: "cultures", justification: "Le village moud son grain", dimension_id: dimension?.id ?? 1, x: 10, z: 20 });
  piege = (await apiPost("/actions/create", joueur.token, { title: `Fosse ${suffixe}`, content: "Une fosse garnie de pieux sur le chemin du gué", entity_type: "civilisation", entity_id: nord, piege: true })).action;
  await apiPost(`/actions/${piege.id}/reveler`, joueur.token, {});
});

test("un joueur ordinaire n'accède pas au tableau de bord", async ({ page, context }) => {
  await expect(fetch(`${API_URL}/moderation/tableau`, { headers: { Authorization: `Bearer ${joueur.token}` } }).then((r) => r.status)).resolves.toBe(403);
  await blockExternalRequests(page);
  await signIn(context, joueur);
  await page.goto("/moderation");
  await expect(page.getByText("Le tableau de bord est réservé aux modérateurs RP et aux administrateurs.")).toBeVisible();
});

test("le modérateur valide une guerre et juge un piège depuis le tableau de bord", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, moderateur);
  await page.goto("/moderation");
  const guerres = main(page).locator("#guerres");
  await expect(guerres).toContainText(`Guerre du tableau ${suffixe}`);
  await expect(main(page).locator("#fermes")).toContainText(`Moulin ${suffixe}`);
  const pieges = main(page).locator("#pieges");
  await expect(pieges).toContainText(`Fosse ${suffixe}`);

  // Guerre : validation avec une note
  await guerres.getByRole("listitem").filter({ hasText: `Guerre du tableau ${suffixe}` }).getByRole("button", { name: "Valider" }).click();
  await page.locator('dialog[open] textarea[name="note"]').fill("Enjeu : le pont");
  await page.locator('dialog[open] button[type="submit"]').click();
  await expect(page.locator(".swal2-popup.swal2-icon-success")).toContainText("La guerre est déclarée et commence");
  await page.locator(".swal2-confirm").click();
  await expect(guerres).not.toContainText(`Guerre du tableau ${suffixe}`);
  await expect(main(page).locator("#suivi-guerres")).toContainText(`Guerre du tableau ${suffixe}`);

  // Piège : une blessure demande un motif
  await pieges.getByRole("listitem").filter({ hasText: `Fosse ${suffixe}` }).getByRole("button", { name: "Simple blessure" }).click();
  await page.locator('dialog[open] textarea[name="note"]').fill("La victime n'est jamais passée par le gué");
  await page.locator('dialog[open] button[type="submit"]').click();
  await expect(page.locator(".swal2-popup.swal2-icon-success")).toContainText("Le piège a été jugé");
  await page.locator(".swal2-confirm").click();
  await expect(pieges).not.toContainText(`Fosse ${suffixe}`);

  // Historique, filtrable par rubrique
  const historique = main(page).locator("#historique");
  await historique.getByRole("button", { name: "Actions secrètes" }).click();
  await expect(historique.getByRole("list", { name: "Décisions" }).getByRole("listitem").first()).toContainText("Piège réduit à une blessure");
  await expect(historique).toContainText("La victime n'est jamais passée par le gué");
  await historique.getByRole("button", { name: "Guerres" }).click();
  await expect(historique).toContainText(`Guerre du tableau ${suffixe}`);

  // Sur la page des actions secrètes, le verdict accompagne l'action révélée
  const action = (await apiGet(`/actions/read/${piege.id}`)).action;
  expect(action).toMatchObject({ piege: true, piege_verdict: "blessure" });
  await expect(apiPut(`/actions/${piege.id}/piege`, moderateur.token, { mortel: true })).rejects.toThrow(/400/);
});

test("l'accueil du modérateur renvoie au tableau de bord", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, moderateur);
  await page.goto("/");
  const alerte = main(page).getByRole("alert").filter({ hasText: "la modération RP" });
  await expect(alerte).toContainText(/ferme/);
  await expect(alerte.getByRole("link", { name: "Tableau de bord" })).toHaveAttribute("href", "/moderation");
});
