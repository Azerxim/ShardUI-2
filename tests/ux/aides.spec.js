import { test, expect } from "@playwright/test";
import { apiGet, apiPost, blockExternalRequests, createSession, signIn, uniqueSuffix } from "./helpers.js";

// Aides et utilitaires : guides et commandes (/aides), et page des outils (/outils : accueil, candidature, Nether,
// tetras, distance entre villes, fiche Discord, monde téléchargeable).
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

test("la page des aides range guides et commandes en onglets, et se trouve depuis le menu", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/aides");
  await expect(page).toHaveTitle("Aides et utilitaires - Tetrago");
  const guides = main(page).getByRole("tabpanel", { name: "Guides" });
  await expect(guides).toContainText("Rejoindre le serveur");
  await expect(main(page).getByRole("link", { name: /Profil/ }).first()).toHaveAttribute("href", "/profil");
  // Les outils ont quitté la page : plus d'onglet Outils
  await expect(main(page).getByRole("tab")).toHaveCount(2);

  // Un onglet à la fois, repris dans l'adresse
  await main(page).getByRole("tab", { name: "Commandes" }).click();
  await expect(main(page).getByRole("tabpanel", { name: "Commandes" })).toContainText("/sethome <nom>");
  await expect(guides).toBeHidden();
  await expect(page).toHaveURL(/\/aides#commandes$/);
  // Flèches du clavier d'un onglet à l'autre
  await page.keyboard.press("ArrowLeft");
  await expect(main(page).getByRole("tab", { name: "Guides" })).toBeFocused();
  await expect(main(page).getByRole("tab", { name: "Guides" })).toHaveAttribute("aria-selected", "true");
  await main(page).getByRole("tab", { name: "Commandes" }).click();

  // Sans ancre dans l'adresse, la page revient au dernier onglet ouvert
  await page.goto("/aides");
  await expect(main(page).getByRole("tab", { name: "Commandes" })).toHaveAttribute("aria-selected", "true");
  // Plus de bouton « ? » : les aides sont dans le menu « Infos », marqué sur leur page
  await expect(page.locator(".navbar").getByRole("link", { name: "Aides et utilitaires" })).toHaveCount(0);
  await expect(page.locator(".navbar").getByRole("navigation", { name: "Sections" }).getByRole("button", { name: "Infos" })).toHaveClass(/bg-secondary/);

  // Le lien d'un guide vers un outil mène à la page des outils
  await main(page).getByRole("tab", { name: "Guides" }).click();
  await guides.getByRole("link", { name: /Fiche Discord/ }).click();
  await expect(page).toHaveURL(/\/outils#fiche-discord$/);
  await expect(page.locator("#fiche-discord")).toBeVisible();
});

test("les outils ont leur page, dans le menu, et les anciens liens des aides y mènent", async ({ page }) => {
  await blockExternalRequests(page);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/");
  // Dans le menu « Infos » de la barre du haut
  const nav = page.locator(".navbar").getByRole("navigation", { name: "Sections" });
  await nav.getByRole("button", { name: "Infos" }).click();
  await nav.getByRole("link", { name: "Outils", exact: true }).click();
  await expect(page).toHaveURL(/\/outils$/);
  await expect(page).toHaveTitle("Outils - Tetrago");
  await expect(nav.getByRole("button", { name: "Infos" })).toHaveClass(/bg-secondary/);

  const accueil = main(page).getByRole("tabpanel", { name: "Tous les outils" });
  for (const titre of ["Aide à la candidature", "Coordonnées du Nether", "Tetras et diamants", "Distance et temps de trajet", "Fiche de personnage pour Discord", "Cabine photo", "Télécharger le monde"]) {
    await expect(accueil.getByRole("link", { name: new RegExp(titre) })).toBeVisible();
  }
  // La carte ouvre l'outil, seul dans son onglet, et l'adresse suit
  await accueil.getByRole("link", { name: /Coordonnées du Nether/ }).click();
  await expect(page).toHaveURL(/\/outils#nether$/);
  await expect(main(page).getByRole("tab", { name: "Nether" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#nether")).toBeVisible();
  await expect(page.locator("#tetras")).toBeHidden();
  await expect(accueil).toBeHidden();
  // Flèches du clavier d'un outil à l'autre
  await main(page).getByRole("tab", { name: "Nether" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(main(page).getByRole("tab", { name: "Trajets" })).toBeFocused();
  await expect(page.locator("#distance")).toBeVisible();
  await expect(page).toHaveURL(/\/outils#distance$/);
  // Retour à l'accueil des outils : l'adresse perd son ancre
  await main(page).getByRole("tab", { name: "Tous les outils" }).click();
  await expect(page).toHaveURL(/\/outils$/);
  await expect(accueil).toBeVisible();

  // Anciens liens, du temps où les outils étaient un onglet des aides
  await page.goto("/outils#tetras");
  await expect(page).toHaveURL(/\/outils#tetras$/);
  await expect(page.locator("#tetras")).toBeVisible();
  await page.goto("/aides#outils");
  await expect(page).toHaveURL(/\/outils$/);
  await expect(main(page).getByRole("tabpanel", { name: "Tous les outils" })).toBeVisible();

  // Sur téléphone, le menu latéral y mène aussi
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/aides");
  await page.locator(".navbar").getByRole("button", { name: "Menu" }).click();
  await expect(page.locator("#panneau-menu").getByRole("link", { name: "Outils", exact: true })).toHaveAttribute("href", "/outils");
});

test("l'aide à la candidature, ouverte depuis l'accueil, prépare des réponses à copier et garde le brouillon", async ({ page, context }) => {
  await blockExternalRequests(page);
  // playerdb.co : un compte Java trouvé pour « heraut », aucun pour les autres pseudos
  await page.route(/playerdb\.co\/api\/player\/minecraft\//, (route) => (/\/heraut$/i.test(route.request().url())
    ? route.fulfill({ json: { code: "player.found", data: { player: { username: "Heraut", id: "069a79f4-44e9-4726-a5be-fca90e38aaf5" } } } })
    : route.fulfill({ status: 400, json: { code: "minecraft.invalid_username" } })));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  // Le parcours de l'accueil y mène depuis l'étape « Candidatez sur le Discord »
  await page.goto("/");
  await expect(page.locator("#parcours").getByRole("link", { name: "Préparer ma candidature" })).toHaveAttribute("href", "/outils#candidature");
  await page.goto("/outils#candidature");
  const outil = page.locator("#candidature");
  await expect(outil).toBeVisible();

  // Pseudo vérifié, avec l'écriture exacte du compte proposée
  await outil.getByLabel("Pseudo Minecraft (Java)").fill("inconnu_42");
  await outil.getByRole("button", { name: "Vérifier" }).click();
  await expect(outil).toContainText("Aucun compte Minecraft Java à ce nom");
  await outil.getByLabel("Pseudo Minecraft (Java)").fill("heraut");
  await outil.getByRole("button", { name: "Vérifier" }).click();
  await expect(outil).toContainText("Compte Java trouvé : Heraut");
  await outil.getByRole("button", { name: "Reprendre cette écriture" }).click();
  await expect(outil.getByLabel("Pseudo Minecraft (Java)")).toHaveValue("Heraut");

  await outil.getByRole("radio", { name: "Oui" }).click();
  await expect(outil.getByRole("radio", { name: "Oui" })).toHaveAttribute("aria-checked", "true");

  // Expérience, projet et personnage forment une seule réponse ; expérience et projet d'abord
  const projet = outil.locator("article", { hasText: "Votre expérience du RP, ce que vous voulez faire" });
  await projet.getByRole("button", { name: "Commerce" }).click();
  await projet.getByLabel("Précisez votre projet").fill("ouvrir une forge");
  await expect(projet).toContainText("Complétez d'abord votre expérience et votre projet");
  await projet.getByLabel("Votre expérience du RP").fill("Deux ans sur un serveur médiéval.");
  await expect(projet).not.toContainText("Complétez d'abord");
  // Une trame laissée vide ne compte pas dans la réponse
  await projet.getByRole("button", { name: "Partir d'une trame" }).click();
  await projet.getByRole("button", { name: "Copier" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("Expérience du RP : Deux ans sur un serveur médiéval.\n\nSur Tetrago : Commerce : ouvrir une forge");
  await expect(outil).toContainText("3 réponses sur 4");

  // Le brouillon survit au rechargement
  await page.reload();
  await expect(outil.getByLabel("Pseudo Minecraft (Java)")).toHaveValue("Heraut");
  await expect(projet.getByRole("button", { name: "Commerce" })).toHaveAttribute("aria-pressed", "true");
  await expect(outil.getByRole("radio", { name: "Oui" })).toHaveAttribute("aria-checked", "true");
  await expect(outil.getByRole("link", { name: "Postuler sur le Discord" })).toHaveAttribute("href", /^https:\/\/discord\.gg\//);
});

test("les coordonnées passent de la surface au Nether, et inversement", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/outils#nether");
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

test("le monde de la dernière carte se télécharge, avec sa date, sa version et sa taille", async ({ page }) => {
  await blockExternalRequests(page);
  // monde.json est publié par le générateur de la carte (Shard-Maps) : simulé ici
  let publie = true;
  await page.route("**/assets/data/telechargement/monde.json", (route) => (publie
    ? route.fulfill({
      json: {
        fichier: "tetrago-monde.zip", monde: "Tetrago-S3", version: "26.3", date: "2026-11-16T04:12:00+01:00",
        taille: 477951921, sha256: "2f6f05ad", dimensions: ["dimensions/minecraft/overworld", "dimensions/minecraft/the_nether"],
      },
    })
    : route.fulfill({ status: 404, body: "" })));
  await page.goto("/outils#monde");
  const outil = page.locator("#monde");
  await expect(outil.getByRole("heading", { name: "Télécharger le monde" })).toBeVisible();
  await expect(outil).toContainText(/lundi 16 novembre 2026/i);
  await expect(outil).toContainText("26.3");
  await expect(outil).toContainText("Surface, Nether");
  const lien = outil.getByRole("link", { name: "Télécharger Tetrago-S3 (456 Mo)" });
  await expect(lien).toHaveAttribute("href", /\/assets\/data\/telechargement\/tetrago-monde\.zip$/);
  await expect(lien).toHaveAttribute("download", "");

  // Avant la première publication : un message, pas de lien
  publie = false;
  await page.reload();
  await expect(page.locator("#monde")).toContainText("Aucun monde n'est publié pour l'instant");
  await expect(page.locator("#monde").getByRole("link")).toHaveCount(0);
});

test("des diamants se changent en tetras, et un montant dit combien de diamants frapper", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/outils#tetras");
  const outil = page.locator("#tetras");
  // 1 diamant = 8 tetras à la frappe
  await outil.getByLabel("Diamants").fill("2");
  await expect(outil.getByLabel("Montant : tetras")).toHaveValue("16");
  await expect(outil.getByLabel("et petits tetras")).toHaveValue("0");
  // 10 tetras et 4 petits = 94 petits tetras : 2 diamants à frapper (144 petits), 1 diamant au rachat (81 petits)
  await outil.getByLabel("Montant : tetras").fill("10");
  await outil.getByLabel("et petits tetras").fill("4");
  await expect(outil.getByLabel("Diamants")).toHaveValue("2");
  await expect(outil).toContainText("10 tetras et 4 petits tetras : 2 diamants à porter à la Monnaie pour les frapper (il vous restera 5 tetras et 5 petits tetras)");
  await expect(outil).toContainText("Rendus à la Monnaie, ils rachètent 1 diamant");
});

test("la distance entre deux villes publiques donne les temps de trajet", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/outils#distance");
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
  await page.goto("/outils#fiche-discord");
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
