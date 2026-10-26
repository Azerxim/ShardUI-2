import { test, expect } from "@playwright/test";
import { apiGet, apiPost, blockExternalRequests, createSession, signIn, uniqueSuffix } from "./helpers.js";

// Aides et utilitaires : guides, commandes et outils (Nether, tetras, distance entre villes, fiche Discord).
test.describe.configure({ mode: "serial" });

let joueur;
const suffixe = uniqueSuffix();

test.beforeAll(async () => {
  joueur = await createSession("aide");
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  const dimensionId = dimension?.id ?? 1;
  const civilisationId = (await apiPost("/civilisations/create", joueur.token, { title: `Comté ${suffixe}`, is_public: true })).civilisation.id;
  const ville = (title, x, z, is_public = true) => apiPost("/civilisations/villes/create", joueur.token, { title, civilisation_id: civilisationId, dimension_id: dimensionId, x, z, is_public });
  await ville(`Aval ${suffixe}`, 0, 0);
  await ville(`Amont ${suffixe}`, 3000, 4000);
  await ville(`Repaire ${suffixe}`, 100, 100, false);
  await apiPost("/personnages/create", joueur.token, { name: `Héraut ${suffixe}`, grade: "Messager", description: "Né sous la neige.\nParti au loin.", date_naissance: "0400-01-01" });
});

const main = (page) => page.locator("main.container");

test("la page range guides, commandes et outils en onglets, et se trouve depuis le menu", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/aides");
  await expect(page).toHaveTitle("Aides et utilitaires - Tetrago");
  const guides = main(page).getByRole("tabpanel", { name: "Guides" });
  await expect(guides).toContainText("Rejoindre le serveur");
  await expect(main(page).getByRole("link", { name: /Profil/ }).first()).toHaveAttribute("href", "/profil");

  // Un onglet à la fois, repris dans l'adresse
  await main(page).getByRole("tab", { name: "Commandes" }).click();
  await expect(main(page).getByRole("tabpanel", { name: "Commandes" })).toContainText("/sethome <nom>");
  await expect(guides).toBeHidden();
  await expect(page).toHaveURL(/\/aides#commandes$/);
  // Flèches du clavier d'un onglet à l'autre
  await page.keyboard.press("ArrowRight");
  await expect(main(page).getByRole("tab", { name: "Outils" })).toBeFocused();
  await expect(main(page).getByRole("tab", { name: "Outils" })).toHaveAttribute("aria-selected", "true");

  // Sans ancre dans l'adresse, la page revient au dernier onglet ouvert
  await page.goto("/aides");
  await expect(main(page).getByRole("tab", { name: "Outils" })).toHaveAttribute("aria-selected", "true");

  // Une ancre intérieure ouvre son onglet : le lien du guide vers la fiche Discord
  await main(page).getByRole("tab", { name: "Guides" }).click();
  await guides.getByRole("link", { name: /Fiche Discord/ }).click();
  await expect(page.locator("#fiche-discord")).toBeVisible();
  await expect(page.locator(".navbar").getByRole("link", { name: "Aides et utilitaires" })).toHaveAttribute("aria-current", "page");
});

test("les coordonnées passent de la surface au Nether, et inversement", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/aides#outils");
  const outil = page.locator("#nether");
  const surface = outil.getByRole("group", { name: "Surface" });
  const nether = outil.getByRole("group", { name: "Nether" });
  await surface.getByLabel("X").fill("-1000");
  await surface.getByLabel("Z").fill("805");
  await expect(nether.getByLabel("X")).toHaveValue("-125");
  await expect(nether.getByLabel("Z")).toHaveValue("100");
  await nether.getByLabel("X").fill("12");
  await expect(surface.getByLabel("X")).toHaveValue("96");
});

test("un montant en tetras se répartit en blocs et diamants", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/aides#outils");
  const outil = page.locator("#tetras");
  await outil.getByLabel("Montant en tetras").fill("100");
  await expect(outil.getByLabel("Blocs de diamant")).toHaveValue("11");
  await expect(outil.getByLabel("Diamants", { exact: true })).toHaveValue("1");
  await expect(outil).toContainText("100 tetras = 11 blocs de diamant et 1 diamant");
  await outil.getByLabel("Blocs de diamant").fill("2");
  await expect(outil.getByLabel("Montant en tetras")).toHaveValue("19");
});

test("la distance entre deux villes publiques donne les temps de trajet", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/aides#outils");
  const outil = page.locator("#distance");
  const depart = outil.getByRole("combobox", { name: "Départ" });
  await expect(depart.locator("option", { hasText: `Aval ${suffixe}` })).toHaveCount(1);
  // Une ville privée ne figure pas dans la liste
  await expect(depart.locator("option", { hasText: `Repaire ${suffixe}` })).toHaveCount(0);
  await depart.selectOption({ label: `Aval ${suffixe}` });
  await outil.getByRole("combobox", { name: "Arrivée" }).selectOption({ label: `Amont ${suffixe}` });
  await expect(outil).toContainText("5 000 blocs à vol d'oiseau");
  await expect(outil.locator("li", { hasText: "À pied" })).toContainText("19 min 23 s");
  // Temps RP : 50 km à l'échelle du récit, à 4,3 blocs par seconde, un jour RP par jour de Minecraft
  await expect(outil.locator("li", { hasText: "À pied" })).toContainText("RP : 9 jours 17 h");
  await outil.getByLabel(/Passer par le Nether/).check();
  await expect(outil).toContainText("soit 625 blocs dans le Nether");

  // Des coordonnées saisies à la main
  await depart.selectOption({ label: "Coordonnées saisies" });
  await outil.getByRole("group", { name: "Départ" }).getByLabel("X").fill("3000");
  await outil.getByRole("group", { name: "Départ" }).getByLabel("Z").fill("3900");
  await expect(outil).toContainText("100 blocs à vol d'oiseau");
});

test("la fiche Discord d'un personnage est prête à copier", async ({ page, context }) => {
  await blockExternalRequests(page);
  await page.goto("/aides#fiche-discord");
  await expect(page.locator("#fiche-discord")).toContainText("Connectez-vous pour copier la fiche de vos personnages.");

  await signIn(context, joueur);
  // Même page, seule l'ancre changerait : on recharge pour que la session soit lue
  await page.reload();
  const apercu = page.locator("#fiche-discord").getByLabel("Aperçu de la fiche");
  await expect(apercu).toContainText(`## Héraut ${suffixe}`);
  await expect(apercu).toContainText("*Messager");
  await expect(apercu).toContainText("**Naissance** : 1er janvier de l'an 400");
  await expect(apercu).toContainText("> Né sous la neige.\n> Parti au loin.");
  await expect(apercu).toContainText(/\/personnage\/\d+$/);
});
