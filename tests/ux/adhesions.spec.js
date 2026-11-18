import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, signIn, uniqueSuffix } from "./helpers.js";

// Demandes d'adhésion à une civilisation (Shard-API crud_adhesions) : un joueur demande depuis la fiche, le Fondateur
// accepte ou refuse ; seul un membre installe un personnage dans la civilisation et ses villes.
test.describe.configure({ mode: "serial" });

const suffixe = uniqueSuffix();
let fondateur;
let candidat;
let civilisationId;
let villeId;

const api = async (method, path, token, body) => {
  const response = await fetch(`${API_URL}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json().catch(() => ({})) };
};
const main = (page) => page.locator("main.container");

test.beforeAll(async () => {
  fondateur = await createSession("seigneur");
  candidat = await createSession("candidat");
  civilisationId = (await apiPost("/civilisations/create", fondateur.token, { title: `Marche ${suffixe}`, is_public: true })).civilisation.id;
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  const ville = await apiPost("/civilisations/villes/create", fondateur.token, { title: `Bastide ${suffixe}`, civilisation_id: civilisationId, dimension_id: dimension?.id ?? 1, x: 0, z: 0, is_public: true });
  villeId = ville.id ?? ville.ville?.id;
});

test("un non-membre ne peut pas installer de personnage dans la civilisation ni dans ses villes", async ({ page, context }) => {
  for (const residence of [{ civilisation_id: civilisationId }, { ville_id: villeId }]) {
    const { status, data } = await api("POST", "/personnages/create", candidat.token, { name: `Intrus ${suffixe}`, ...residence });
    expect(status).toBe(403);
    expect(data.detail).toContain("dont vous êtes membre");
  }
  // Sans résidence, rien ne l'empêche ; il ne peut pas non plus l'y déplacer ensuite
  const { personnage } = await apiPost("/personnages/create", candidat.token, { name: `Voyageur ${suffixe}` });
  expect((await api("PUT", `/personnages/update/${personnage.id}`, candidat.token, { ville_id: villeId })).status).toBe(403);

  // Sur la fiche : pas de bouton « Créer » parmi les habitants, mais la demande d'adhésion
  await blockExternalRequests(page);
  await signIn(context, candidat);
  await page.goto(`/civilisation/${civilisationId}`);
  await expect(main(page).getByRole("button", { name: "Demander à rejoindre" })).toBeVisible();
  await expect(main(page).getByRole("button", { name: "Créer", exact: true })).toHaveCount(0);
});

test("le joueur demande à rejoindre, peut retirer sa demande, puis la renvoie", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, candidat);
  await page.goto(`/civilisation/${civilisationId}`);
  await main(page).getByRole("button", { name: "Demander à rejoindre" }).click();
  await main(page).getByLabel("Un mot pour vous présenter (facultatif)").fill("Forgeron venu du nord.");
  await main(page).getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(main(page)).toContainText("Votre demande pour rejoindre cette civilisation attend la réponse");
  // Une seule demande en attente à la fois
  expect((await api("POST", `/civilisations/demandes/${civilisationId}`, candidat.token, {})).status).toBe(400);

  // La demande reste affichée après rechargement, et se retire
  await page.reload();
  await main(page).getByRole("button", { name: "Retirer ma demande" }).click();
  await expect(main(page).getByRole("button", { name: "Demander à rejoindre" })).toBeVisible();
  expect((await api("GET", `/civilisations/demandes/${civilisationId}/list`, fondateur.token)).data).toEqual([]);

  await main(page).getByRole("button", { name: "Demander à rejoindre" }).click();
  await main(page).getByLabel("Un mot pour vous présenter (facultatif)").fill("Forgeron venu du nord.");
  await main(page).getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(main(page)).toContainText("attend la réponse");

  // Le Fondateur est notifié ; un autre joueur ne voit pas les demandes
  const { notifications } = (await api("GET", "/notifications/mine", fondateur.token)).data;
  expect(notifications[0]).toMatchObject({ type: "invitation", title: `${candidat.user.username} demande à rejoindre Marche ${suffixe}`, link: `/civilisation/${civilisationId}#demandes-adhesion` });
  expect((await api("GET", `/civilisations/demandes/${civilisationId}/list`, candidat.token)).status).toBe(403);
});

test("le Fondateur accepte la demande : le joueur devient membre et peut y installer ses personnages", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, fondateur);
  await page.goto(`/civilisation/${civilisationId}`);
  const demandes = main(page).locator("#demandes-adhesion");
  await expect(demandes).toContainText("Demandes d'adhésion (1)");
  await expect(demandes).toContainText("Forgeron venu du nord.");
  await demandes.getByRole("button", { name: "Accepter" }).click();
  await expect(demandes).toHaveCount(0);
  // Le nouveau membre apparaît aussitôt dans la liste (nom affiché, lien vers son profil)
  await expect(main(page).locator(`a[href="/profil/${candidat.user.id}"]`, { hasText: "Membre" })).toBeVisible();

  const { notifications } = (await api("GET", "/notifications/mine", candidat.token)).data;
  expect(notifications[0]).toMatchObject({ type: "decision", title: `Bienvenue dans Marche ${suffixe}` });
  const { status, data } = await api("POST", "/personnages/create", candidat.token, { name: `Forgeron ${suffixe}`, ville_id: villeId });
  expect(status).toBe(200);
  expect(data.personnage).toMatchObject({ civilisation_id: civilisationId, ville_id: villeId });
  // Déjà membre : plus de nouvelle demande
  expect((await api("POST", `/civilisations/demandes/${civilisationId}`, candidat.token, {})).status).toBe(400);
});
