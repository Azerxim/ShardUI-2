import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, makeAdmin, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Livres : catégorie (Shard-API services/categories_livres.py), « Textes officiels » réservée aux administrateurs et
// toujours en tête ; filtre et étagères par catégorie dans la bibliothèque, catégorie sur la fiche du livre.
test.describe.configure({ mode: "serial" });

const suffixe = uniqueSuffix();
let auteur;
let admin;

const api = async (method, chemin, token, body) => fetch(`${API_URL}${chemin}`, {
  method,
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: body ? JSON.stringify(body) : undefined,
});
const livre = (champs) => ({ user_id: 0, author: "Copiste", title: `Livre ${suffixe}`, ...champs });

test.beforeAll(async () => {
  auteur = await createSession("copiste");
  admin = await createSession("bibliothecaire");
  makeAdmin(admin.account.username);
});

test("un livre est rangé dans sa catégorie, « Divers » par défaut", async () => {
  expect((await apiPost("/bibliotheque/livres/create", auteur.token, livre({ title: `Code des marchands ${suffixe}`, categorie: "lois" }))).categorie).toBe("lois");
  expect((await apiPost("/bibliotheque/livres/create", auteur.token, livre({ title: `Sans rayon ${suffixe}` }))).categorie).toBe("divers");
  expect((await api("POST", "/bibliotheque/livres/create", auteur.token, livre({ categorie: "almanach" }))).status).toBe(400);
  const categories = await apiGet("/bibliotheque/livres/categories");
  expect(categories).toMatchObject({ lois: "Lois", legendes: "Légendes", divers: "Divers" });
  expect(Object.keys(categories)[0]).toBe("officiel");
});

test("seuls les administrateurs classent un livre dans « Textes officiels »", async () => {
  expect((await api("POST", "/bibliotheque/livres/create", auteur.token, livre({ categorie: "officiel" }))).status).toBe(403);
  const sien = await apiPost("/bibliotheque/livres/create", auteur.token, livre({ title: `Légende ${suffixe}`, categorie: "legendes" }));
  expect((await api("PUT", `/bibliotheque/livres/update/${sien.id}`, auteur.token, livre({ categorie: "officiel" }))).status).toBe(403);
  const officiel = await apiPost("/bibliotheque/livres/create", admin.token, livre({ title: `Règlement ${suffixe}`, categorie: "officiel" }));
  expect(officiel.categorie).toBe("officiel");
  // Un administrateur reclasse un livre
  const reclasse = await api("PUT", `/bibliotheque/livres/update/${sien.id}`, admin.token, livre({ title: sien.title, categorie: "histoire" }));
  expect((await reclasse.json()).livre.categorie).toBe("histoire");
});

test("depuis la bibliothèque, un joueur écrit un livre classé, filtré et rangé sur son étagère", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, auteur);
  await page.goto("/bibliotheque");
  await page.getByRole("button", { name: /^Nouveau Livre/ }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('[name="title"]').fill(`Traité du gué ${suffixe}`);
  await dialog.locator('[name="author"]').fill("Le chancelier");
  const choix = dialog.getByRole("combobox").first();
  // « Textes officiels » n'est pas proposée à un joueur
  await expect(choix.locator("option", { hasText: "Textes officiels" })).toHaveCount(0);
  await choix.selectOption({ label: "Traités" });
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toContain("Livre créé");

  const cree = (await apiGet("/bibliotheque/livres/list?limit=10000")).find((l) => l.title === `Traité du gué ${suffixe}`);
  expect(cree.categorie).toBe("traites");

  // Toutes catégories : une étagère par catégorie, « Textes officiels » en tête
  await page.reload();
  await page.getByLabel("Afficher").selectOption({ label: "Livres seulement" });
  const etageres = page.locator("section[aria-label]");
  await expect(etageres.first()).toHaveAttribute("aria-label", "Textes officiels");
  await expect(page.locator('section[aria-label="Traités"]').getByRole("link", { name: new RegExp(`Traité du gué ${suffixe}`) })).toBeVisible();

  // Filtre « Catégorie »
  await page.getByLabel("Catégorie").selectOption({ label: "Traités" });
  await expect(page.getByRole("link", { name: new RegExp(`Traité du gué ${suffixe}`) })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(`Code des marchands ${suffixe}`) })).toHaveCount(0);
  await page.getByLabel("Catégorie").selectOption({ label: "Toutes les catégories de livre" });
  await page.getByLabel("Afficher").selectOption({ label: "Journaux et livres" });

  // Fiche du livre
  await page.goto(`/bibliotheque/livre/${cree.id}`);
  await expect(page.getByText("Catégorie : Traités")).toBeVisible();
});
