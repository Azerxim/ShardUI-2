import { test, expect } from "@playwright/test";
import { blockExternalRequests } from "./helpers.js";

// Temporalité du RP sur l'accueil (config/temporalite.js) : 1 semaine réelle = 2 ans RP, l'an 1 commence à l'ouverture
// de la saison, VITE_SAISON_LANCEMENT (14 novembre 2026 à 14 h dans .env). L'horloge du navigateur est figée pour
// vérifier la date affichée.

const accueil = async (page, instant) => {
  await blockExternalRequests(page);
  await page.clock.setFixedTime(new Date(instant));
  await page.goto("/");
  return page.locator("#temps-rp");
};

test("une demi-heure après l'ouverture de la saison, nous sommes le 3 janvier de l'an 1", async ({ page }) => {
  const bloc = await accueil(page, "2026-11-14T14:30:00+01:00");
  await expect(bloc).toContainText("Nous sommes le 3 janvier de l'an 1");
  await expect(bloc).toContainText("L'an 2 commence mercredi 18 novembre à 02:00, dans 3 j 11 h.");
  await expect(bloc).toContainText("L'an 1 a commencé le 14 novembre 2026, avec la saison 3.");
  await expect(bloc).toContainText("réelle = 2 ans RP");
});

test("une semaine et 5 heures après l'ouverture, nous sommes le 22 janvier de l'an 3", async ({ page }) => {
  const bloc = await accueil(page, "2026-11-21T19:00:00+01:00");
  await expect(bloc).toContainText("Nous sommes le 22 janvier de l'an 3");
  await expect(bloc).toContainText("L'an 4 commence mercredi 25 novembre à 02:00, dans 3 j 7 h.");
  await expect(bloc).toContainText("5 % de l'année écoulée");
});

test("le dernier jour d'une année est le 31 décembre", async ({ page }) => {
  // 3 jours et demi moins 5 minutes après l'ouverture : dernier jour RP (≈ 13 min 49 s) de l'an 1
  const bloc = await accueil(page, "2026-11-18T01:55:00+01:00");
  await expect(bloc).toContainText("Nous sommes le 31 décembre de l'an 1");
  await expect(bloc).toContainText("dans 5 min.");
});
