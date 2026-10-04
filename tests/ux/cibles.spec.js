import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, makeModerateur, uniqueSuffix } from "./helpers.js";

// Cibles d'une guerre : sur sa fiche, les bâtiments et zones destructibles des villes des deux camps, camp par camp.
test.describe.configure({ mode: "serial" });

let guerreId;
const suffixe = uniqueSuffix();

const apiPut = async (path, token, body) => {
  const response = await fetch(`${API_URL}${path}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`PUT ${path} : ${response.status}`);
  return response.json();
};

test.beforeAll(async () => {
  const attaquant = await createSession("assaillant");
  const defenseur = await createSession("assiege");
  const moderateur = await createSession("arbitre");
  makeModerateur(moderateur.account.username);
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  const dimensionId = dimension?.id ?? 1;
  const camp = async (session, nom, x) => {
    const civilisationId = (await apiPost("/civilisations/create", session.token, { title: `${nom} ${suffixe}`, is_public: true })).civilisation.id;
    const ville = await apiPost("/civilisations/villes/create", session.token, { title: `Cité de ${nom} ${suffixe}`, civilisation_id: civilisationId, dimension_id: dimensionId, x, z: 0, is_capital: true, is_public: true });
    return { civilisationId, ville };
  };
  const nord = await camp(attaquant, "Nord", 0);
  const sud = await camp(defenseur, "Sud", 500);
  await apiPost("/cartographie/create", defenseur.token, { title: `Donjon ${suffixe}`, type: "destructible", type_id: sud.ville.id, dimension_id: dimensionId, shape_type: "Marker", coordinates: JSON.stringify([0, 500]) });
  await apiPost("/cartographie/create", attaquant.token, { title: `Moulin ${suffixe}`, type: "destructible", type_id: nord.ville.id, dimension_id: dimensionId, shape_type: "Marker", coordinates: JSON.stringify([0, 0]) });
  const declaration = await apiPost("/guerres/declarer", attaquant.token, { title: `Guerre des cibles ${suffixe}`, attaquant_id: nord.civilisationId, defenseur_id: sud.civilisationId });
  guerreId = declaration.guerre.id;
  await apiPut(`/guerres/${guerreId}/valider`, moderateur.token, {});
});

test("la fiche de la guerre liste les destructibles des deux camps", async ({ page }) => {
  const cibles = await apiGet(`/guerres/cibles/${guerreId}`);
  expect(cibles.attaquant[0].villes[0].destructibles.map((d) => d.title)).toEqual([`Moulin ${suffixe}`]);
  expect(cibles.defenseur[0].villes[0].destructibles.map((d) => d.title)).toEqual([`Donjon ${suffixe}`]);

  await blockExternalRequests(page);
  await page.goto(`/guerre/${guerreId}`);
  const section = page.locator("main.container #cibles");
  await expect(section).toContainText(`Cité de Sud ${suffixe}`);
  await expect(section).toContainText("1 cible");
  await section.getByRole("button", { name: new RegExp(`Cité de Sud ${suffixe}`) }).click();
  await expect(section).toContainText(`Donjon ${suffixe}`);
  await expect(section).toContainText("Menacé");
});
