import { test, expect } from "@playwright/test";
import { API_URL, blockExternalRequests, createDiscordJournal, createSession, setJournalMessages, uniqueSuffix } from "./helpers.js";

// Journaux plus rapides à ouvrir : l'API garde les messages quelques minutes (Shard-API services/messages_journaux.py),
// les sert par pages de 100 (« Charger plus ») et relit le salon sur « Rafraîchir ».
test.describe.configure({ mode: "serial" });

const suffix = uniqueSuffix();
const salon = `4${Date.now()}`;
let journalId;

// Messages du salon, du plus récent au plus ancien (ordre de Discord) ; « Message n » posté à la minute n
const message = (n) => ({
  id: String(10000 + n),
  author: { id: "777", name: "crieur_irl", is_bot: false },
  content: `Message ${n} du crieur`,
  timestamp: new Date(Date.UTC(2026, 4, 1, 10, n)).toISOString(), edited_at: null, attachments: [], reactions: {},
});
const messages = (debut, fin) => Array.from({ length: fin - debut + 1 }, (_, i) => message(fin - i));

test.beforeAll(async () => {
  const auteur = await createSession("crieur");
  journalId = createDiscordJournal({ title: `Crieur ${suffix}`, uid: salon, userId: auteur.user.id });
  setJournalMessages(salon, messages(1, 130));
});

test("l'API sert les messages par pages et les garde entre deux visites", async () => {
  const lire = async (query = "") => (await (await fetch(`${API_URL}/bibliotheque/journaux/contents/${journalId}${query}`)).json()).content;
  const premiere = await lire();
  expect(premiere.messages).toHaveLength(100);
  expect(premiere.messages[0].content).toBe("Message 130 du crieur");
  expect(premiere.plus_anciens).toBe(true);

  // Un nouveau message sur Discord n'apparaît qu'après « Rafraîchir »
  setJournalMessages(salon, messages(1, 131));
  expect((await lire()).en_cache).toBe(true);
  expect((await lire()).messages[0].content).toBe("Message 130 du crieur");
  const relue = await lire("?rafraichir=true");
  expect(relue.en_cache).toBe(false);
  expect(relue.messages[0].content).toBe("Message 131 du crieur");

  const suite = await lire("?skip=100");
  expect(suite.messages).toHaveLength(31);
  expect(suite.messages.at(-1).content).toBe("Message 1 du crieur");
  expect(suite.plus_anciens).toBe(false);
  expect(suite.complet).toBe(true);
});

test("sur la page du journal, « Charger plus » ajoute les messages plus anciens", async ({ page }) => {
  // Salon remis à 130 messages, relu par l'API (comme « Rafraîchir »)
  setJournalMessages(salon, messages(1, 130));
  await fetch(`${API_URL}/bibliotheque/journaux/contents/${journalId}?rafraichir=true`);
  await blockExternalRequests(page);
  await page.goto(`/bibliotheque/journal/${journalId}`);
  await expect(page.getByText(/Mis à jour le/)).toBeVisible();
  await expect(page.getByText("Les 100 messages les plus récents sont affichés.")).toBeVisible();
  await expect(page.getByText("100+", { exact: true })).toBeVisible();
  await expect(page.getByText("Message 31 du crieur", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Charger plus" }).click();
  await expect(page.getByText("Message 1 du crieur", { exact: true })).toBeVisible();
  await expect(page.getByText("Les 100 messages les plus récents sont affichés.")).toHaveCount(0);
  await expect(page.getByText("130", { exact: true })).toBeVisible();
});
