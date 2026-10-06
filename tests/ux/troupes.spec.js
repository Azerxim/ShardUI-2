import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, makeModerateur, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Troupes d'une guerre : levées ville par ville (un soldat pour dix habitants, toutes guerres en cours confondues),
// toujours sur un champ de bataille (zone de conflit de la guerre) ou en mouvement ; chaque camp ne voit que les siennes.
test.describe.configure({ mode: "serial" });

const suffixe = uniqueSuffix();
let attaquant;
let defenseur;
let moderateur;
let guerreId;
let nord;
let sud;

const apiPut = async (path, token, body) => {
  const response = await fetch(`${API_URL}${path}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`PUT ${path} : ${response.status}`);
  return response.json();
};
const troupes = async (session = null) => {
  const response = await fetch(`${API_URL}/guerres/${guerreId}/troupes`, { headers: session ? { Authorization: `Bearer ${session.token}` } : {} });
  return response.json();
};
const main = (page) => page.locator("main.container");

test.beforeAll(async () => {
  attaquant = await createSession("levee");
  defenseur = await createSession("rempart");
  moderateur = await createSession("marechal");
  makeModerateur(moderateur.account.username);
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  const dimensionId = dimension?.id ?? 1;
  const camp = async (session, nom, x) => {
    const civilisationId = (await apiPost("/civilisations/create", session.token, { title: `${nom} ${suffixe}`, is_public: true })).civilisation.id;
    const ville = await apiPost("/civilisations/villes/create", session.token, {
      title: `Bourg de ${nom} ${suffixe}`, civilisation_id: civilisationId, dimension_id: dimensionId, x, z: 0, population: 125, is_capital: true, is_public: true,
    });
    return { civilisationId, ville };
  };
  nord = await camp(attaquant, "Ost", 0);
  sud = await camp(defenseur, "Marche", 500);
  guerreId = (await apiPost("/guerres/declarer", attaquant.token, { title: `Guerre des levées ${suffixe}`, attaquant_id: nord.civilisationId, defenseur_id: sud.civilisationId })).guerre.id;
  await apiPut(`/guerres/${guerreId}/valider`, moderateur.token, {});
  await apiPost("/cartographie/create", attaquant.token, {
    title: `Plaine du Gué ${suffixe}`, type: "guerre", type_id: guerreId, dimension_id: dimensionId, shape_type: "Polygon",
    coordinates: JSON.stringify([[0, 0], [0, 100], [-100, 100]]),
  });
});

test("l'API borne la levée à la ville et exige une position", async () => {
  const lever = (session, body) => apiPost(`/guerres/${guerreId}/troupes`, session.token, { title: "Garde", effectif: 1, ...body });
  await expect(lever(attaquant, { ville_id: nord.ville.id, effectif: 13 })).rejects.toThrow(/400/);
  await expect(lever(defenseur, { ville_id: nord.ville.id })).rejects.toThrow(/403/);
  await expect(lever(attaquant, { ville_id: nord.ville.id, position: "champ_de_bataille" })).rejects.toThrow(/400/);
  await expect(lever(attaquant, { ville_id: nord.ville.id, position: "caserne" })).rejects.toThrow(/400/);

  const { troupe } = await lever(defenseur, { ville_id: sud.ville.id, title: `Garnison ${suffixe}`, effectif: 12 });
  expect(troupe).toMatchObject({ position: "en_mouvement", zone: null, effectif: 12, camp: "defenseur" });
  await expect(lever(defenseur, { ville_id: sud.ville.id })).rejects.toThrow(/400/);

  // Chaque camp ne voit que ses troupes ; un visiteur n'en voit aucune
  expect((await troupes()).troupes).toEqual({ attaquant: null, defenseur: null });
  expect((await troupes(attaquant)).troupes.defenseur).toBeNull();
  expect((await troupes(moderateur)).troupes.defenseur).toHaveLength(1);
  const levees = (await troupes(attaquant)).levees;
  expect(levees[0].villes[0]).toMatchObject({ armee: 12, mobilises: 0, disponibles: 12 });
});

test("le fondateur lève une troupe dans sa ville et la déplace", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, attaquant);
  await page.goto(`/guerre/${guerreId}`);
  const section = main(page).locator("#troupes");
  await expect(section.getByRole("region", { name: "Troupes du camp défenseur" })).toContainText("Troupes cachées");

  await section.getByRole("button", { name: `Lever des troupes à Bourg de Ost ${suffixe}` }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('input[name="title"]').fill(`Légion ${suffixe}`);
  await dialog.locator('input[name="effectif"]').fill("8");
  await dialog.locator('select[name="zone_id"]').selectOption({ label: `Plaine du Gué ${suffixe}` });
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toContain("La troupe est levée");

  const carte = section.getByRole("listitem", { name: `Légion ${suffixe}` });
  await expect(carte).toContainText("8 soldats");
  await expect(carte).toContainText(`Sur le champ de bataille : Plaine du Gué ${suffixe}`);
  await expect(section).toContainText("8 / 12 soldats mobilisés");

  // Carte de la guerre : la fiche lui envoie les troupes de son camp (pas la garnison adverse), sur leur champ de bataille
  const plan = main(page).frameLocator(`iframe[title="Zones de conflit de Guerre des levées ${suffixe}"]`);
  await expect(plan.locator(".troupe-marqueur")).toHaveCount(1);
  await expect(plan.locator(".troupe-marqueur")).toHaveText("8");

  await carte.getByRole("button", { name: "Déplacer" }).click();
  await page.locator("dialog[open]").getByRole("tab", { name: "En mouvement" }).click();
  await page.locator('dialog[open] button[type="submit"]').click();
  expect(await readAlert(page)).toContain("La troupe a changé de position");
  await expect(carte).toContainText("En mouvement, sans destination annoncée");
  await expect(plan.locator(".troupe-marqueur")).toHaveText("8 ?");

  // En route vers le champ de bataille : flèche en pointillés depuis la ville d'origine
  await carte.getByRole("button", { name: "Déplacer" }).click();
  await page.locator('dialog[open] select[name="destination_id"]').selectOption({ label: `Plaine du Gué ${suffixe}` });
  await page.locator('dialog[open] button[type="submit"]').click();
  expect(await readAlert(page)).toContain("La troupe a changé de position");
  await expect(carte).toContainText(`En mouvement vers Plaine du Gué ${suffixe}`);
  await expect(plan.locator(".troupe-marqueur")).toHaveText("8");
  await expect(plan.locator(".troupe-fleche")).toHaveCount(1);
  // Trait en pointillés et point de départ (la ville d'origine)
  await expect(plan.locator(".leaflet-overlay-pane path")).toHaveCount(2);
  await expect(main(page).getByRole("list", { name: "Chronologie" })).toContainText(`Légion ${suffixe} (Ost ${suffixe}) se met en marche`);
});

test("à la fin de la guerre, les troupes sont démobilisées et rendues publiques", async ({ page }) => {
  await apiPut(`/guerres/${guerreId}/terminer`, moderateur.token, { issue: "Paix blanche" });
  const { troupes: archives } = await troupes();
  expect(archives.attaquant.map((t) => t.status)).toEqual(["demobilisee"]);
  expect(archives.defenseur.map((t) => t.title)).toEqual([`Garnison ${suffixe}`]);

  await blockExternalRequests(page);
  await page.goto(`/guerre/${guerreId}`);
  await expect(main(page).locator("#troupes")).toContainText(`Légion ${suffixe}`);
  await expect(main(page).locator("#troupes")).toContainText("Démobilisée");
});
