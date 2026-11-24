import { test, expect } from "@playwright/test";
import { blockExternalRequests, createSession, signIn } from "./helpers.js";
import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// Rôles pris en compte sans recharger (services/syncRoles.js) : le profil est réaligné sur l'API toutes les minutes et
// au retour sur l'onglet ; un rôle accordé ou retiré remonte la page, avec une annonce, sans rechargement.
test.describe.configure({ mode: "serial" });

const here = path.dirname(fileURLToPath(import.meta.url));
const role = (username, colonne, valeur) => {
  const apiDir = path.resolve(process.env.SHARD_API_DIR ?? path.join(here, "../../../Shard-API"));
  const script = `import sqlite3, sys; db = sqlite3.connect(sys.argv[1]); db.execute('update users set ${colonne} = ? where username = ?', (int(sys.argv[3]), sys.argv[2])); db.commit()`;
  execFileSync(path.join(apiDir, ".venv", "bin", "python"), ["-c", script, path.join(here, ".env-api", "ShardDB.db"), username, String(valeur)]);
};
// Retour sur l'onglet : déclenche la relecture du profil
const revenir = (page) => page.evaluate(() => window.dispatchEvent(new Event("focus")));

let joueur;

test.beforeAll(async () => {
  joueur = await createSession("promu");
});

test("un rôle de modérateur accordé ouvre le tableau de bord sans recharger la page", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, joueur);
  await page.goto("/moderation");
  await expect(page.getByText("Le tableau de bord est réservé aux modérateurs RP et aux administrateurs.")).toBeVisible();
  // Marqueur posé dans la page : il disparaîtrait avec un rechargement
  await page.evaluate(() => { window.sansRechargement = true; });

  role(joueur.account.username, "is_moderateur", 1);
  await revenir(page);
  await expect(page.getByRole("status").filter({ hasText: "Vous êtes désormais modérateur RP." })).toBeVisible();
  await expect(page.getByText("Le tableau de bord est réservé aux modérateurs RP et aux administrateurs.")).toHaveCount(0);
  await expect(page.locator('a[href="/moderation"]').first()).toBeAttached();
  expect(await page.evaluate(() => window.sansRechargement)).toBe(true);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("user")).is_moderateur)).toBe(true);

  // Rôle retiré : la page se referme de même
  role(joueur.account.username, "is_moderateur", 0);
  await page.waitForTimeout(10_500); // une relecture au plus toutes les 10 s au retour sur l'onglet
  await revenir(page);
  await expect(page.getByRole("status").filter({ hasText: "Vous n'êtes plus modérateur RP." })).toBeVisible();
  await expect(page.getByText("Le tableau de bord est réservé aux modérateurs RP et aux administrateurs.")).toBeVisible();
  expect(await page.evaluate(() => window.sansRechargement)).toBe(true);
});

test("une modale ouverte n'est pas fermée : la page attend sa fermeture pour se remonter", async ({ page, context }) => {
  role(joueur.account.username, "is_admin", 0);
  await blockExternalRequests(page);
  await signIn(context, joueur);
  await page.goto("/bibliotheque");
  await page.getByRole("button", { name: /^Nouveau Journal/ }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('[name="title"]').fill("Brouillon gardé");
  await expect(dialog.locator('input[name="salon"]')).toHaveCount(0);

  role(joueur.account.username, "is_admin", 1);
  await page.waitForTimeout(10_500);
  await revenir(page);
  await expect(page.getByRole("status").filter({ hasText: "Vous êtes désormais administrateur du site." })).toBeVisible();
  // La saisie est intacte tant que la modale reste ouverte
  await expect(dialog.locator('[name="title"]')).toHaveValue("Brouillon gardé");
  await dialog.getByRole("button", { name: /Annuler|Fermer/ }).first().click();
  // Modale fermée : la page est remontée (vérifié chaque seconde), le choix réservé aux administrateurs apparaît
  await page.waitForTimeout(1_500);
  await page.getByRole("button", { name: /^Nouveau Journal/ }).click();
  await expect(page.locator('dialog[open] input[name="salon"][value="lier"]')).toBeVisible();
  role(joueur.account.username, "is_admin", 0);
});
