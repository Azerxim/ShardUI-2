import { test, expect } from "@playwright/test";
import { apiGet, apiPost, blockExternalRequests, createSession, makeModerateur, readAlert, readAnnouncements, signIn, uniqueSuffix } from "./helpers.js";

// Actions secrètes : scellées à l'heure réelle, existence seule visible du public, lecture tracée des modérateurs RP,
// révélation par l'auteur, par un modérateur (motif obligatoire) ou à la date fixée.
test.describe.configure({ mode: "serial" });

let auteur;
let moderateur;
let personnage;
let action;
const titre = `Piège du Gué ${uniqueSuffix()}`;
const contenu = "Un collet tendu sous le pont, à la tombée de la nuit.";

// Date locale « AAAA-MM-JJTHH:MM:SS » (comme un champ datetime-local), dans `secondes` secondes
const dansSecondes = (secondes) => {
  const date = new Date(Date.now() + secondes * 1000);
  const deux = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}T${deux(date.getHours())}:${deux(date.getMinutes())}:${deux(date.getSeconds())}`;
};

test.beforeAll(async () => {
  auteur = await createSession("secret");
  moderateur = await createSession("secretmodo");
  makeModerateur(moderateur.account.username);
  personnage = (await apiPost("/personnages/create", auteur.token, { name: `Ombre ${uniqueSuffix()}` })).personnage;
});

const main = (page) => page.locator("main.container");

test("une action se scelle au nom de son propre personnage, avec une empreinte", async () => {
  const body = { entity_type: "personnage", entity_id: personnage.id, title: titre, content: contenu };
  action = (await apiPost("/actions/create", auteur.token, body)).action;
  expect(action.code).toMatch(/^AS-\d{4,}$/);
  expect(action.empreinte).toMatch(/^[0-9a-f]{64}$/);
  expect(action.sel).toBeNull(); // publié seulement à la révélation

  // Pas au nom du personnage d'un autre, ni avec une révélation automatique passée
  await expect(apiPost("/actions/create", moderateur.token, body)).rejects.toThrow(/403/);
  await expect(apiPost("/actions/create", auteur.token, { ...body, reveal_at: dansSecondes(-60) })).rejects.toThrow(/400/);

  // Le registre public n'en montre que l'existence
  const publique = (await apiGet(`/actions/read/${action.id}`)).action;
  expect(publique).toEqual({ id: action.id, code: action.code, created_at: action.created_at, empreinte: action.empreinte, revealed: false });
});

test("le public ne voit que le code, la date et l'empreinte d'une action scellée", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/actions-secretes");
  const carte = main(page).locator(`article#${action.code}`);
  await expect(carte).toContainText("Scellée");
  await expect(carte).toContainText("Contenu scellé jusqu'à sa révélation");
  await expect(carte).toContainText(action.empreinte);
  await expect(main(page).getByText(titre)).toHaveCount(0);
  await expect(carte.getByRole("button", { name: /lire|révéler/i })).toHaveCount(0);
});

test("un modérateur RP lit l'action scellée, et sa lecture est tracée", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, moderateur);
  await page.goto("/actions-secretes");
  const carte = main(page).locator(`article#${action.code}`);
  await carte.getByRole("button", { name: "Lire (lecture tracée)" }).click();
  expect(await readAlert(page)).toMatch(/sera enregistrée/i);
  await expect(carte).toContainText(contenu);

  // L'auteur voit aussitôt qui a lu
  const [mienne] = (await (await fetch(`${process.env.SHARD_TEST_API_URL ?? "http://127.0.0.1:8011/api"}/actions/mine`, { headers: { Authorization: `Bearer ${auteur.token}` } })).json())
    .filter((item) => item.id === action.id);
  expect(mienne.lectures).toHaveLength(1);
  expect(mienne.lectures[0].role).toBe("modérateur RP");
});

test("l'auteur révèle son action : contenu, empreinte intacte et lectures deviennent publics", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, auteur);
  await page.goto("/actions-secretes");
  const carte = main(page).locator(`article#${action.code}`);
  await expect(carte).toContainText(contenu);
  await expect(carte).toContainText(/Lue 1 fois/);
  await carte.getByRole("button", { name: "Révéler", exact: true }).click();
  // SweetAlert réutilise la même fenêtre pour l'alerte de succès : on attend celle-ci plutôt que la fermeture
  await expect(page.locator(".swal2-popup")).toContainText(/définitivement/i);
  await page.locator(".swal2-confirm").click();
  const succes = page.locator(".swal2-popup.swal2-icon-success");
  await expect(succes).toContainText(/révélée/i);
  await succes.locator(".swal2-confirm").click();

  const publique = (await apiGet(`/actions/read/${action.id}`)).action;
  expect(publique).toMatchObject({ revealed: true, reveal_mode: "auteur", title: titre, content: contenu });
  expect(publique.sel).toMatch(/^[0-9a-f]{32}$/);
  expect(publique.lectures).toHaveLength(1);
  expect(readAnnouncements().some((annonce) => annonce.channel === "actions" && annonce.content.includes(action.code))).toBe(true);

  // Vue d'un visiteur : l'empreinte recalculée dans le navigateur correspond
  const visiteur = await context.browser().newPage();
  await blockExternalRequests(visiteur);
  await visiteur.goto(`/actions-secretes#${action.code}`);
  const vue = visiteur.locator(`article#${action.code}`);
  await expect(vue).toContainText(titre);
  await expect(vue).toContainText(personnage.name);
  await expect(vue.locator(".badge", { hasText: "Intacte" })).toBeVisible();
  await expect(vue).toContainText(/avant sa révélation/);
  await visiteur.close();
});

test("le bouton « Action » de la liste des guerres ouvre le formulaire de dépôt", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, auteur);
  await page.goto("/guerres");
  await main(page).getByRole("link", { name: "Sceller une action secrète" }).click();
  await page.waitForURL("**/actions-secretes?nouvelle=1");
  await expect(page.locator("dialog[open]")).toContainText("Sceller une action");
  await expect(page.locator('dialog[open] select[name="auteur"]')).toContainText(personnage.name);
});

test("révélation par un modérateur RP (motif obligatoire) et révélation automatique à la date fixée", async () => {
  const base = { entity_type: "personnage", entity_id: personnage.id, content: "Marche de nuit vers le nord." };
  const parModerateur = (await apiPost("/actions/create", auteur.token, { ...base, title: "Marche de nuit" })).action;
  await expect(apiPost(`/actions/${parModerateur.id}/reveler`, moderateur.token, {})).rejects.toThrow(/400/);
  const revelee = (await apiPost(`/actions/${parModerateur.id}/reveler`, moderateur.token, { motif: "Litige sur la marche" })).action;
  expect(revelee).toMatchObject({ revealed: true, reveal_mode: "moderateur", reveal_motif: "Litige sur la marche" });

  // Un autre joueur ne peut pas révéler
  const autre = await createSession("secretautre");
  const auto = (await apiPost("/actions/create", auteur.token, { ...base, title: "Signal de feu", reveal_at: dansSecondes(2) })).action;
  await expect(apiPost(`/actions/${auto.id}/reveler`, autre.token, {})).rejects.toThrow(/403/);
  expect((await apiGet(`/actions/read/${auto.id}`)).action.revealed).toBe(false);
  await new Promise((resolve) => setTimeout(resolve, 3000));
  expect((await apiGet(`/actions/read/${auto.id}`)).action).toMatchObject({ revealed: true, reveal_mode: "date", title: "Signal de feu" });
});
