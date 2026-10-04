import { Buffer } from "node:buffer";
import zlib from "node:zlib";
import { test, expect } from "@playwright/test";
import { API_URL, apiPost, blockExternalRequests, createSession, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Portrait et skin d'un personnage envoyés depuis le formulaire : le portrait (PNG, JPEG, WebP) remplace le lien,
// le skin doit être un PNG aux dimensions d'un skin Minecraft (64 × 64 ou 64 × 32) et devient la source du skin.
test.describe.configure({ mode: "serial" });

let joueur;
let personnageId;
const suffixe = uniqueSuffix();

// PNG transparent de largeur × hauteur pixels
function png(largeur, hauteur) {
  const crc = (octets) => {
    let c = ~0;
    for (const octet of octets) {
      c ^= octet;
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  };
  const bloc = (type, donnees) => {
    const corps = Buffer.concat([Buffer.from(type), donnees]);
    const taille = Buffer.alloc(4);
    taille.writeUInt32BE(donnees.length);
    const somme = Buffer.alloc(4);
    somme.writeUInt32BE(crc(corps));
    return Buffer.concat([taille, corps, somme]);
  };
  const entete = Buffer.alloc(13);
  entete.writeUInt32BE(largeur, 0);
  entete.writeUInt32BE(hauteur, 4);
  entete.set([8, 6, 0, 0, 0], 8);
  const lignes = Buffer.alloc((largeur * 4 + 1) * hauteur);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), bloc("IHDR", entete), bloc("IDAT", zlib.deflateSync(lignes)), bloc("IEND", Buffer.alloc(0))]);
}

const lirePersonnage = async () => (await (await fetch(`${API_URL}/personnages/read/${personnageId}`)).json()).personnage;

test.beforeAll(async () => {
  joueur = await createSession("portraitiste");
});

const main = (page) => page.locator("main.container");

test("le joueur crée un personnage avec un portrait et un skin envoyés", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, joueur);
  await page.goto("/personnages");
  await main(page).getByRole("button", { name: "Nouveau personnage" }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('input[name="name"]').fill(`Aldric ${suffixe}`);
  // Espèce proposée par défaut : Humain
  await expect(dialog.locator('select[name="espece_id"] option:checked')).toHaveText("Humain");
  // Un onglet par source : seuls les champs de l'onglet choisi sont affichés
  const portrait = dialog.getByRole("tablist", { name: "Portrait" });
  const skin = dialog.getByRole("tablist", { name: "Skin" });
  await expect(portrait.getByRole("tab", { name: "Aucun" })).toHaveAttribute("aria-selected", "true");
  await expect(dialog.locator('input[name="portrait"], input[name="image_url"], input[name="skin_url"], input[name="skin"]')).toHaveCount(0);
  await skin.getByRole("tab", { name: "Lien" }).click();
  await expect(dialog.locator('input[name="skin_url"]')).toBeVisible();
  await portrait.getByRole("tab", { name: "Image envoyée" }).click();
  await dialog.locator('input[name="portrait"]').setInputFiles({ name: "portrait.png", mimeType: "image/png", buffer: png(32, 32) });
  await skin.getByRole("tab", { name: "Fichier envoyé" }).click();
  await expect(dialog.locator('input[name="skin_url"]')).toHaveCount(0);
  await dialog.locator('input[name="skin"]').setInputFiles({ name: "skin.png", mimeType: "image/png", buffer: png(64, 64) });
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/prêt à entrer dans l'histoire/);
  await expect(page).toHaveURL(/\/personnage\/\d+$/);
  personnageId = Number(page.url().split("/").pop());

  const personnage = await lirePersonnage();
  expect(personnage).toMatchObject({ skin_source: "fichier", image_url: null });
  expect((await (await fetch(`${API_URL}/personnages/read/${personnageId}`)).json()).espece?.title).toBe("Humain");
  await expect(main(page).getByRole("img", { name: `Portrait de Aldric ${suffixe}` })).toHaveAttribute("src", new RegExp(`/personnages/fichier/${personnage.image_fichier}$`));
  await expect(main(page).getByRole("img", { name: `Fichier de skin de Aldric ${suffixe}` })).toHaveAttribute("src", new RegExp(`/personnages/fichier/${personnage.skin_fichier}$`));
});

test("un skin aux mauvaises dimensions est refusé, la fiche reste enregistrée", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, joueur);
  await page.goto(`/personnage/${personnageId}`);
  await main(page).getByRole("button", { name: "Modifier" }).first().click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('input[name="grade"]').fill("Capitaine");
  // La fiche rouvre sur les onglets enregistrés
  await expect(dialog.getByRole("tablist", { name: "Portrait" }).getByRole("tab", { name: "Image envoyée" })).toHaveAttribute("aria-selected", "true");
  await expect(dialog.getByRole("tablist", { name: "Skin" }).getByRole("tab", { name: "Fichier envoyé" })).toHaveAttribute("aria-selected", "true");
  await expect(dialog).toContainText("Un skin est déjà envoyé");
  await dialog.locator('input[name="skin"]').setInputFiles({ name: "grand.png", mimeType: "image/png", buffer: png(100, 100) });
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/64 × 64.*100 × 100/);
  const personnage = await lirePersonnage();
  expect(personnage.grade).toBe("Capitaine");
  expect(personnage.skin_source).toBe("fichier");
});

test("choisir une autre source de skin ou un lien de portrait efface les fichiers envoyés", async () => {
  const avant = await lirePersonnage();
  const response = await fetch(`${API_URL}/personnages/update/${personnageId}`, {
    method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${joueur.token}` },
    body: JSON.stringify({ skin_source: "aucun", image_url: "https://exemple.org/portrait.png" }),
  });
  expect(response.status).toBe(200);
  const apres = await lirePersonnage();
  expect(apres).toMatchObject({ skin_source: "aucun", skin_fichier: null, image_fichier: null });
  for (const nom of [avant.skin_fichier, avant.image_fichier]) {
    expect((await fetch(`${API_URL}/personnages/fichier/${nom}`)).status).toBe(404);
  }
  // « Fichier envoyé » sans fichier : refusé
  await expect(apiPost("/personnages/create", joueur.token, { name: "Sans fichier", skin_source: "fichier" })).rejects.toThrow(/400/);
});

test("l'onglet « Aucun » du portrait retire l'image envoyée", async ({ page, context }) => {
  // Nouveau portrait envoyé par l'API, puis retiré depuis le formulaire
  const corps = new FormData();
  corps.append("image", new Blob([png(16, 16)], { type: "image/png" }), "p.png");
  await fetch(`${API_URL}/personnages/portrait/${personnageId}`, { method: "POST", headers: { Authorization: `Bearer ${joueur.token}` }, body: corps });
  const nom = (await lirePersonnage()).image_fichier;
  expect(nom).toBeTruthy();

  await blockExternalRequests(page);
  await signIn(context, joueur);
  await page.goto(`/personnage/${personnageId}`);
  await main(page).getByRole("button", { name: "Modifier" }).first().click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByRole("tablist", { name: "Portrait" }).getByRole("tab", { name: "Aucun" }).click();
  await dialog.locator('button[type="submit"]').click();
  await readAlert(page);
  expect(await lirePersonnage()).toMatchObject({ image_fichier: null, image_url: null });
  expect((await fetch(`${API_URL}/personnages/fichier/${nom}`)).status).toBe(404);
});
