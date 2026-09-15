import { test, expect } from "@playwright/test";
import { apiPost, blockExternalRequests, createDiscordJournal, createSession, linkDiscordAccount, linkPlatform, makeModerateur, readAlert, setJournalMessages, signIn, uniqueSuffix } from "./helpers.js";

// Personnages v1 : création libre, profil, et signature des messages de journaux par leur auteur Discord.
// Les messages du salon sont fournis par tests/ux/.env-api/fake-journal-messages.json (aucun appel à Discord).
test.describe.configure({ mode: "serial" });

const suffix = uniqueSuffix();
const nom = `Aldric ${suffix}`;
const journalTitre = `Chroniques ${suffix}`;
const channel = `9${Date.now()}`;
const discordJoueur = `7${Date.now()}`;
const discordVoisin = `8${Date.now()}`;

let joueur;
let voisin;
let journalId;
let personnageId;

const main = (page) => page.locator("main.container");

test.beforeAll(async () => {
  joueur = await createSession("perso");
  voisin = await createSession("persoV");
  linkDiscordAccount(joueur.user.id, discordJoueur);
  journalId = createDiscordJournal({ title: journalTitre, uid: channel, userId: voisin.user.id });
  setJournalMessages(channel, [
    { id: "1001", author: { id: discordJoueur, name: "aldric_irl", is_bot: false }, content: "Je prête serment devant le conseil.", timestamp: "2026-05-01T10:00:00+00:00", edited_at: null, attachments: [], reactions: {} },
    { id: "1002", author: { id: discordVoisin, name: "voisin_irl", is_bot: false }, content: "Le conseil en prend acte.", timestamp: "2026-05-01T12:00:00+00:00", edited_at: null, attachments: [], reactions: {} },
  ]);
});

async function open(browser, session, options = {}) {
  const context = await browser.newContext({ locale: "fr-FR", ...options });
  await blockExternalRequests(context);
  if (session) await signIn(context, session);
  return { context, page: await context.newPage() };
}

test("un modérateur RP ajoute une espèce, proposée ensuite sur les fiches", async ({ browser }) => {
  const moderateur = await createSession("persoModo");
  makeModerateur(moderateur.account.username);
  const espece = `Nain ${suffix}`;
  const { context, page } = await open(browser, { ...moderateur, user: { ...moderateur.user, is_moderateur: true } });
  await page.goto("/admin/personnages");
  await expect(main(page).getByText("Elfe", { exact: true })).toBeVisible();

  await main(page).getByRole("button", { name: "Ajouter" }).first().click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('input[name="title"]').fill(espece);
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/a été ajoutée/);
  await expect(main(page).getByText(espece, { exact: true })).toBeVisible();

  await page.goto("/personnages");
  await main(page).getByRole("button", { name: "Nouveau personnage" }).click();
  await expect(page.locator('dialog[open] select[name="espece_id"] option', { hasText: espece })).toHaveCount(1);
  await context.close();
});

test("un joueur ne peut pas gérer les espèces et classes", async ({ browser }) => {
  const { context, page } = await open(browser, joueur);
  await page.goto("/admin/personnages");
  await expect(page.getByText("Seuls les administrateurs et modérateurs RP gèrent les espèces et les classes.")).toBeVisible();
  await context.close();
});

test("un joueur crée un personnage, sans validation", async ({ browser }) => {
  const { context, page } = await open(browser, joueur);
  await page.goto("/personnages");
  await expect(main(page).getByText(/autant de personnages qu'il le souhaite, sans validation/)).toBeVisible();
  await main(page).getByRole("button", { name: "Nouveau personnage" }).click();

  const dialog = page.locator("dialog[open]");
  await dialog.locator('input[name="name"]').fill(nom);
  await dialog.locator('select[name="espece_id"]').selectOption({ label: "Elfe" });
  await dialog.locator('select[name="classe_id"]').selectOption({ label: "Mage" });
  await dialog.locator('input[name="grade"]').fill("Chevalier errant");
  await dialog.locator('textarea[name="description"]').fill("Parti de sa forêt natale.");
  await dialog.locator('button[type="submit"]').click();

  expect(await readAlert(page)).toMatch(/prêt à entrer dans l'histoire/);
  await page.waitForURL(/\/personnage\/\d+$/);
  personnageId = Number(page.url().split("/").pop());
  await expect(main(page).locator("h1")).toContainText(nom);
  await expect(main(page).getByText("Chevalier errant")).toBeVisible();
  await expect(main(page).getByText("Espèce : Elfe · Classe : Mage")).toBeVisible();
  await expect(main(page).getByText(/utilisez « Associer à un personnage »/)).toBeVisible();
  await context.close();
});

test("le personnage prend le skin du compte Minecraft lié", async ({ browser }) => {
  const { context, page } = await open(browser, joueur);
  await page.goto(`/personnage/${personnageId}`);
  const modifier = async () => {
    await main(page).getByRole("button", { name: "Modifier" }).first().click();
    const dialog = page.locator("dialog[open]");
    await dialog.getByLabel("Skin de mon compte Minecraft").check();
    await dialog.locator('button[type="submit"]').click();
    return readAlert(page);
  };

  // Sans compte Minecraft lié : refus expliqué
  expect(await modifier()).toMatch(/Liez d'abord un compte Minecraft/);
  await page.keyboard.press("Escape");

  linkPlatform(joueur.user.id, "microsoft", `mc${suffix}`);
  await page.reload();
  expect(await modifier()).toMatch(/mis à jour/);
  await expect(main(page).getByRole("img", { name: `Skin Minecraft de ${nom}` })).toHaveAttribute("src", new RegExp(`mc-heads\\.net/body/mc${suffix}`));
  await context.close();
});

test("le personnage apparaît sur le profil et dans la liste", async ({ browser }) => {
  const { context, page } = await open(browser, joueur);
  await page.goto("/profil");
  const section = main(page).locator("section", { hasText: "Mes personnages" });
  await expect(section.getByRole("link", { name: new RegExp(nom) })).toBeVisible();

  await page.goto("/personnages");
  await main(page).getByRole("searchbox", { name: "Rechercher un personnage" }).fill(suffix);
  await expect(main(page).getByRole("link", { name: new RegExp(nom) })).toHaveCount(1);
  await context.close();
});

test("l'auteur Discord associe son message de journal à son personnage", async ({ browser }) => {
  const { context, page } = await open(browser, joueur);
  await page.goto(`/bibliotheque/journal/${journalId}`);
  await expect(main(page).getByText("Je prête serment devant le conseil.")).toBeVisible();

  // Seul son propre message propose l'association
  const associer = main(page).getByRole("button", { name: "Associer à un personnage" });
  await expect(associer).toHaveCount(1);
  await associer.click();

  const dialog = page.locator("dialog[open]");
  await dialog.locator('select[name="personnage_id"]').selectOption({ label: nom });
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(new RegExp(`signé par ${nom}`));

  await expect(main(page).getByRole("link", { name: nom, exact: true })).toBeVisible();
  await expect(main(page).getByText("joué par aldric_irl")).toBeVisible();
  await expect(main(page).getByRole("button", { name: "Changer de personnage" })).toBeVisible();
  await context.close();
});

test("la fiche du personnage liste le message signé", async ({ browser }) => {
  const { context, page } = await open(browser, null);
  await page.goto(`/personnage/${personnageId}`);
  await expect(main(page).getByText("Je prête serment devant le conseil.")).toBeVisible();
  await expect(main(page).getByRole("link", { name: journalTitre })).toBeVisible();
  await expect(main(page).getByRole("button", { name: "Retirer" })).toHaveCount(0);
  await context.close();
});

test("un visiteur voit le personnage dans le journal sans pouvoir associer", async ({ browser }) => {
  const { context, page } = await open(browser, null);
  await page.goto(`/bibliotheque/journal/${journalId}`);
  await expect(main(page).getByRole("link", { name: nom, exact: true })).toBeVisible();
  await expect(main(page).getByText("voisin_irl")).toBeVisible();
  await expect(main(page).getByRole("button", { name: /Associer à un personnage|Changer de personnage/ })).toHaveCount(0);
  await context.close();
});

test("sans compte Discord lié, le journal explique comment signer ses messages", async ({ browser }) => {
  const { context, page } = await open(browser, voisin);
  await page.goto(`/bibliotheque/journal/${journalId}`);
  const note = main(page).getByRole("note").filter({ hasText: "Liez votre compte Discord" });
  await expect(note).toBeVisible();
  await expect(note.getByRole("link", { name: "Lier mon compte Discord" })).toHaveAttribute("href", "/profil");
  await context.close();

  // L'API refuse d'attribuer un message avec le personnage d'un autre joueur
  await expect(apiPost("/personnages/messages", voisin.token, { journal_id: journalId, message_id: "1002", personnage_id: personnageId })).rejects.toThrow(/403/);
});

test("les pages personnages tiennent sur mobile", async ({ browser }) => {
  const { context, page } = await open(browser, joueur, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  for (const url of ["/personnages", `/personnage/${personnageId}`, `/bibliotheque/journal/${journalId}`]) {
    await page.goto(url);
    await expect(main(page).locator("h1").first()).toBeVisible();
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `débordement horizontal sur ${url}`).toBeLessThanOrEqual(1);
  }
  await context.close();
});
