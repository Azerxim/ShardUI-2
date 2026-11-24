import { test, expect } from "@playwright/test";
import { addDiscordChannel, API_URL, setJournalOwner, apiGet, apiPost, blockExternalRequests, createSession, makeAdmin, readAlert, readDiscordChannels, signIn, uniqueSuffix } from "./helpers.js";

// Journaux : catégorie, couleur, et salon Discord créé par le site ou existant lié ; à la suppression, salon supprimé
// ou seulement délié. Les salons du serveur sont simulés (SHARD_FAKE_DISCORD_CHANNELS), jamais le vrai Discord.
test.describe.configure({ mode: "serial" });

const suffixe = uniqueSuffix();
let auteur;
let admin;
// Catégorie Discord des journaux de l'API de test (platforms.discord.categories.journaux), lue sur un salon créé
let categorieJournaux;

const api = async (method, chemin, token, body) => fetch(`${API_URL}${chemin}`, {
  method,
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: body ? JSON.stringify(body) : undefined,
});
const journal = (champs) => ({ user_id: 0, author: "Crieur", title: `Journal ${suffixe}`, published_date: "2026-05-01", ...champs });

test.beforeAll(async () => {
  auteur = await createSession("gazetier");
  admin = await createSession("archiviste");
  makeAdmin(admin.account.username);
});

test("le site crée le salon dans la catégorie Discord des journaux, et range le journal dans sa catégorie", async () => {
  const cree = await apiPost("/bibliotheque/journaux/create", auteur.token, journal({ title: `Gazette du port ${suffixe}`, categorie: "gazette" }));
  expect(cree.categorie).toBe("gazette");
  expect(cree.salon_cree).toBe(true);
  const salon = readDiscordChannels()[cree.uid];
  expect(salon.name).toBe(`gazette-du-port-${suffixe}`.slice(0, 32));
  expect(salon.category_id).toBeTruthy();
  categorieJournaux = salon.category_id;

  // Sans catégorie : « divers » ; catégorie inconnue refusée
  expect((await apiPost("/bibliotheque/journaux/create", auteur.token, journal({ title: `Sans rang ${suffixe}` }))).categorie).toBe("divers");
  expect((await api("POST", "/bibliotheque/journaux/create", auteur.token, journal({ categorie: "almanach" }))).status).toBe(400);
  expect(await apiGet("/bibliotheque/journaux/categories")).toMatchObject({ gazette: "Gazette", divers: "Divers" });
  expect(Object.keys(await apiGet("/bibliotheque/journaux/categories"))[0]).toBe("monde");
});

test("seuls les administrateurs classent un journal dans « Monde »", async () => {
  expect((await api("POST", "/bibliotheque/journaux/create", auteur.token, journal({ categorie: "monde" }))).status).toBe(403);
  const monde = await apiPost("/bibliotheque/journaux/create", admin.token, journal({ title: `Annales ${suffixe}`, categorie: "monde", user_id: 0 }));
  expect(monde.categorie).toBe("monde");

  // Un joueur ne passe pas son journal dans « Monde »…
  const sien = await apiPost("/bibliotheque/journaux/create", auteur.token, journal({ title: `Gazette ${suffixe}`, categorie: "gazette" }));
  expect((await api("PUT", `/bibliotheque/journaux/update/${sien.id}`, auteur.token, journal({ categorie: "monde" }))).status).toBe(403);
  // … mais garde « Monde » sur un journal qu'un administrateur y a classé
  setJournalOwner(monde.id, auteur.user.id);
  const garde = await api("PUT", `/bibliotheque/journaux/update/${monde.id}`, auteur.token, journal({ title: `Annales revues ${suffixe}`, categorie: "monde" }));
  expect(garde.status).toBe(200);
  expect((await garde.json()).journal.categorie).toBe("monde");
});

test("seul un administrateur lie un salon existant, textuel et pas encore lié", async () => {
  const libre = `7${Date.now()}`;
  const staff = `8${Date.now()}`;
  const vocal = `6${Date.now()}`;
  addDiscordChannel(libre, { name: "carnet-libre", category_id: categorieJournaux });
  addDiscordChannel(staff, { name: "staff", category_id: "42" });
  addDiscordChannel(vocal, { name: "vocal", category_id: categorieJournaux, type: "voice" });

  // Un joueur ne lie aucun salon, même rangé dans la catégorie des journaux
  expect((await api("POST", "/bibliotheque/journaux/create", auteur.token, journal({ salon: "lier", uid: libre }))).status).toBe(403);
  expect(readDiscordChannels()[libre]).toBeTruthy();

  expect((await api("POST", "/bibliotheque/journaux/create", admin.token, journal({ salon: "lier", uid: "" }))).status).toBe(400);
  expect((await api("POST", "/bibliotheque/journaux/create", admin.token, journal({ salon: "lier", uid: "123" }))).status).toBe(404);
  expect((await api("POST", "/bibliotheque/journaux/create", admin.token, journal({ salon: "lier", uid: vocal }))).status).toBe(400);

  const lie = await apiPost("/bibliotheque/journaux/create", admin.token, journal({ title: `Carnet lié ${suffixe}`, salon: "lier", uid: libre, categorie: "carnet" }));
  expect(lie.uid).toBe(libre);
  expect(lie.salon_cree).toBe(false);
  // Un salon n'alimente qu'un journal
  expect((await api("POST", "/bibliotheque/journaux/create", admin.token, journal({ salon: "lier", uid: libre }))).status).toBe(409);
  // N'importe quel salon textuel du serveur
  expect((await apiPost("/bibliotheque/journaux/create", admin.token, journal({ salon: "lier", uid: staff }))).uid).toBe(staff);
  // L'import en base sans vérification est réservé aux administrateurs
  expect((await api("POST", "/bibliotheque/journaux/create/db", auteur.token, journal({ uid: "999" }))).status).toBe(403);

  // Modifier un journal lié ne renomme pas le salon de son serveur
  await api("PUT", `/bibliotheque/journaux/update/${lie.id}`, admin.token, journal({ title: `Carnet renommé ${suffixe}` }));
  expect(readDiscordChannels()[libre].name).toBe("carnet-libre");

  // Supprimer un journal lié garde toujours le salon, même si l'on demande sa suppression
  const reponse = await (await api("DELETE", `/bibliotheque/journaux/delete/${lie.id}`, admin.token)).json();
  expect(reponse.salon).toBe("delie");
  expect(readDiscordChannels()[libre]).toBeTruthy();
});

test("depuis la bibliothèque, un joueur publie un journal classé, coloré et daté dans le RP", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, auteur);
  await page.goto("/bibliotheque");
  await page.getByRole("button", { name: /^Nouveau Journal/ }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('[name="title"]').fill(`Chronique du Nord ${suffixe}`);
  await dialog.locator('[name="author"]').fill("Le scribe");
  // Ni « Monde », ni salon existant à lier pour un joueur : le site crée le salon
  await expect(dialog.getByRole("combobox").first().locator("option", { hasText: "Monde" })).toHaveCount(0);
  await expect(dialog.locator('input[name="salon"]')).toHaveCount(0);
  await expect(dialog.locator('[name="uid"]')).toHaveCount(0);
  await dialog.getByRole("combobox").first().selectOption({ label: "Chronique" });
  await dialog.locator('input[type="color"]').fill("#1f7a55");
  // Date de publication : rien d'office, saisie en date RP
  const date = dialog.locator('input[type="date"]');
  await expect(date).toHaveValue("");
  await date.fill("0003-03-12");
  await expect(dialog.getByText("Dans le RP : 12 mars de l'an 3")).toBeVisible();
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toContain("Journal créé");

  const cree = (await apiGet("/bibliotheque/journaux/list?limit=10000")).find((j) => j.title === `Chronique du Nord ${suffixe}`);
  expect(cree).toMatchObject({ categorie: "chronique", cover_color: "#1f7a55", salon_cree: true });
  expect(readDiscordChannels()[cree.uid]).toBeTruthy();

  // Filtre par catégorie (« Monde » toujours en tête), badge, date RP et pastille colorée sur la carte
  await page.reload();
  await expect(page.getByLabel("Catégorie").locator("option").nth(1)).toHaveText("Monde");
  await page.getByLabel("Catégorie").selectOption({ label: "Chronique" });
  const carte = page.getByRole("link", { name: new RegExp(`Chronique du Nord ${suffixe}`) });
  await expect(carte).toBeVisible();
  await expect(carte).toContainText("Chronique");
  await expect(carte).toContainText("Publié le 12 mars de l'an 3");
  await expect(carte.locator('[style*="background-color"]').first()).toHaveCSS("background-color", "rgb(31, 122, 85)");
  await page.getByLabel("Catégorie").selectOption({ label: "Gazette" });
  await expect(carte).toHaveCount(0);
  await page.getByLabel("Catégorie").selectOption({ label: "Toutes les catégories" });

  // Les journaux « Monde » passent avant les autres, quel que soit le tri
  for (const tri of ["Titre : A → Z", "Titre : Z → A", "Ajoutés récemment"]) {
    await page.getByLabel("Trier").selectOption({ label: tri });
    const cartes = page.locator("a[href*='/bibliotheque/journal/']");
    await expect(cartes.first()).toContainText("Monde");
  }
});

test("depuis la bibliothèque, un administrateur lie un salon existant à un journal « Monde »", async ({ page, context }) => {
  const salon = `5${Date.now()}`;
  addDiscordChannel(salon, { name: "annales-du-monde", category_id: "42" });
  await blockExternalRequests(page);
  await signIn(context, admin);
  await page.goto("/bibliotheque");
  await page.getByRole("button", { name: /^Nouveau Journal/ }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('[name="title"]').fill(`Annales du monde ${suffixe}`);
  await dialog.locator('[name="author"]').fill("Les archivistes");
  await dialog.getByRole("combobox").first().selectOption({ label: "Monde" });
  // L'identifiant du salon n'est demandé que pour lier un salon
  await expect(dialog.locator('[name="uid"]')).toHaveCount(0);
  await dialog.locator('input[name="salon"][value="lier"]').check();
  await dialog.locator('[name="uid"]').fill(salon);
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toContain("Journal créé");

  const cree = (await apiGet("/bibliotheque/journaux/list?limit=10000")).find((j) => j.uid === salon);
  expect(cree).toMatchObject({ categorie: "monde", salon_cree: false });
  await page.goto(`/bibliotheque/journal/${cree.id}`);
  await expect(page.getByText("Alimenté par un salon Discord existant, lié au site")).toBeVisible();
});

test("à la suppression, le salon créé par le site est supprimé ou seulement délié, au choix", async ({ page, context }) => {
  const garde = await apiPost("/bibliotheque/journaux/create", auteur.token, journal({ title: `A garder ${suffixe}` }));
  const jete = await apiPost("/bibliotheque/journaux/create", auteur.token, journal({ title: `A jeter ${suffixe}` }));
  await blockExternalRequests(page);
  await signIn(context, auteur);

  const supprimer = async (id, garderSalon) => {
    await page.goto(`/bibliotheque/journal/${id}`);
    await page.getByRole("button", { name: "Modifier" }).click();
    await page.locator("dialog[open] .btn-error").click();
    const question = page.locator(".swal2-popup");
    await expect(question).toContainText("Supprimer ce journal ?");
    const caseSalon = question.getByRole("checkbox");
    await expect(caseSalon).toBeChecked();
    if (garderSalon) await caseSalon.uncheck();
    await page.locator(".swal2-confirm").click();
    await expect(page.locator(".swal2-popup.swal2-icon-success")).toBeVisible();
    return (await page.locator(".swal2-popup").innerText()).replace(/\s+/g, " ");
  };

  expect(await supprimer(garde.id, true)).toContain("son salon Discord est conservé");
  expect(readDiscordChannels()[garde.uid]).toBeTruthy();
  expect(await supprimer(jete.id, false)).toContain("son salon Discord ont été supprimés");
  expect(readDiscordChannels()[jete.uid]).toBeUndefined();
});
