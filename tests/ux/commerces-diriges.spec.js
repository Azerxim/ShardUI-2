import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, signIn, uniqueSuffix } from "./helpers.js";

// Un commerce dirigé se gère aussi par le Fondateur et les Admins de son commerce dirigeant (Shard-API
// _check_commerce_rights) : fiche, membres, magasins et catalogue. L'inverse n'est pas vrai.
test.describe.configure({ mode: "serial" });

let patron;
let gerant;
let dirigeantId;
let dirigeId;
let magasin;

const apiPut = async (path, token, body) => {
  const response = await fetch(`${API_URL}${path}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`PUT ${path} : ${response.status}`);
  return response.json();
};

test.beforeAll(async () => {
  patron = await createSession("patron");
  gerant = await createSession("gerant");
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  dirigeantId = (await apiPost("/commerces/create", patron.token, { title: `Maison mère ${uniqueSuffix()}`, is_public: true })).commerce.id;
  dirigeId = (await apiPost("/commerces/create", gerant.token, { title: `Filiale ${uniqueSuffix()}`, is_public: true })).commerce.id;
  // Le rattachement demande les droits sur le dirigeant : le patron ajoute le gérant comme Admin le temps de rattacher
  await apiPost(`/commerces/members/${dirigeantId}/add`, patron.token, { user_id: gerant.user.id, role: "Admin" });
  await apiPut(`/commerces/update/${dirigeId}`, gerant.token, { is_commerce_dirigeant: false, dirigeant_commerce_id: dirigeantId });
  await fetch(`${API_URL}/commerces/members/${dirigeantId}/remove?member_id=${gerant.user.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${patron.token}` } });
  magasin = (await apiPost("/commerces/magasins/create", gerant.token, { commerce_id: dirigeId, title: `Comptoir ${uniqueSuffix()}`, dimension_id: dimension?.id ?? 1, x: 0, z: 0, is_public: true })).magasin;
});

const main = (page) => page.locator("main.container");

test("le Fondateur du dirigeant gère le commerce dirigé, pas l'inverse", async () => {
  const modifie = await apiPut(`/commerces/update/${dirigeId}`, patron.token, { description: "Reprise en main par la maison mère" });
  expect(modifie.commerce.description).toBe("Reprise en main par la maison mère");
  await apiPut(`/commerces/magasins/update/${magasin.id}`, patron.token, { description: "Horaires fixés par la maison mère" });
  await apiPost("/catalogue/articles", patron.token, { magasin_id: magasin.id, title: "Pain", categorie: "nourriture", prix: 1, quantite: 8 });
  // Le gérant du commerce dirigé n'a aucun droit sur le dirigeant
  await expect(apiPut(`/commerces/update/${dirigeantId}`, gerant.token, { description: "Coup d'État" })).rejects.toThrow(/403/);
});

test("la fiche du commerce dirigé montre ses boutons au Fondateur du dirigeant", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, patron);
  await page.goto(`/commerce/${dirigeId}`);
  await expect(main(page)).toContainText("Reprise en main par la maison mère");
  await expect(main(page).getByRole("button", { name: "Modifier le magasin" })).toBeVisible();
  await expect(main(page).getByRole("button", { name: "Ajouter un article" })).toBeVisible();
});

test("sur la fiche du dirigeant, les magasins des commerces dirigés se modifient", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, patron);
  await page.goto(`/commerce/${dirigeantId}`);
  const carte = main(page).locator(`#magasin-${magasin.id}`);
  await expect(carte).toContainText("Pain");
  await carte.getByRole("button", { name: "Modifier le magasin" }).click();
  await expect(page.locator("dialog[open]")).toContainText("Modifier le magasin");
});
