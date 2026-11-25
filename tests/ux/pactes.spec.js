import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, readAnnouncements, signIn, uniqueSuffix } from "./helpers.js";

// Pactes secrets : une civilisation, une alliance ou un commerce propose un pacte à une autre partie, qui le signe ou le
// refuse. Non signé, il n'existe que pour les deux parties ; signé, il est scellé au registre ; chaque partie peut le révéler.
test.describe.configure({ mode: "serial" });

const suffix = uniqueSuffix();
const noms = { civilisation: `Marche ${suffix}`, alliance: `Ligue ${suffix}`, commerce: `Comptoir ${suffix}` };
const titre = `Pacte du sel ${suffix}`;
const termes = "La Ligue protège les convois du Comptoir ; le Comptoir lui vend le sel à moitié prix.";

let proposant;
let marchand;
let intrus;
let civilisation;
let allianceId;
let commerceId;
let pacte;

const main = (page) => page.locator("main.container");
const mesActions = async (session) => (await fetch(`${API_URL}/actions/mine`, { headers: { Authorization: `Bearer ${session.token}` } })).json();
const notifications = async (session) => (await (await fetch(`${API_URL}/notifications/mine`, { headers: { Authorization: `Bearer ${session.token}` } })).json()).notifications;

test.beforeAll(async () => {
  proposant = await createSession("pacteA");
  marchand = await createSession("pacteB");
  intrus = await createSession("pacteC");
  civilisation = (await apiPost("/civilisations/create", proposant.token, { title: noms.civilisation, is_public: true })).civilisation;
  allianceId = (await apiPost("/alliances/create", proposant.token, { title: noms.alliance, type: "Diplomatique", civilisation_id: civilisation.id })).alliance.id;
  commerceId = (await apiPost("/commerces/create", marchand.token, { title: noms.commerce, is_public: true })).commerce.id;
});

test("une alliance propose un pacte à un commerce : seules les deux parties le voient", async () => {
  const body = { entity_type: "alliance", entity_id: allianceId, partie_type: "commerce", partie_id: commerceId, title: titre, content: termes };
  pacte = (await apiPost("/actions/pactes/create", proposant.token, body)).action;
  expect(pacte.code).toMatch(/^AS-\d{4,}$/);
  expect(pacte.pacte).toMatchObject({ statut: "en_attente", partie: { type: "commerce", id: commerceId, title: noms.commerce } });

  // Pas au nom d'une alliance qu'on ne mène pas, ni avec soi-même
  await expect(apiPost("/actions/pactes/create", intrus.token, body)).rejects.toThrow(/403/);
  await expect(apiPost("/actions/pactes/create", proposant.token, { ...body, partie_type: "alliance", partie_id: allianceId })).rejects.toThrow(/400/);

  // Absent du registre public tant qu'il n'est pas signé
  expect((await apiGet("/actions/list")).some((action) => action.id === pacte.id)).toBe(false);
  expect((await fetch(`${API_URL}/actions/read/${pacte.id}`)).status).toBe(404);

  // Le commerce est prévenu et peut signer ; un tiers ne peut ni signer ni le voir
  expect((await notifications(marchand)).some((notification) => notification.title.includes(titre))).toBe(true);
  const [recu] = (await mesActions(marchand)).filter((action) => action.id === pacte.id);
  expect(recu).toMatchObject({ peut_signer: true, content: termes });
  await expect(apiPost(`/actions/${pacte.id}/signer`, intrus.token, {})).rejects.toThrow(/403/);
  expect((await mesActions(intrus)).some((action) => action.id === pacte.id)).toBe(false);
  // Pas encore révélable
  await expect(apiPost(`/actions/${pacte.id}/reveler`, proposant.token, {})).rejects.toThrow(/400/);
});

test("le commerce signe le pacte depuis la page : il entre au registre comme une action scellée", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, marchand);
  await page.goto("/actions-secretes");
  await expect(main(page).getByRole("heading", { name: "Pactes à signer" })).toBeVisible();
  const carte = main(page).locator(`article#${pacte.code}`);
  await expect(carte).toContainText(noms.alliance);
  await expect(carte).toContainText(noms.commerce);
  await expect(carte).toContainText("En attente de signature");
  await carte.getByRole("button", { name: "Signer le pacte" }).click();
  await expect(page.locator(".swal2-popup")).toContainText(`Au nom de ${noms.commerce}`);
  await page.locator(".swal2-confirm").click();
  const succes = page.locator(".swal2-popup.swal2-icon-success");
  await expect(succes).toContainText(/signé et scellé/i);
  await succes.locator(".swal2-confirm").click();
  await expect(carte).toContainText(`Signé par ${noms.commerce}`);

  // Le public n'en voit que l'existence : ni les parties, ni que c'est un pacte
  const publique = (await apiGet(`/actions/read/${pacte.id}`)).action;
  expect(publique).toEqual({ id: pacte.id, code: pacte.code, created_at: pacte.created_at, empreinte: pacte.empreinte, revealed: false });
  expect((await notifications(proposant)).some((notification) => notification.title === `Pacte ${pacte.code} signé`)).toBe(true);
  // Déjà signé : plus de réponse possible
  await expect(apiPost(`/actions/${pacte.id}/refuser`, marchand.token, {})).rejects.toThrow(/400/);
});

test("proposer un pacte avec le formulaire, puis le refus et le retrait", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, proposant);
  await page.goto("/actions-secretes");
  await main(page).getByRole("button", { name: "Proposer un pacte" }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('select[name="auteur"]').selectOption({ label: `Civilisation · ${noms.civilisation}` });
  await dialog.locator('select[name="partie"]').selectOption({ label: `Commerce · ${noms.commerce}` });
  await dialog.locator('input[name="title"]').fill(`Trêve marchande ${suffix}`);
  await dialog.locator('textarea[name="content"]').fill("Aucun péage sur la route du Comptoir pendant un an.");
  await dialog.locator('button[type="submit"]').click();
  const succes = page.locator(".swal2-popup.swal2-icon-success");
  await expect(succes).toContainText(/proposé/i);
  await succes.locator(".swal2-confirm").click();

  const [propose] = (await mesActions(proposant)).filter((action) => action.title === `Trêve marchande ${suffix}`);
  expect(propose.pacte).toMatchObject({ statut: "en_attente", partie: { id: commerceId } });
  expect(propose.peut_retirer).toBe(true);
  // Celui qui propose ne signe pas
  await expect(apiPost(`/actions/${propose.id}/signer`, proposant.token, {})).rejects.toThrow(/403/);

  // Refus avec motif : vu des deux parties, jamais public
  await apiPost(`/actions/${propose.id}/refuser`, marchand.token, { motif: "Les péages font vivre la route." });
  await page.reload();
  const refuse = main(page).locator(`article#${propose.code}`);
  await expect(refuse).toContainText("Refusé");
  await expect(refuse).toContainText("Les péages font vivre la route.");
  expect((await apiGet("/actions/list")).some((action) => action.id === propose.id)).toBe(false);

  // Retrait d'une autre proposition par la partie qui l'a faite
  const retire = (await apiPost("/actions/pactes/create", proposant.token, {
    entity_type: "civilisation", entity_id: civilisation.id, partie_type: "commerce", partie_id: commerceId, title: `Dot ${suffix}`, content: "Une dot.",
  })).action;
  await page.reload();
  const carte = main(page).locator(`article#${retire.code}`);
  await carte.getByRole("button", { name: "Retirer la proposition" }).click();
  await page.locator(".swal2-confirm").click();
  await expect(page.locator(".swal2-popup.swal2-icon-success")).toContainText(/retirée/i);
  await page.locator(".swal2-popup.swal2-icon-success .swal2-confirm").click();
  await expect(carte).toContainText("Retiré");
  await expect(apiPost(`/actions/${retire.id}/signer`, marchand.token, {})).rejects.toThrow(/400/);
});

test("chaque partie peut révéler le pacte signé : ses deux parties deviennent publiques", async ({ browser }) => {
  // La partie invitée trahit le secret, sans l'accord de l'autre
  const revele = (await apiPost(`/actions/${pacte.id}/reveler`, marchand.token, {})).action;
  expect(revele).toMatchObject({ revealed: true, reveal_mode: "auteur", content: termes, pacte: { statut: "signe" } });
  const annonce = readAnnouncements().find((item) => item.channel === "actions" && item.content.includes(pacte.code));
  expect(annonce.content).toContain("Pacte secret");
  expect(annonce.content).toContain(noms.alliance);

  const context = await browser.newContext({ locale: "fr-FR" });
  await blockExternalRequests(context);
  const page = await context.newPage();
  await page.goto(`/actions-secretes#${pacte.code}`);
  const carte = main(page).locator(`article#${pacte.code}`);
  await expect(carte).toContainText(titre);
  await expect(carte).toContainText("Pacte secret");
  await expect(carte.getByRole("link", { name: noms.alliance })).toHaveAttribute("href", `/alliance/${allianceId}`);
  await expect(carte.getByRole("link", { name: noms.commerce })).toHaveAttribute("href", `/commerce/${commerceId}`);
  await expect(carte.locator(".badge", { hasText: "Intacte" })).toBeVisible();
  await context.close();
});
