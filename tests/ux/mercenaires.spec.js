import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, makeModerateur, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Compagnies de mercenaires : déclarées par une civilisation sur sa fiche, prises sur l'armée de la ville, engagées par
// un belligérant depuis la fiche de sa guerre, sans que leur civilisation entre dans un camp.
test.describe.configure({ mode: "serial" });

const suffixe = uniqueSuffix();
let attaquant;
let defenseur;
let loueur;
let moderateur;
let guerreId;
let compagnies;
let civilisationLoueur;

const apiPut = async (path, token, body = {}) => {
  const response = await fetch(`${API_URL}${path}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`PUT ${path} : ${response.status}`);
  return response.json();
};
const authGet = async (path, session) => (await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${session.token}` } })).json();
const main = (page) => page.locator("main.container");

test.beforeAll(async () => {
  attaquant = await createSession("conquerant");
  defenseur = await createSession("assiege");
  loueur = await createSession("condottiere");
  moderateur = await createSession("juge");
  makeModerateur(moderateur.account.username);
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  const civ = async (session, nom, population) => {
    const civilisationId = (await apiPost("/civilisations/create", session.token, { title: `${nom} ${suffixe}`, is_public: true })).civilisation.id;
    await apiPost("/civilisations/villes/create", session.token, {
      title: `Fort de ${nom} ${suffixe}`, civilisation_id: civilisationId, dimension_id: dimension?.id ?? 1, x: 0, z: 0, population, is_capital: true, is_public: true,
    });
    return civilisationId;
  };
  const nord = await civ(attaquant, "Nord", 100);
  const sud = await civ(defenseur, "Sud", 100);
  civilisationLoueur = await civ(loueur, "Condottieri", 150);
  guerreId = (await apiPost("/guerres/declarer", attaquant.token, { title: `Guerre des lames ${suffixe}`, attaquant_id: nord, defenseur_id: sud })).guerre.id;
  await apiPut(`/guerres/${guerreId}/valider`, moderateur.token);
});

test("une civilisation déclare une compagnie sur sa fiche, dans la limite de sa ville", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, loueur);
  await page.goto(`/civilisation/${civilisationLoueur}#mercenaires`);
  const section = main(page).locator("#mercenaires");
  await section.getByRole("button", { name: /Déclarer/ }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('select[name="ville_id"]').selectOption({ label: `Fort de Condottieri ${suffixe} (15 soldats disponibles)` });
  await dialog.locator('input[name="title"]').fill(`Lames grises ${suffixe}`);
  await dialog.locator('input[name="effectif"]').fill("10");
  await dialog.locator('input[name="tarif"]').fill("30 tetras par bataille");
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toContain("La compagnie est déclarée");
  await expect(section.getByRole("listitem", { name: `Lames grises ${suffixe}` })).toContainText("À louer");

  compagnies = await authGet(`/mercenaires/civilisation/${civilisationLoueur}`, loueur);
  expect(compagnies.villes[0]).toMatchObject({ armee: 15, mobilises: 10, disponibles: 5 });
  await expect(apiPost("/mercenaires/create", loueur.token, { ville_id: compagnies.villes[0].id, title: "Trop", effectif: 6 })).rejects.toThrow(/400/);
  await expect(apiPost("/mercenaires/create", attaquant.token, { ville_id: compagnies.villes[0].id, title: "Pas à moi", effectif: 1 })).rejects.toThrow(/403/);
  expect((await apiGet("/mercenaires/list")).map((c) => c.title)).toContain(`Lames grises ${suffixe}`);
});

test("le défenseur engage la compagnie sans que sa civilisation entre en guerre", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, defenseur);
  await page.goto(`/guerre/${guerreId}`);
  const section = main(page).locator("#troupes");
  await section.getByRole("region", { name: "Engager des mercenaires" }).getByRole("listitem", { name: `Lames grises ${suffixe}` }).getByRole("button", { name: "Engager" }).click();
  await page.locator('dialog[open] button[type="submit"]').click();
  expect(await readAlert(page)).toContain("Les mercenaires rejoignent votre camp");

  const carte = section.getByRole("region", { name: "Troupes du camp défenseur" }).getByRole("listitem", { name: `Lames grises ${suffixe}` });
  await expect(carte).toContainText("Mercenaires");
  await expect(carte).toContainText(`au service de Sud ${suffixe}`);
  await expect(main(page).getByRole("region", { name: "Défenseurs" })).not.toContainText(`Condottieri ${suffixe}`);

  const guerre = await apiGet(`/guerres/read/${guerreId}`);
  const belligerants = [...guerre.camps.attaquant, ...guerre.camps.defenseur].map((b) => b.entite.title);
  expect(belligerants).not.toContain(`Condottieri ${suffixe}`);
  // Le loueur ne commande pas sa compagnie, mais sait où elle sert
  const troupe = (await authGet(`/guerres/${guerreId}/troupes`, defenseur)).troupes.defenseur[0];
  await expect(apiPut(`/guerres/${guerreId}/troupes/${troupe.id}/deplacer`, loueur.token, { position: "en_mouvement" })).rejects.toThrow(/403/);
  const [compagnie] = (await authGet(`/mercenaires/civilisation/${civilisationLoueur}`, loueur)).compagnies;
  expect(compagnie.status).toBe("sous_contrat");
  expect(compagnie.contrat.guerre.id).toBe(guerreId);
});

test("le loueur rompt le contrat depuis sa fiche : la compagnie redevient disponible", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, loueur);
  await page.goto(`/civilisation/${civilisationLoueur}#mercenaires`);
  const carte = main(page).locator("#mercenaires").getByRole("listitem", { name: `Lames grises ${suffixe}` });
  await expect(carte).toContainText(`Guerre des lames ${suffixe}`);
  await carte.getByRole("button", { name: "Rompre le contrat" }).click();
  // SweetAlert réutilise la même fenêtre pour l'alerte de succès : on attend celle-ci plutôt que la fermeture
  await expect(page.locator(".swal2-popup")).toContainText("Rompre le contrat ?");
  await page.locator(".swal2-confirm").click();
  const succes = page.locator(".swal2-popup.swal2-icon-success");
  await expect(succes).toContainText("Le contrat est rompu");
  await succes.locator(".swal2-confirm").click();
  await expect(carte).toContainText("À louer");
  const troupes = (await authGet(`/guerres/${guerreId}/troupes`, defenseur)).troupes.defenseur;
  expect(troupes.map((t) => t.status)).toEqual(["demobilisee"]);
});
