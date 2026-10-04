import { Buffer } from "node:buffer";
import { test, expect } from "@playwright/test";
import { API_URL, apiPost, blockExternalRequests, createSession, makeModerateur, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Déclaration des fermes : le joueur déclare (position, justification RP, photo), un modérateur RP valide ou demande une
// mise en conformité, jamais pour sa propre ferme. Une déclaration n'est visible que du déclarant et des modérateurs.
test.describe.configure({ mode: "serial" });

let fermier;
let voisin;
let moderateur;
const suffixe = uniqueSuffix();
// Plus petit PNG valide (1 × 1 pixel)
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

const apiGetAuth = async (path, token) => {
  const response = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`GET ${path} : ${response.status}`);
  return response.json();
};

test.beforeAll(async () => {
  fermier = await createSession("fermier");
  voisin = await createSession("voisin");
  moderateur = await createSession("inspecteur");
  makeModerateur(moderateur.account.username);
});

const main = (page) => page.locator("main.container");

test("le joueur déclare sa ferme avec une photo ; elle attend un modérateur", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, fermier);
  await page.goto("/fermes");
  await main(page).locator("#mes-fermes").getByRole("button", { name: "Déclarer une ferme" }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('input[name="title"]').fill(`Moulin ${suffixe}`);
  await dialog.locator('select[name="type"]').selectOption("cultures");
  // Position : même champ que les villes (monde, X, Z et carte de localisation)
  await dialog.locator("fieldset", { hasText: "Position" }).locator("select").selectOption({ index: 1 });
  await dialog.locator('input[name="x"]').fill("120");
  await dialog.locator('input[name="z"]').fill("-40");
  await dialog.locator('textarea[name="justification"]').fill("Le meunier nourrit la garnison du bourg");
  await dialog.locator('input[name="photo"]').setInputFiles({ name: "moulin.png", mimeType: "image/png", buffer: PNG });
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/déclarée/);

  const carte = main(page).locator("#mes-fermes article", { hasText: `Moulin ${suffixe}` });
  await expect(carte).toContainText("En attente");
  await expect(carte.getByRole("img", { name: `Photo de Moulin ${suffixe}` })).toBeVisible();
});

test("la déclaration reste privée ; un fichier qui n'est pas une image est refusé", async () => {
  const [ferme] = await apiGetAuth("/fermes/mine", fermier.token);
  await expect(apiGetAuth(`/fermes/read/${ferme.id}`, voisin.token)).rejects.toThrow(/404/);
  await expect(apiGetAuth("/fermes/list", voisin.token)).rejects.toThrow(/403/);
  const corps = new FormData();
  corps.append("photo", new Blob(["pas une image"], { type: "image/png" }), "faux.png");
  const response = await fetch(`${API_URL}/fermes/photo/${ferme.id}`, { method: "POST", headers: { Authorization: `Bearer ${fermier.token}` }, body: corps });
  expect(response.status).toBe(400);
});

test("le modérateur demande une mise en conformité, puis valide la ferme corrigée", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, moderateur);
  await page.goto("/fermes");
  const file = main(page).locator("#a-examiner article", { hasText: `Moulin ${suffixe}` });
  await file.getByRole("button", { name: "Mise en conformité" }).click();
  await page.locator(".swal2-textarea").fill("Habillez-la dans un vrai moulin");
  await page.locator(".swal2-confirm").click();
  await readAlert(page);

  // Le fermier corrige : la ferme repasse en attente
  const [ferme] = await apiGetAuth("/fermes/mine", fermier.token);
  expect(ferme.status).toBe("a_corriger");
  const response = await fetch(`${API_URL}/fermes/update/${ferme.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${fermier.token}` }, body: JSON.stringify({ habillage: "Moulin à vent" }) });
  expect((await response.json()).ferme.status).toBe("en_attente");

  await page.reload();
  await main(page).locator("#a-examiner article", { hasText: `Moulin ${suffixe}` }).getByRole("button", { name: "Valider" }).click();
  await page.locator(".swal2-confirm").click();
  await readAlert(page);
  expect((await apiGetAuth("/fermes/mine", fermier.token))[0].status).toBe("validee");
});

test("un modérateur ne valide pas sa propre ferme", async () => {
  const { ferme } = await apiPost("/fermes/create", moderateur.token, { title: `Étable ${suffixe}`, justification: "Mes chevaux", x: 1, z: 1 });
  const response = await fetch(`${API_URL}/fermes/decision/${ferme.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${moderateur.token}` }, body: JSON.stringify({ status: "validee" }) });
  expect(response.status).toBe(403);
});
