import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, makeModerateur, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Population officielle : mesure + écarts motivés demandés par les dirigeants et validés par un modérateur RP
// (jamais sa propre demande) ; la civilisation additionne ses villes et affiche son armée autorisée (1 pour 10).
test.describe.configure({ mode: "serial" });

let fondateur;
let moderateur;
let civilisationId;
let ville;

const apiPut = async (path, token, body) => {
  const response = await fetch(`${API_URL}${path}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`PUT ${path} : ${response.status}`);
  return response.json();
};

test.beforeAll(async () => {
  fondateur = await createSession("peuple");
  moderateur = await createSession("peuplemodo");
  makeModerateur(moderateur.account.username);
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  civilisationId = (await apiPost("/civilisations/create", fondateur.token, { title: `Peuple ${uniqueSuffix()}`, is_public: true })).civilisation.id;
  ville = await apiPost("/civilisations/villes/create", fondateur.token, {
    title: `Bourg ${uniqueSuffix()}`, civilisation_id: civilisationId, dimension_id: dimension?.id ?? 1, x: 0, z: 0, population: 250, is_capital: true, is_public: true,
  });
});

const main = (page) => page.locator("main.container");

test("les dirigeants demandent un écart motivé, que seul un modérateur valide", async () => {
  await expect(apiPost("/population/ajustements", fondateur.token, { ville_id: ville.id, ecart: 0, motif: "Rien" })).rejects.toThrow(/400/);
  await expect(apiPost("/population/ajustements", fondateur.token, { ville_id: ville.id, ecart: 40, motif: "" })).rejects.toThrow(/400|422/);
  await expect(apiPost("/population/ajustements", moderateur.token, { ville_id: ville.id, ecart: 40, motif: "Pas dirigeant" })).rejects.toThrow(/403/);
  const { ajustement } = await apiPost("/population/ajustements", fondateur.token, { ville_id: ville.id, ecart: 40, motif: "Réfugiés de Narva" });
  expect(ajustement.status).toBe("en_attente");
  await expect(apiPut(`/population/ajustements/${ajustement.id}/decision`, fondateur.token, { accepte: true })).rejects.toThrow(/403/);

  const avant = await apiGet(`/population/ville/${ville.id}`);
  expect(avant).toMatchObject({ mesuree: 250, officielle: 250 });
  expect(avant.en_attente).toHaveLength(1);
});

test("un modérateur accepte la demande depuis la fiche de la ville", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, moderateur);
  await page.goto(`/civilisation/${civilisationId}/ville/${ville.id}#population`);
  const section = main(page).locator("#population");
  await expect(section).toContainText("En attente de validation");
  await section.getByRole("button", { name: "Accepter" }).click();
  await page.locator(".swal2-input").fill("Exode confirmé");
  await page.locator(".swal2-confirm").click();
  await expect(section).toContainText("290");
  await expect(section).toContainText("Réfugiés de Narva");
  await expect(section).toContainText("Exode confirmé");
  await expect(main(page).getByText("Population officielle", { exact: true }).first()).toBeVisible();
});

test("un modérateur ne valide jamais sa propre demande ; un refus ne change rien", async () => {
  // Le fondateur devient aussi modérateur : il demande, mais ne peut pas valider lui-même
  makeModerateur(fondateur.account.username);
  const { ajustement } = await apiPost("/population/ajustements", fondateur.token, { ville_id: ville.id, ecart: -30, motif: "Peste noire" });
  await expect(apiPut(`/population/ajustements/${ajustement.id}/decision`, fondateur.token, { accepte: true })).rejects.toThrow(/403/);
  const refus = await apiPut(`/population/ajustements/${ajustement.id}/decision`, moderateur.token, { accepte: false, note: "Pas d'épidémie jouée" });
  expect(refus.ajustement.status).toBe("refuse");
  expect(refus.population.officielle).toBe(290);
});

test("la civilisation additionne ses villes et affiche son armée autorisée", async ({ page }) => {
  expect(await apiGet(`/population/civilisation/${civilisationId}`)).toMatchObject({ officielle: 290, armee: 29, habitants_par_soldat: 10 });
  await blockExternalRequests(page);
  await page.goto(`/civilisation/${civilisationId}`);
  await expect(main(page).getByText("290", { exact: true })).toBeVisible();
  await expect(main(page).getByText("29 soldats")).toBeVisible();
  await expect(main(page).getByRole("link", { name: /Armée autorisée/ })).toHaveAttribute("href", "/codex#guerres-1");
});
