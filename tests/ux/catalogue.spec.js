import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Catalogue des boutiques : chaque magasin publie ses articles et leurs prix en tetras (tenu par le Fondateur et les
// Admins du commerce) ; « Où acheter ? » ne cherche que dans les magasins publics des commerces publics.
test.describe.configure({ mode: "serial" });

let marchand;
let curieux;
let commerceId;
let echoppe;
let reserve;
const suffixe = uniqueSuffix();

const apiDelete = async (path, token) => {
  const response = await fetch(`${API_URL}${path}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`DELETE ${path} : ${response.status}`);
  return response.json();
};

test.beforeAll(async () => {
  marchand = await createSession("marchand");
  curieux = await createSession("curieux");
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  commerceId = (await apiPost("/commerces/create", marchand.token, { title: `Archerie ${suffixe}`, is_public: true })).commerce.id;
  const magasin = (title, isPublic) => apiPost("/commerces/magasins/create", marchand.token, {
    commerce_id: commerceId, title, dimension_id: dimension?.id ?? 1, x: 120, z: -40, is_public: isPublic,
  });
  echoppe = (await magasin(`Échoppe ${suffixe}`, true)).magasin;
  reserve = (await magasin(`Réserve ${suffixe}`, false)).magasin;
});

const main = (page) => page.locator("main.container");

test("seuls le Fondateur et les Admins tiennent le catalogue, avec des prix valides", async () => {
  const article = { magasin_id: echoppe.id, title: "Arc", categorie: "armes", prix: 4 };
  await expect(apiPost("/catalogue/articles", curieux.token, article)).rejects.toThrow(/403/);
  await expect(apiPost("/catalogue/articles", marchand.token, { ...article, prix: -1 })).rejects.toThrow(/400/);
  await expect(apiPost("/catalogue/articles", marchand.token, { ...article, quantite: 0 })).rejects.toThrow(/400/);
  await expect(apiPost("/catalogue/articles", marchand.token, { ...article, categorie: "bijoux" })).rejects.toThrow(/400/);
  // Un article du magasin privé ne doit jamais sortir dans la recherche publique
  await apiPost("/catalogue/articles", marchand.token, { magasin_id: reserve.id, title: `Flèches ${suffixe}`, categorie: "armes", prix: 1, quantite: 64 });
});

test("le marchand ajoute un article depuis la fiche du commerce", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, marchand);
  await page.goto(`/commerce/${commerceId}`);
  const carte = main(page).locator(`#magasin-${echoppe.id}`);
  await expect(carte).toContainText("Catalogue");
  await carte.getByRole("button", { name: "Ajouter un article" }).click();

  const dialog = page.locator("dialog[open]");
  await dialog.locator('input[name="title"]').fill(`Flèches ${suffixe}`);
  await dialog.locator('select[name="categorie"]').selectOption("armes");
  await dialog.locator('input[name="prix"]').fill("1");
  await dialog.locator('input[name="quantite"]').fill("16");
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/ajouté au catalogue/);

  await expect(carte).toContainText(`Flèches ${suffixe}`);
  await expect(carte).toContainText("1 tetra les 16");
});

test("« Où acheter ? » trouve la boutique publique, sans accents ni majuscules", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/commerces");
  const recherche = main(page).locator("#ou-acheter");
  await recherche.getByRole("searchbox", { name: "Article recherché" }).fill(`FLECHES ${suffixe}`);
  await recherche.getByRole("button", { name: "Chercher" }).click();

  await expect(recherche).toContainText("1 offre");
  const lien = recherche.getByRole("link", { name: `Échoppe ${suffixe}`, exact: true });
  await expect(lien).toHaveAttribute("href", `/commerce/${commerceId}#magasin-${echoppe.id}`);
  await expect(recherche).not.toContainText(`Réserve ${suffixe}`);
  await expect(recherche).toContainText("1 tetra les 16");
});

test("un article en rupture passe après ceux en stock ; la suppression du magasin vide son catalogue", async () => {
  const autre = (await apiPost("/catalogue/articles", marchand.token, { magasin_id: echoppe.id, title: `Flèches de luxe ${suffixe}`, categorie: "armes", prix: 1, quantite: 32, en_stock: false })).article;
  const { resultats } = await apiGet(`/catalogue/recherche?q=${encodeURIComponent(`fleches ${suffixe}`)}`);
  expect(resultats.map((article) => article.id).at(-1)).toBe(autre.id);
  expect((await apiGet(`/catalogue/recherche?q=${encodeURIComponent(`fleches ${suffixe}`)}&en_stock=true`)).total).toBe(1);

  await apiDelete(`/commerces/magasins/delete/${echoppe.id}`, marchand.token);
  expect((await apiGet(`/catalogue/recherche?q=${encodeURIComponent(`fleches ${suffixe}`)}`)).total).toBe(0);
});
