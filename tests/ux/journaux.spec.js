import { test, expect } from "@playwright/test";
import { blockExternalRequests, createDiscordJournal, createSession, setJournalMessages, uniqueSuffix } from "./helpers.js";

// Journaux de la bibliothèque : icône de la tuile (cover_icon) et messages Discord affichés en Markdown.
// Les messages du salon viennent de tests/ux/.env-api/fake-journal-messages.json (aucun appel à Discord).
test.describe.configure({ mode: "serial" });

const suffix = uniqueSuffix();
const titre = `Gazette ${suffix}`;
const salon = `9${Date.now()}`;
let journalId;

test.beforeAll(async () => {
  const auteur = await createSession("gazetier");
  // Préfixe erroné, comme en base : beer-mug-empty n'existe qu'en style solid
  journalId = createDiscordJournal({ title: titre, uid: salon, userId: auteur.user.id, coverIcon: "fab fa-beer-mug-empty" });
  setJournalMessages(salon, [
    {
      id: "5001",
      author: { id: "777", name: "crieur_irl", is_bot: false },
      content: "Avis à **tous** les habitants, __soulignez__ ceci.\nDeuxième ligne avec ||un secret||.\n> Une citation\nHors citation\n-# petite note\n`code __brut__`",
      timestamp: "2026-05-01T10:00:00+00:00", edited_at: null, attachments: [], reactions: {},
    },
  ]);
});

test("la tuile du journal reprend son icône, même saisie avec le mauvais préfixe", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/bibliotheque");
  const tuile = page.getByRole("link", { name: new RegExp(titre) });
  await expect(tuile).toBeVisible();
  await expect(tuile.locator('svg[data-icon="beer-mug-empty"]')).toBeVisible();
  await expect(tuile.locator('svg[data-icon="discord"]')).toHaveCount(0);
});

test("les messages du journal sont interprétés en Markdown Discord", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto(`/bibliotheque/journal/${journalId}`);
  // Fil des messages : seul contenu Markdown de la page
  const message = page.locator("main").last();

  await expect(message.locator("strong", { hasText: "tous" })).toBeVisible();
  await expect(message.locator("u", { hasText: "soulignez" })).toBeVisible();
  await expect(message.locator("blockquote")).toHaveText("Une citation");
  await expect(message.getByText("Hors citation")).toBeVisible();
  await expect(message.locator("small", { hasText: "petite note" })).toBeVisible();
  // Le code reste brut : pas de souligné à l'intérieur
  await expect(message.locator("code")).toHaveText("code __brut__");
  // Plus aucun symbole Markdown visible
  await expect(message).not.toContainText("**");
  await expect(message).not.toContainText("||");

  // Spoiler masqué, révélé au clic
  const spoiler = message.getByRole("button", { name: /Spoiler/ });
  await expect(spoiler).toHaveText("un secret");
  await expect(spoiler).toHaveClass(/text-transparent/);
  await spoiler.click();
  await expect(message.getByText("un secret")).not.toHaveClass(/text-transparent/);
});
