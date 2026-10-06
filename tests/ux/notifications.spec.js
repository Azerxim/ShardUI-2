import { test, expect } from "@playwright/test";
import { API_URL, apiPost, blockExternalRequests, createSession, makeModerateur, signIn, uniqueSuffix } from "./helpers.js";

// Cloche de la barre : notifications écrites par l'API au moment des faits (déclaration à valider, lecture tracée…),
// lues une à une en les ouvrant, ou toutes d'un coup.
test.describe.configure({ mode: "serial" });

const suffixe = uniqueSuffix();
let joueur;
let moderateur;
let guerre;
let action;

const apiPut = async (path, token, body = {}) => {
  const response = await fetch(`${API_URL}${path}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`PUT ${path} : ${response.status}`);
  return response.json();
};
const notificationsDe = async (session) => (await fetch(`${API_URL}/notifications/mine`, { headers: { Authorization: `Bearer ${session.token}` } })).json();
const cloche = (page) => page.locator(".navbar").getByRole("button", { name: /^Notifications/ });
const panneau = (page) => page.locator("#panneau-notifications");

test.beforeAll(async () => {
  joueur = await createSession("heraut");
  const voisin = await createSession("rival");
  moderateur = await createSession("veilleur");
  makeModerateur(moderateur.account.username);
  const civ = async (session, nom) => (await apiPost("/civilisations/create", session.token, { title: `${nom} ${suffixe}`, is_public: true })).civilisation.id;
  const nord = await civ(joueur, "Bastion");
  const sud = await civ(voisin, "Vallon");
  guerre = (await apiPost("/guerres/declarer", joueur.token, { title: `Guerre de la cloche ${suffixe}`, attaquant_id: nord, defenseur_id: sud, casus_belli: "Une cloche volée" })).guerre;
  action = (await apiPost("/actions/create", joueur.token, { title: `Embuscade ${suffixe}`, content: "Des archers dans le clocher", entity_type: "civilisation", entity_id: nord })).action;
});

test("le modérateur ouvre la déclaration à valider depuis la cloche", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, moderateur);
  await page.goto("/");
  await expect(cloche(page)).toHaveAccessibleName(/non lue/);
  await cloche(page).click();
  const notification = panneau(page).getByRole("link", { name: new RegExp(`Déclaration de guerre à valider : Guerre de la cloche ${suffixe}`) });
  await expect(notification).toBeVisible();
  await notification.click();
  await expect(page).toHaveURL(new RegExp(`/guerre/${guerre.id}$`));

  const { notifications } = await notificationsDe(moderateur);
  expect(notifications.find((n) => n.title.includes(`Guerre de la cloche ${suffixe}`))?.lue).toBe(true);
});

test("l'auteur apprend la lecture tracée et la validation, puis marque tout comme lu", async ({ page, context }) => {
  await apiPut(`/guerres/${guerre.id}/valider`, moderateur.token, { note: "Le clocher est en jeu" });
  await apiPost(`/actions/lire/${action.id}`, moderateur.token);

  await blockExternalRequests(page);
  await signIn(context, joueur);
  await page.goto("/");
  await expect(cloche(page)).toHaveAccessibleName("Notifications, 2 non lues");
  await cloche(page).click();
  await expect(panneau(page)).toContainText(`La guerre commence : Guerre de la cloche ${suffixe}`);
  await expect(panneau(page)).toContainText(`Lecture tracée de votre action ${action.code}`);
  await expect(panneau(page)).toContainText(`${moderateur.account.full_name} (modérateur RP) a lu`);

  await panneau(page).getByRole("button", { name: "Tout marquer comme lu" }).click();
  await expect(panneau(page).getByRole("button", { name: "Tout marquer comme lu" })).toHaveCount(0);
  await expect(cloche(page)).toHaveAccessibleName("Notifications");
  // Le panneau se met à jour avant la réponse de l'API : on attend qu'elle l'ait enregistré
  await expect.poll(async () => (await notificationsDe(joueur)).non_lues).toBe(0);
});

test("une notification n'appartient qu'à son destinataire, et la cloche est absente sans session", async ({ page }) => {
  const { notifications } = await notificationsDe(joueur);
  const autre = await fetch(`${API_URL}/notifications/lue/${notifications[0].id}`, { method: "PUT", headers: { Authorization: `Bearer ${moderateur.token}` } });
  expect(autre.status).toBe(404);
  expect((await fetch(`${API_URL}/notifications/mine`)).status).toBe(401);

  await blockExternalRequests(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Connexion ou inscription" })).toBeVisible();
  await expect(cloche(page)).toHaveCount(0);
});

test("sur téléphone, la cloche laisse sa place : les notifications s'ouvrent depuis le menu", async ({ page, context }) => {
  await apiPost(`/actions/lire/${action.id}`, moderateur.token);
  await blockExternalRequests(page);
  await signIn(context, joueur);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(cloche(page)).toBeHidden();
  await page.locator(".navbar").getByRole("button", { name: "Menu" }).click();
  await page.locator("#panneau-menu").getByRole("button", { name: /^Notifications/ }).click();
  await expect(panneau(page)).toBeInViewport();
  await expect(panneau(page)).toContainText(`Lecture tracée de votre action ${action.code}`);
});
