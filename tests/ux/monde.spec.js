import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, linkPlatform, makeAdmin, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Statistiques du monde : envoi d'un relevé par le générateur de cartes, puis page d'administration
test.describe.configure({ mode: "serial" });

const CLE = "cle-du-generateur-de-test";
const suffix = uniqueSuffix();
const uuidMinecraft = "46f714610000" + suffix.padEnd(20, "0").slice(0, 20);
// Joueur sans compte sur le site : son pseudo vient de playerdb.co (simulé par fake-discord.mjs)
const uuidInconnu = `a2fa9948-7321-4ff9-b34a-${suffix.padEnd(12, "0").slice(0, 12)}`;
const pseudoAttendu = `Joueur_${uuidInconnu.replaceAll("-", "").slice(0, 6)}`;
// UUID commençant par 0 : playerdb.co ne le connaît pas, il reste affiché en UUID
const uuidIntrouvable = "00000000-1111-2222-3333-444444444444";
let admin;
let joueur;
let ville;

async function envoyerReleve(releve, cle = CLE) {
  return fetch(`${API_URL}/monde/releves`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cle ? { "X-Monde-Key": cle } : {}) },
    body: JSON.stringify(releve),
  });
}

function releve({ heures = 5760, population = 42, actif = true } = {}) {
  return {
    world_name: `Monde ${suffix}`,
    world_version: "1.21.4",
    duration_seconds: 70.8,
    seuil_heures_lit: 10,
    seuil_jours_actif: 30,
    seuil_heures_actif: 1,
    taille_tuile: 256,
    dimensions: [{ source: "", title: "Tetrago", chunks: 280964, chunks_actifs: 5000, heures_presence: 210747, lits: 3887, lits_actifs: 527, villageois: 2419, entites: 65158 }],
    lieux: [{ entity_type: "ville", entity_id: ville, title: `Eterstone ${suffix}`, source: "", methode: "rayon", rayon: 128, population, lits: 48, lits_actifs: population, heures_presence: heures, villageois: 71, joueurs_presents: 5, joueurs_residents: 2 }],
    zones: [{ source: "", x: 1024, z: 0, taille: 256, heures_presence: 41932, lits: 11, villageois: 28, joueurs: 3, lieu_type: "ville", lieu_id: ville, lieu_title: `Eterstone ${suffix}`, lieu_distance: 707 }],
    joueurs: [
      {
        uuid: uuidMinecraft, heures_jeu: 988.55, morts: 116, monstres_tues: 8663, distance_km: 11901.35,
        niveau: 63, is_actif: actif, derniere_activite: new Date().toISOString(),
        lieu_type: "ville", lieu_id: ville, lieu_title: `Eterstone ${suffix}`,
      },
      { uuid: uuidInconnu, heures_jeu: 120.5, is_actif: true, derniere_activite: new Date().toISOString() },
      { uuid: uuidIntrouvable, heures_jeu: 3.5, is_actif: false, derniere_activite: new Date().toISOString() },
    ],
  };
}

test.beforeAll(async () => {
  admin = await createSession("monde");
  makeAdmin(admin.account.username);
  admin.user = await apiGet(`/users/id/${admin.user.id}`);

  joueur = await createSession("mineur");
  linkPlatform(joueur.user.id, "microsoft", uuidMinecraft);

  const civilisation = await apiPost("/civilisations/create", admin.token, { title: `Royaume ${suffix}`, is_public: true });
  const civilisationId = civilisation.civilisation?.id ?? civilisation.id;
  const dimensions = await apiGet("/cartographie/dimensions/read");
  const dimensionId = dimensions[0]?.id
    ?? (await apiPost("/cartographie/dimensions/create", admin.token, { title: `Monde ${suffix}`, link: "tetrago" })).dimension.id;
  const creee = await apiPost("/civilisations/villes/create", admin.token, {
    title: `Eterstone ${suffix}`, civilisation_id: civilisationId, dimension_id: dimensionId,
    is_public: true, population: 12, x: 410, z: -560,
  });
  ville = creee.ville?.id ?? creee.id;
});

test("le générateur de cartes envoie un relevé, refusé sans la clé", async () => {
  expect((await envoyerReleve(releve(), null)).status).toBe(401);
  expect((await envoyerReleve(releve(), "mauvaise-cle")).status).toBe(401);

  const envoi = await envoyerReleve(releve());
  expect(envoi.ok).toBe(true);
  const { releve: enregistre, populations } = await envoi.json();
  // Les totaux sont recalculés à partir du détail envoyé
  expect(enregistre.lits).toBe(3887);
  expect(enregistre.joueurs).toBe(3);
  expect(enregistre.joueurs_actifs).toBe(2);

  // La population mesurée remplace celle de la ville (12 à la création)
  expect(populations).toEqual({ villes: 1, quartiers: 0 });
  expect((await apiGet(`/civilisations/villes/id/${ville}`)).ville.population).toBe(42);
});

test("les statistiques sont réservées aux administrateurs", async ({ browser }) => {
  const reponse = await fetch(`${API_URL}/monde/resume`, { headers: { Authorization: `Bearer ${joueur.token}` } });
  expect(reponse.status).toBe(403);

  const context = await browser.newContext({ locale: "fr-FR" });
  await blockExternalRequests(context);
  await signIn(context, joueur);
  const page = await context.newPage();
  await page.goto("/admin/monde");
  await expect(page.getByText("Vous n'avez pas les droits nécessaires pour accéder à cette page.")).toBeVisible();
  await context.close();
});

test("la page d'administration présente le monde, les lieux, les zones et les joueurs", async ({ browser }) => {
  const context = await browser.newContext({ locale: "fr-FR" });
  await blockExternalRequests(context);
  await signIn(context, admin);
  const page = await context.newPage();
  await page.goto("/admin/monde");
  const main = page.locator("main.container");

  await expect(main.locator("h1")).toContainText("Statistiques du monde");
  await expect(main.getByText(`Monde ${suffix}`)).toBeVisible();
  await expect(main.getByText("210 747 h").first()).toBeVisible();

  // Ville : population mesurée, population déclarée et mesure au rayon signalée
  const ligneVille = main.locator("tr", { hasText: `Eterstone ${suffix}` }).first();
  await expect(ligneVille).toContainText("42");
  await expect(ligneVille).toContainText("12");  // population du site avant le relevé

  await expect(ligneVille.locator(".badge", { hasText: "rayon" })).toBeVisible();

  // Zone fréquentée loin de la ville la plus proche
  const ligneZone = main.locator("tr", { hasText: "1024, 0" });
  await expect(ligneZone).toContainText("41 932 h");
  await expect(ligneZone).toContainText("707 blocs");

  // Joueur sans compte sur le site : pseudo retrouvé sur playerdb.co après l'envoi du relevé
  await expect(main.getByText(pseudoAttendu)).toBeVisible();
  // Joueur inconnu de playerdb.co : son UUID reste affiché, et le bouton propose de réessayer
  await expect(main.locator(`[title="${uuidIntrouvable}"]`)).toHaveText(uuidIntrouvable.slice(0, 8));
  const bouton = main.getByRole("button", { name: /Retrouver 1 pseudo/ });
  await expect(bouton).toBeVisible();
  await bouton.click();
  expect(await readAlert(page)).toContain("Aucun pseudo supplémentaire trouvé");

  // Joueur actif, relié à son compte du site par l'UUID Minecraft
  const ligneJoueur = main.locator("tr", { hasText: joueur.account.full_name });
  await expect(ligneJoueur).toContainText("989 h");
  await expect(ligneJoueur.locator(".badge", { hasText: "actif" })).toBeVisible();
  await expect(ligneJoueur.getByRole("link", { name: joueur.account.full_name })).toBeVisible();
  await context.close();
});

test("un nouveau relevé s'ajoute à l'historique, avec son évolution", async ({ browser }) => {
  const envoi = await envoyerReleve(releve({ heures: 6000, population: 45, actif: false }));
  expect(envoi.ok).toBe(true);

  const context = await browser.newContext({ locale: "fr-FR" });
  await blockExternalRequests(context);
  await signIn(context, admin);
  const page = await context.newPage();
  await page.goto("/admin/monde");
  const main = page.locator("main.container");

  await expect(main.getByText("Depuis le relevé du")).toBeVisible();
  await expect(main.locator("tr", { hasText: `Eterstone ${suffix}` }).first()).toContainText("45");
  expect((await apiGet(`/civilisations/villes/id/${ville}`)).ville.population).toBe(45);

  // Le relevé précédent reste consultable (la base de test peut en contenir d'autres, plus anciens)
  const releves = main.locator("select");
  await expect(releves.locator("option").first()).toBeAttached();
  await releves.selectOption({ index: 1 });
  await expect(main.locator("tr", { hasText: `Eterstone ${suffix}` }).first()).toContainText("42");
  await context.close();
});
