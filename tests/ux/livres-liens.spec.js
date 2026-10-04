import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, makeAdmin, readAlert, refreshSession, signIn, uniqueSuffix } from "./helpers.js";

// Un livre se lie à une religion, un commerce, une alliance ou un personnage (en plus de sa civilisation) : il figure
// alors sur leur fiche. Lier demande des droits sur le livre et sur ce qu'on lie ; retirer, l'un ou l'autre.
test.describe.configure({ mode: "serial" });

let auteur;
let autre;
let livreId;
let religionId;
let religionAutreId;
let personnageId;
const suffixe = uniqueSuffix();

test.beforeAll(async () => {
  auteur = await createSession("scribe");
  autre = await createSession("copiste");
  livreId = (await apiPost("/bibliotheque/livres/create", auteur.token, { user_id: 0, author: "Scribe", title: `Chronique ${suffixe}`, is_public: true })).id;
  const religion = await apiPost("/religions/create", auteur.token, { title: `Culte ${suffixe}`, is_public: true });
  religionId = (religion.religion ?? religion).id;
  const religionAutre = await apiPost("/religions/create", autre.token, { title: `Hérésie ${suffixe}`, is_public: true });
  religionAutreId = (religionAutre.religion ?? religionAutre).id;
  const personnage = await apiPost("/personnages/create", auteur.token, { name: `Aldric ${suffixe}` });
  personnageId = (personnage.personnage ?? personnage).id;
});

const main = (page) => page.locator("main.container");

test("lier demande des droits sur le livre et sur ce qu'on lie", async () => {
  await expect(apiPost("/bibliotheque/livres/liens", auteur.token, { livre_id: livreId, entity_type: "religion", entity_id: religionAutreId })).rejects.toThrow(/403/);
  await expect(apiPost("/bibliotheque/livres/liens", autre.token, { livre_id: livreId, entity_type: "religion", entity_id: religionAutreId })).rejects.toThrow(/403/);
  await expect(apiPost("/bibliotheque/livres/liens", auteur.token, { livre_id: livreId, entity_type: "ville", entity_id: 1 })).rejects.toThrow(/400/);
  // Rattacher un nouveau livre à la civilisation d'un autre est refusé dès la création
  const civilisation = await apiPost("/civilisations/create", autre.token, { title: `Royaume ${suffixe}`, is_public: true });
  await expect(apiPost("/bibliotheque/livres/create", auteur.token, { user_id: 0, author: "Scribe", title: "Faux", civilisation_id: civilisation.civilisation.id })).rejects.toThrow(/403/);
});

test("l'auteur lie son livre à sa religion depuis la fiche du livre", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, auteur);
  await page.goto(`/bibliotheque/livre/${livreId}`);
  await main(page).getByRole("button", { name: "Lier" }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByLabel("Religion").check();
  await dialog.locator('select[name="entity_id"]').selectOption({ label: `Culte ${suffixe}` });
  // La religion d'un autre n'est pas proposée
  await expect(dialog.locator('select[name="entity_id"] option', { hasText: `Hérésie ${suffixe}` })).toHaveCount(0);
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/livre est lié/);
  await expect(main(page).getByRole("link", { name: `Culte ${suffixe}` })).toHaveAttribute("href", `/religion/${religionId}`);
});

test("le livre figure sur la fiche de la religion et du personnage", async ({ page }) => {
  await apiPost("/bibliotheque/livres/liens", auteur.token, { livre_id: livreId, entity_type: "personnage", entity_id: personnageId });
  await blockExternalRequests(page);
  await page.goto(`/religion/${religionId}`);
  await expect(main(page).locator("#livres")).toContainText(`Chronique ${suffixe}`);
  await page.goto(`/personnage/${personnageId}`);
  await expect(main(page).locator("#livres")).toContainText(`Chronique ${suffixe}`);
});

test("supprimer le personnage retire son lien ; un tiers ne retire rien", async () => {
  const liens = await apiGet(`/bibliotheque/livres/liens/${livreId}`);
  const response = await fetch(`${API_URL}/bibliotheque/livres/liens/${liens[0].id}`, { method: "DELETE", headers: { Authorization: `Bearer ${autre.token}` } });
  expect(response.status).toBe(403);
  await fetch(`${API_URL}/personnages/delete/${personnageId}`, { method: "DELETE", headers: { Authorization: `Bearer ${auteur.token}` } });
  expect((await apiGet(`/bibliotheque/livres/liens/${livreId}`)).map((lien) => lien.entite.type)).toEqual(["religion"]);
});

test("supprimer un livre supprime aussi ses chapitres et ses liens", async () => {
  const id = (await apiPost("/bibliotheque/livres/create", auteur.token, { user_id: 0, author: "Scribe", title: `Brouillon ${suffixe}` })).id;
  await apiPost("/bibliotheque/livres/content/create", auteur.token, { livre_id: id, chapitre: "Prologue", content: "Il était une fois…" });
  await apiPost("/bibliotheque/livres/liens", auteur.token, { livre_id: id, entity_type: "religion", entity_id: religionId });
  expect((await apiGet(`/bibliotheque/livres/contents/read/${id}`)).contents).toHaveLength(1);

  await fetch(`${API_URL}/bibliotheque/livres/delete/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${auteur.token}` } });
  expect((await apiGet(`/bibliotheque/livres/contents/read/${id}`)).contents ?? []).toHaveLength(0);
  expect((await apiGet(`/bibliotheque/livres/entite/religion/${religionId}/list`)).some(({ livre }) => livre.id === id)).toBe(false);
});

test("un livre écrit pour une civilisation lui est lié, et ses dirigeants peuvent le modifier", async ({ page, context }) => {
  const roi = await createSession("roi");
  const civilisationId = (await apiPost("/civilisations/create", roi.token, { title: `Duché ${suffixe}`, is_public: true })).civilisation.id;
  // Création depuis la fiche de la civilisation : le lien est créé aussitôt
  const id = (await apiPost("/bibliotheque/livres/create", roi.token, { user_id: 0, author: "Chancellerie", title: `Lois du duché ${suffixe}`, civilisation_id: civilisationId, is_public: true })).id;
  expect((await apiGet(`/bibliotheque/livres/liens/${id}`)).map((lien) => lien.entite)).toEqual([expect.objectContaining({ type: "civilisation", id: civilisationId })]);
  expect((await apiGet(`/bibliotheque/livres/civilisation/${civilisationId}/list`)).map((livre) => livre.id)).toContain(id);

  // Un Admin de la civilisation, qui n'est pas l'auteur, peut modifier le livre ; un tiers non
  await apiPost(`/civilisations/members/${civilisationId}/add`, roi.token, { user_id: autre.user.id, role: "Admin" });
  const modifier = (token) => fetch(`${API_URL}/bibliotheque/livres/update/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ user_id: 0, author: "Chancellerie", title: `Lois du duché ${suffixe}`, description: "Révisées" }) });
  expect((await modifier(autre.token)).status).toBe(200);
  expect((await modifier(auteur.token)).status).toBe(403);

  await blockExternalRequests(page);
  await signIn(context, autre);
  await page.goto(`/bibliotheque/livre/${id}`);
  await expect(main(page).getByRole("link", { name: `Duché ${suffixe}` })).toHaveAttribute("href", `/civilisation/${civilisationId}`);
  await expect(main(page).getByRole("button", { name: "Lier" })).toBeVisible();
});

test("un administrateur lie le livre d'un autre à n'importe quel personnage, d'où qu'il vienne", async ({ page, context }) => {
  const session = await createSession("bibliothecaire");
  makeAdmin(session.account.username);
  const admin = await refreshSession(session);
  const id = (await apiPost("/bibliotheque/livres/create", autre.token, { user_id: 0, author: "Copiste", title: `Registre ${suffixe}`, is_public: true })).id;
  const personnage = await apiPost("/personnages/create", autre.token, { name: `Berthe ${suffixe}` });
  const personnageAutre = (personnage.personnage ?? personnage).id;

  await blockExternalRequests(page);
  await signIn(context, admin);
  await page.goto(`/bibliotheque/livre/${id}`);
  await main(page).getByRole("button", { name: "Lier" }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toContainText("Administrateur : tout est proposé");
  await dialog.getByLabel("Personnage").check();
  // Personnage d'un autre joueur : proposé, avec le nom de son joueur
  await dialog.locator('select[name="entity_id"]').selectOption({ label: `Berthe ${suffixe} (${autre.account.full_name})` });
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/livre est lié/);
  expect((await apiGet(`/bibliotheque/livres/liens/${id}`)).map((lien) => lien.entite.id)).toContain(personnageAutre);

  // Et à une religion qu'il ne dirige pas
  await apiPost("/bibliotheque/livres/liens", admin.token, { livre_id: id, entity_type: "religion", entity_id: religionAutreId });
});
