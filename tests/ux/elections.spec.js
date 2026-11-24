import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, deplacerScrutin, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Élections RP : postes du gouvernement, scrutins des civilisations, alliances et religions (candidatures, vote secret
// ou public, second tour, dépouillement), et l'élu qui prend le poste mis en jeu.
test.describe.configure({ mode: "serial" });

const suffixe = uniqueSuffix();
let fondateur;
let electeur;
let civilisationId;
let villeId;
let dimensionId;
let aldric;
let brune;
let scrutinId;

const api = async (method, path, token, body) => {
  const response = await fetch(`${API_URL}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json().catch(() => ({})) };
};
const lire = async (id, session) => (await api("GET", `/elections/${id}`, session.token)).data.scrutin;
// Heure saisie dans un champ datetime-local : maintenant + minutes, à l'heure locale
const champHeure = (minutes) => {
  const date = new Date(Date.now() + minutes * 60_000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const iso = (minutes) => new Date(Date.now() + minutes * 60_000).toISOString();

const civilisationAvecVille = async (session, nom) => {
  const civilisation = (await apiPost("/civilisations/create", session.token, { title: `${nom} ${suffixe}`, is_public: true })).civilisation;
  const ville = await apiPost("/civilisations/villes/create", session.token, { title: `Cité de ${nom} ${suffixe}`, civilisation_id: civilisation.id, dimension_id: dimensionId, x: 0, z: 0, is_public: true });
  return { civilisationId: civilisation.id, villeId: ville.id ?? ville.ville?.id };
};

test.beforeAll(async () => {
  fondateur = await createSession("souverain");
  electeur = await createSession("electeur");
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  dimensionId = dimension?.id ?? 1;
  ({ civilisationId, villeId } = await civilisationAvecVille(fondateur, "Royaume"));
  aldric = (await apiPost("/personnages/create", fondateur.token, { name: `Aldric ${suffixe}`, civilisation_id: civilisationId })).personnage;
  // Seul un membre installe un personnage dans une civilisation
  await apiPost(`/civilisations/members/${civilisationId}/add`, fondateur.token, { user_id: electeur.user.id, role: "Membre" });
  brune = (await apiPost("/personnages/create", electeur.token, { name: `Brune ${suffixe}`, civilisation_id: civilisationId })).personnage;
});

test("le fondateur crée les postes du gouvernement, le premier représente la civilisation", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, fondateur);
  await page.goto(`/civilisation/${civilisationId}`);
  await page.getByRole("button", { name: "Poste" }).click();
  const modale = page.locator("dialog[open]");
  await modale.getByRole("textbox").first().fill("Roi");
  await modale.getByRole("button", { name: "Enregistrer" }).click();
  expect(await readAlert(page)).toContain("Le poste est créé");
  const poste = page.getByRole("listitem", { name: "Roi" });
  await expect(poste).toContainText("Représentant");
  await expect(poste).toContainText("Vacant");

  // Un titulaire doit résider dans la civilisation
  const etranger = (await apiPost("/personnages/create", electeur.token, { name: `Errant ${suffixe}` })).personnage;
  const [roi] = (await apiGet(`/elections/postes/civilisation/${civilisationId}`));
  expect((await api("PUT", `/elections/postes/${roi.id}`, fondateur.token, { personnage_id: etranger.id })).status).toBe(400);
  // Seuls les dirigeants gèrent le gouvernement
  expect((await api("POST", "/elections/postes", electeur.token, { entity_type: "civilisation", entity_id: civilisationId, title: "Usurpateur" })).status).toBe(403);
});

test("le fondateur ouvre un scrutin qui met le poste de roi en jeu", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, fondateur);
  await page.goto(`/civilisation/${civilisationId}`);
  await page.getByRole("button", { name: "Scrutin" }).click();
  const modale = page.locator("dialog[open]");
  await modale.locator('input[name="title"]').fill(`Couronnement ${suffixe}`);
  await modale.locator('select[name="poste_id"]').selectOption({ label: "Roi" });
  await modale.locator('input[name="vote_debut"]').fill(champHeure(60));
  await modale.locator('input[name="vote_fin"]').fill(champHeure(120));
  await modale.locator('input[name="date_rp"]').fill("0412-06-21");
  await modale.getByRole("button", { name: "Ouvrir le scrutin" }).click();
  expect(await readAlert(page)).toContain("ouvert aux candidatures");
  const carte = page.locator("#elections").getByRole("link", { name: `Couronnement ${suffixe}` });
  await expect(carte).toContainText("Candidatures");
  scrutinId = Number((await carte.getAttribute("href")).split("/").pop());

  // Un simple membre n'ouvre pas de scrutin
  expect((await api("POST", "/elections", electeur.token, { title: "Coup d'État", entity_type: "civilisation", entity_id: civilisationId, vote_debut: iso(60), vote_fin: iso(120) })).status).toBe(403);
});

test("le fondateur modifie les paramètres avant l'ouverture du vote, et personne d'autre", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, fondateur);
  await page.goto(`/election/${scrutinId}`);
  await page.getByRole("button", { name: "Modifier" }).click();
  const modale = page.locator("dialog[open]");
  await modale.locator('textarea[name="description"]').fill("Le trône est vacant depuis trois ans.");
  await modale.getByRole("radio", { name: "Tirage au sort" }).check();
  await modale.getByRole("button", { name: "Enregistrer" }).click();
  expect(await readAlert(page)).toContain("Le scrutin est modifié");
  await expect(page.getByText("Égalité : Tirage au sort")).toBeVisible();
  const lu = await lire(scrutinId, fondateur);
  expect(lu.egalite).toBe("tirage");
  expect(lu.description).toBe("Le trône est vacant depuis trois ans.");
  expect(lu.title).toBe(`Couronnement ${suffixe}`);

  // Seuls ceux qui ouvrent le scrutin le modifient
  expect((await api("PUT", `/elections/${scrutinId}`, electeur.token, { egalite: "nouveau_vote" })).status).toBe(403);
  // Règle inconnue refusée
  expect((await api("PUT", `/elections/${scrutinId}`, fondateur.token, { egalite: "pile_ou_face" })).status).toBe(400);
});

test("chaque joueur présente son personnage, puis vote une fois par personnage", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, electeur);
  await page.goto(`/election/${scrutinId}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Couronnement ${suffixe}`);
  const formulaire = page.getByRole("form", { name: "Se porter candidat" });
  // Programme écrit en Markdown avec l'éditeur, affiché mis en forme
  await formulaire.getByRole("textbox", { name: "Programme" }).fill("Du **pain** et des routes.");
  await formulaire.getByRole("button", { name: "Aperçu" }).click();
  await expect(formulaire.locator("strong")).toHaveText("pain");
  await formulaire.getByRole("button", { name: "Déposer la candidature" }).click();
  expect(await readAlert(page)).toContain("candidature est déposée");
  const carteBrune = page.getByRole("listitem", { name: `Brune ${suffixe}` });
  await expect(carteBrune).toContainText("Du pain et des routes.");
  await expect(carteBrune.locator("strong", { hasText: "pain" })).toBeVisible();

  // La candidate modifie son programme avant le début du vote
  await carteBrune.getByRole("region", { name: `Programme de Brune ${suffixe}` }).getByText("Du pain et des routes.").click();
  await carteBrune.getByRole("textbox", { name: "Texte en Markdown" }).fill("Du pain, des routes et *la paix*.");
  await carteBrune.getByRole("button", { name: "Sauvegarder" }).click();
  await expect(carteBrune.locator("em")).toHaveText("la paix");
  // <br> et retour à la ligne simple forcent un saut de ligne ; le reste du HTML n'est pas interprété
  await carteBrune.getByRole("region", { name: `Programme de Brune ${suffixe}` }).getByText(/Du pain, des routes/).click();
  await carteBrune.getByRole("textbox", { name: "Texte en Markdown" }).fill("Du pain,<br>des routes\net *la paix*.");
  await carteBrune.getByRole("button", { name: "Sauvegarder" }).click();
  await expect(carteBrune.locator("em")).toHaveText("la paix");
  await expect(carteBrune.locator("p br")).toHaveCount(2);
  await expect(carteBrune).not.toContainText("<br>");
  const candidatBrune = (await lire(scrutinId, electeur)).candidats.find((c) => c.personnage?.id === brune.id);
  expect(candidatBrune.programme).toBe("Du pain,<br>des routes\net *la paix*.");
  expect(candidatBrune.programme_modifiable).toBe(true);
  // Un autre joueur ne le modifie pas
  expect((await lire(scrutinId, fondateur)).candidats.find((c) => c.id === candidatBrune.id).programme_modifiable).toBe(false);
  expect((await api("PUT", `/elections/${scrutinId}/candidatures/${candidatBrune.id}`, fondateur.token, { programme: "Trahison" })).status).toBe(403);

  // Un long programme n'affiche que ses 5 premières lignes, puis se déplie avec « Voir plus »
  const lignes = Array.from({ length: 12 }, (_, i) => `- Promesse numéro ${i + 1}`).join("\n");
  await apiPost(`/elections/${scrutinId}/candidatures`, fondateur.token, { personnage_id: aldric.id, programme: lignes });
  await page.reload();
  const carteAldric = page.getByRole("listitem", { name: `Aldric ${suffixe}` });
  await expect(carteAldric.getByText("Promesse numéro 1", { exact: true })).toBeVisible();
  await expect(carteAldric.getByText("Promesse numéro 12")).not.toBeInViewport();
  await carteAldric.getByRole("button", { name: `Voir plus : programme de Aldric ${suffixe}` }).click();
  await carteAldric.getByText("Promesse numéro 12").scrollIntoViewIfNeeded();
  await expect(carteAldric.getByText("Promesse numéro 12")).toBeInViewport();
  await expect(carteAldric.getByRole("button", { name: /^Voir moins/ })).toHaveAttribute("aria-expanded", "true");
  // Un programme court n'a pas de bouton
  await expect(page.getByRole("listitem", { name: `Brune ${suffixe}` }).getByRole("button", { name: /^Voir plus/ })).toHaveCount(0);
  // Pas de vote avant l'ouverture
  expect((await api("POST", `/elections/${scrutinId}/votes`, electeur.token, { votant_type: "personnage", votant_id: brune.id, candidat_id: 1 })).status).toBe(400);

  deplacerScrutin(scrutinId, { vote_debut: -1 });
  // Le vote ouvert, le programme ne change plus
  expect((await api("PUT", `/elections/${scrutinId}/candidatures/${candidatBrune.id}`, electeur.token, { programme: "Volte-face" })).status).toBe(400);
  await page.reload();
  await expect(page.getByRole("listitem", { name: `Brune ${suffixe}` }).locator("em")).toHaveText("la paix");
  await expect(page.getByRole("listitem", { name: `Brune ${suffixe}` }).getByText(/Cliquez sur le programme/)).toHaveCount(0);
  const voix = page.getByRole("listitem", { name: `Vote de Brune ${suffixe}` });
  await voix.getByRole("combobox").selectOption({ label: `Aldric ${suffixe}` });
  await voix.getByRole("button", { name: "Voter" }).click();
  // SweetAlert réutilise la même fenêtre pour l'alerte de succès : on attend celle-ci plutôt que la fermeture
  await expect(page.locator(".swal2-popup")).toContainText("Un vote ne se reprend pas");
  await page.locator(".swal2-confirm").click();
  const succes = page.locator(".swal2-popup.swal2-icon-success");
  await expect(succes).toContainText("vote est enregistré");
  await succes.locator(".swal2-confirm").click();
  await expect(page.locator("main.container")).toContainText(`Brune ${suffixe} a voté.`);

  // Une voix ne se donne qu'une fois, et les voix restent cachées jusqu'à la clôture
  const scrutin = await lire(scrutinId, electeur);
  const candidatAldric = scrutin.candidats.find((c) => c.personnage?.id === aldric.id);
  expect((await api("POST", `/elections/${scrutinId}/votes`, electeur.token, { votant_type: "personnage", votant_id: brune.id, candidat_id: candidatAldric.id })).status).toBe(400);
  expect(candidatAldric.voix).toBeUndefined();
  expect(scrutin.participation.tour1).toBe(1);
  // On ne vote pas avec le personnage d'un autre joueur
  expect((await api("POST", `/elections/${scrutinId}/votes`, electeur.token, { votant_type: "personnage", votant_id: aldric.id, candidat_id: candidatAldric.id })).status).toBe(403);
  await apiPost(`/elections/${scrutinId}/votes`, fondateur.token, { votant_type: "personnage", votant_id: aldric.id, candidat_id: candidatAldric.id });
});

test("au dépouillement, l'élu prend le poste et le résultat entre dans les chroniques", async ({ page }) => {
  await blockExternalRequests(page);
  deplacerScrutin(scrutinId, { vote_fin: -0.5 });
  await page.goto(`/election/${scrutinId}`);
  await expect(page.getByRole("region", { name: "Résultat" })).toContainText(`Aldric ${suffixe} est élu : Roi`);
  await expect(page.getByRole("listitem", { name: `Aldric ${suffixe}` })).toContainText("2 voix");
  await expect(page.getByRole("listitem", { name: `Brune ${suffixe}` })).toContainText("0 voix");
  // Vote secret : aucun bulletin nommé
  await expect(page.getByRole("heading", { name: "Bulletins" })).toHaveCount(0);

  const [roi] = await apiGet(`/elections/postes/civilisation/${civilisationId}`);
  expect(roi.personnage.id).toBe(aldric.id);
  // Sa fiche montre le rôle qu'il occupe désormais
  await page.goto(`/personnage/${aldric.id}`);
  await expect(page.locator("main.container")).toContainText(`Rôle : Roi (Royaume ${suffixe})`);
  const chroniques = await apiGet("/chroniques/list");
  expect(chroniques.find((e) => e.id === `election-${scrutinId}`)).toMatchObject({ categorie: "elections", date_rp: "0412-06-21" });
});

test("sans majorité absolue, un second tour départage les deux premiers ; le vote public publie les bulletins", async () => {
  const tiers = await createSession("tiers");
  await apiPost(`/civilisations/members/${civilisationId}/add`, fondateur.token, { user_id: tiers.user.id, role: "Membre" });
  const clovis = (await apiPost("/personnages/create", tiers.token, { name: `Clovis ${suffixe}`, civilisation_id: civilisationId })).personnage;
  const { scrutin } = await apiPost("/elections", fondateur.token, { title: `Conseil ${suffixe}`, entity_type: "civilisation", entity_id: civilisationId, mode: "public", deux_tours: true, vote_debut: iso(60), vote_fin: iso(120) });
  for (const [session, personnage] of [[fondateur, aldric], [electeur, brune], [tiers, clovis]]) {
    await apiPost(`/elections/${scrutin.id}/candidatures`, session.token, { personnage_id: personnage.id });
  }
  deplacerScrutin(scrutin.id, { vote_debut: -1 });
  const candidats = Object.fromEntries((await lire(scrutin.id, fondateur)).candidats.map((c) => [c.personnage.id, c.id]));
  // Trois voix, trois candidats : personne n'a la majorité absolue ; tous ex aequo passent au second tour
  for (const [session, personnage] of [[fondateur, aldric], [electeur, brune], [tiers, clovis]]) {
    await apiPost(`/elections/${scrutin.id}/votes`, session.token, { votant_type: "personnage", votant_id: personnage.id, candidat_id: candidats[personnage.id] });
  }
  deplacerScrutin(scrutin.id, { vote_fin: -0.5 });
  let lu = await lire(scrutin.id, electeur);
  expect(lu.phase).toBe("second_tour");
  expect(lu.candidats.filter((c) => c.au_second_tour)).toHaveLength(3);
  expect(lu.mes_voix).toEqual([expect.objectContaining({ id: brune.id, a_vote: false })]);

  await apiPost(`/elections/${scrutin.id}/votes`, electeur.token, { votant_type: "personnage", votant_id: brune.id, candidat_id: candidats[clovis.id] });
  await apiPost(`/elections/${scrutin.id}/votes`, tiers.token, { votant_type: "personnage", votant_id: clovis.id, candidat_id: candidats[clovis.id] });
  deplacerScrutin(scrutin.id, { tour2_fin: -0.5 });
  lu = await lire(scrutin.id, electeur);
  expect(lu.phase).toBe("clos");
  expect(lu.elu.personnage_id).toBe(clovis.id);
  expect(lu.bulletins.filter((b) => b.tour === 2).map((b) => b.votant_title).sort()).toEqual([`Brune ${suffixe}`, `Clovis ${suffixe}`]);
});

test("la fiche de la civilisation ne montre que les scrutins en cours et les deux derniers clos", async ({ page }) => {
  // Troisième scrutin clos (sans candidat : clos dès l'ouverture du vote), et un scrutin en cours
  const { scrutin: vide } = await apiPost("/elections", fondateur.token, { title: `Sans candidat ${suffixe}`, entity_type: "civilisation", entity_id: civilisationId, vote_debut: iso(60), vote_fin: iso(120) });
  deplacerScrutin(vide.id, { vote_debut: -1 });
  expect((await lire(vide.id, fondateur)).resultat).toBe("sans_candidat");
  await apiPost("/elections", fondateur.token, { title: `Ban des récoltes ${suffixe}`, entity_type: "civilisation", entity_id: civilisationId, vote_debut: iso(60), vote_fin: iso(120) });

  await blockExternalRequests(page);
  await page.goto(`/civilisation/${civilisationId}`);
  const section = page.locator("#elections");
  await expect(section.getByRole("link", { name: `Ban des récoltes ${suffixe}` })).toBeVisible();
  await expect(section.getByRole("link", { name: `Sans candidat ${suffixe}` })).toBeVisible();
  await expect(section.getByRole("link", { name: `Conseil ${suffixe}` })).toBeVisible();
  // Le plus ancien est caché, avec un lien vers toutes les élections
  await expect(section.getByRole("link", { name: `Couronnement ${suffixe}` })).toHaveCount(0);
  await expect(section).toContainText("Un scrutin plus ancien ou annulé n'est pas affiché");
});

test("dans une alliance, chaque civilisation vote par son représentant", async () => {
  const voisin = await createSession("voisin");
  const autre = await civilisationAvecVille(voisin, "Comté");
  const alliance = (await apiPost("/alliances/create", fondateur.token, { title: `Ligue ${suffixe}`, civilisation_id: civilisationId })).alliance;
  const { invitation } = await apiPost(`/alliances/${alliance.id}/invitations`, fondateur.token, { civilisation_id: autre.civilisationId });
  const reponse = await api("PUT", `/alliances/invitations/${invitation.id}/repondre`, voisin.token, { accepter: true });
  expect(reponse.status).toBe(200);
  const comte = (await apiPost("/personnages/create", voisin.token, { name: `Comte ${suffixe}`, civilisation_id: autre.civilisationId })).personnage;
  await apiPost("/elections/postes", voisin.token, { entity_type: "civilisation", entity_id: autre.civilisationId, title: "Comte", personnage_id: comte.id });

  const { scrutin } = await apiPost("/elections", fondateur.token, { title: `Chef de la ligue ${suffixe}`, entity_type: "alliance", entity_id: alliance.id, vote_debut: iso(60), vote_fin: iso(120) });
  expect(scrutin.corps).toBe("civilisations");
  // Seul le chef de file organise
  expect((await api("POST", "/elections", voisin.token, { title: "Sécession", entity_type: "alliance", entity_id: alliance.id, vote_debut: iso(60), vote_fin: iso(120) })).status).toBe(403);
  await apiPost(`/elections/${scrutin.id}/candidatures`, voisin.token, { personnage_id: comte.id });
  deplacerScrutin(scrutin.id, { vote_debut: -1 });

  const lu = await lire(scrutin.id, voisin);
  expect(lu.votants_count).toBe(2);
  expect(lu.mes_voix).toEqual([expect.objectContaining({ type: "civilisation", id: autre.civilisationId, a_vote: false })]);
  // Le royaume a pour représentant Aldric, élu roi : c'est son joueur qui vote pour lui
  expect((await lire(scrutin.id, fondateur)).mes_voix).toEqual([expect.objectContaining({ type: "civilisation", id: civilisationId })]);
  expect((await lire(scrutin.id, electeur)).mes_voix).toEqual([]);
});

test("dans une religion, le vote se fait par les fidèles ou par les villes où elle domine", async ({ page, context }) => {
  const religion = (await apiPost("/religions/create", electeur.token, { title: `Culte ${suffixe}`, is_public: true })).religion;
  await apiPost(`/religions/ville/${villeId}/add`, fondateur.token, { ReligionID: religion.id, influence: 60 });
  await apiPost("/elections/postes", fondateur.token, { entity_type: "ville", entity_id: villeId, title: "Bourgmestre", personnage_id: aldric.id });

  // La foi se déclare sur la fiche du personnage
  await blockExternalRequests(page);
  await signIn(context, electeur);
  await page.goto(`/personnage/${brune.id}`);
  await expect(page.locator("main.container")).toContainText("Sans religion déclarée");
  await api("PUT", `/personnages/update/${brune.id}`, electeur.token, { religion_id: religion.id });
  await page.reload();
  await expect(page.locator("main.container")).toContainText(`Foi : Culte ${suffixe}`);

  const fideles = (await apiPost("/elections", electeur.token, { title: `Grand prêtre ${suffixe}`, entity_type: "religion", entity_id: religion.id, corps: "personnages", vote_debut: iso(60), vote_fin: iso(120) })).scrutin;
  expect(fideles.mes_candidats_possibles.map((p) => p.id)).toEqual([brune.id]);
  const villes = (await apiPost("/elections", electeur.token, { title: `Concile ${suffixe}`, entity_type: "religion", entity_id: religion.id, corps: "villes", vote_debut: iso(60), vote_fin: iso(120) })).scrutin;
  await apiPost(`/elections/${villes.id}/candidatures`, electeur.token, { personnage_id: brune.id });
  deplacerScrutin(villes.id, { vote_debut: -1 });
  // La ville où le culte domine vote par son bourgmestre, joué par le fondateur
  expect((await lire(villes.id, fondateur)).mes_voix).toEqual([expect.objectContaining({ type: "ville", id: villeId, a_vote: false })]);
  expect((await api("POST", "/elections", electeur.token, { title: "Sans corps", entity_type: "religion", entity_id: religion.id, vote_debut: iso(60), vote_fin: iso(120) })).status).toBe(400);
});

test("la page des élections liste les scrutins publics, et le joueur voit ceux où il doit voter", async ({ page, context }) => {
  await blockExternalRequests(page);
  await page.goto("/elections");
  await expect(page.getByRole("region", { name: "Résultats" }).getByRole("link", { name: `Couronnement ${suffixe}` })).toContainText(`Aldric ${suffixe} est élu`);
  await expect(page.getByRole("region", { name: "Vote en cours" }).getByRole("link", { name: `Concile ${suffixe}` })).toBeVisible();

  await signIn(context, fondateur);
  await page.goto("/profil");
  await expect(page.getByRole("region", { name: "À traiter" })).toContainText(`Concile ${suffixe}`);
});

test("tous les résidents d'une civilisation dirigée se présentent, seul son représentant vote, et l'élu prend le poste", async () => {
  const vassal = await createSession("vassal");
  const comte = (await apiPost("/civilisations/create", vassal.token, { title: `Comté ${suffixe}`, is_public: true, is_civilisation_dirigeante: false, dirigeante_civilisation_id: civilisationId })).civilisation;
  const gauvain = (await apiPost("/personnages/create", vassal.token, { name: `Gauvain ${suffixe}`, civilisation_id: comte.id })).personnage;
  const yseult = (await apiPost("/personnages/create", vassal.token, { name: `Yseult ${suffixe}`, civilisation_id: comte.id })).personnage;
  // Gauvain représente le comté ; Yseult n'a pas de poste
  await apiPost("/elections/postes", vassal.token, { entity_type: "civilisation", entity_id: comte.id, title: "Comte", personnage_id: gauvain.id, is_representant: true });
  // Ils peuvent occuper un poste du royaume : le gouvernement les propose
  expect((await apiGet(`/elections/postes/titulaires/${civilisationId}`)).map((fiche) => fiche.personnage.id)).toEqual(expect.arrayContaining([gauvain.id, yseult.id]));
  const { poste } = await apiPost("/elections/postes", fondateur.token, { entity_type: "civilisation", entity_id: civilisationId, title: "Chancelier" });
  const { scrutin } = await apiPost("/elections", fondateur.token, { title: `Chancellerie ${suffixe}`, entity_type: "civilisation", entity_id: civilisationId, poste_id: poste.id, vote_debut: iso(60), vote_fin: iso(120) });

  expect((await lire(scrutin.id, vassal)).mes_candidats_possibles.map((p) => p.id).sort()).toEqual([gauvain.id, yseult.id].sort());
  await apiPost(`/elections/${scrutin.id}/candidatures`, vassal.token, { personnage_id: yseult.id });
  deplacerScrutin(scrutin.id, { vote_debut: -1 });
  const lu = await lire(scrutin.id, vassal);
  // Une seule voix pour le comté, donnée par son représentant ; ses résidents ne votent pas en personne
  expect(lu.mes_voix).toEqual([expect.objectContaining({ type: "civilisation", id: comte.id, a_vote: false })]);
  const [candidat] = lu.candidats;
  for (const personnage of [gauvain, yseult]) {
    expect((await api("POST", `/elections/${scrutin.id}/votes`, vassal.token, { votant_type: "personnage", votant_id: personnage.id, candidat_id: candidat.id })).status).toBe(400);
  }
  await apiPost(`/elections/${scrutin.id}/votes`, vassal.token, { votant_type: "civilisation", votant_id: comte.id, candidat_id: candidat.id });
  expect((await api("POST", `/elections/${scrutin.id}/votes`, vassal.token, { votant_type: "civilisation", votant_id: comte.id, candidat_id: candidat.id })).status).toBe(400);
  deplacerScrutin(scrutin.id, { vote_fin: -1 });
  const clos = await lire(scrutin.id, fondateur);
  expect(clos.resultat).toBe("elu");
  expect(clos.candidats[0].voix).toBe(1);
  const chancelier = (await apiGet(`/elections/postes/civilisation/${civilisationId}`)).find((p) => p.id === poste.id);
  expect(chancelier.personnage?.id).toBe(yseult.id);
});

// Égalités : scrutins d'une civilisation à deux personnages qui se départagent à une voix chacun
test.describe("égalités", () => {
  let civilisation;
  let premier;
  let second;

  const ouvrirAvecEgalite = async (titre, egalite, deuxTours = false) => {
    const { scrutin } = await apiPost("/elections", fondateur.token, { title: `${titre} ${suffixe}`, entity_type: "civilisation", entity_id: civilisation, mode: "secret", deux_tours: deuxTours, egalite, vote_debut: iso(60), vote_fin: iso(120) });
    await apiPost(`/elections/${scrutin.id}/candidatures`, fondateur.token, { personnage_id: premier.id });
    await apiPost(`/elections/${scrutin.id}/candidatures`, fondateur.token, { personnage_id: second.id });
    return scrutin.id;
  };
  const candidatDe = async (id, personnage) => (await lire(id, fondateur)).candidats.find((c) => c.personnage?.id === personnage.id).id;
  // Ouverture du vote passée, puis chacun donne sa voix à l'autre : une voix chacun
  // La clôture passe dans le passé après les votes : un second tour de même durée commence alors (tour2_fin à venir)
  const voterEgaux = async (id) => {
    deplacerScrutin(id, { vote_debut: -120 });
    await apiPost(`/elections/${id}/votes`, fondateur.token, { votant_type: "personnage", votant_id: premier.id, candidat_id: await candidatDe(id, second) });
    await apiPost(`/elections/${id}/votes`, fondateur.token, { votant_type: "personnage", votant_id: second.id, candidat_id: await candidatDe(id, premier) });
    deplacerScrutin(id, { vote_fin: -30 });
  };

  test.beforeAll(async () => {
    ({ civilisationId: civilisation } = await civilisationAvecVille(fondateur, "Égalité"));
    premier = (await apiPost("/personnages/create", fondateur.token, { name: `Premier ${suffixe}`, civilisation_id: civilisation })).personnage;
    second = (await apiPost("/personnages/create", fondateur.token, { name: `Second ${suffixe}`, civilisation_id: civilisation })).personnage;
  });

  test("tirage au sort : l'élu est tiré parmi les ex aequo", async () => {
    const id = await ouvrirAvecEgalite("Tirage", "tirage");
    await voterEgaux(id);
    const clos = await lire(id, fondateur);
    expect(clos.resultat).toBe("elu");
    expect(clos.tirage).toBe(true);
    expect([premier.id, second.id]).toContain(clos.elu.personnage_id);
  });

  test("nouveau vote : les ex aequo revotent, et le gagnant est élu", async () => {
    const id = await ouvrirAvecEgalite("Revote", "nouveau_vote");
    await voterEgaux(id);
    const revote = await lire(id, fondateur);
    expect(revote.phase).toBe("second_tour");
    expect(revote.candidats.every((c) => c.au_second_tour)).toBe(true);
    // Second vote : les deux voix vont au second
    await apiPost(`/elections/${id}/votes`, fondateur.token, { votant_type: "personnage", votant_id: premier.id, candidat_id: await candidatDe(id, second) });
    await apiPost(`/elections/${id}/votes`, fondateur.token, { votant_type: "personnage", votant_id: second.id, candidat_id: await candidatDe(id, second) });
    deplacerScrutin(id, { tour2_fin: -1 });
    const clos = await lire(id, fondateur);
    expect(clos.resultat).toBe("elu");
    expect(clos.elu.personnage_id).toBe(second.id);
    expect(clos.tirage).toBe(false);
  });

  test("nouveau vote à nouveau à égalité : personne n'est élu", async () => {
    const id = await ouvrirAvecEgalite("Double égalité", "nouveau_vote");
    await voterEgaux(id);
    await apiPost(`/elections/${id}/votes`, fondateur.token, { votant_type: "personnage", votant_id: premier.id, candidat_id: await candidatDe(id, premier) });
    await apiPost(`/elections/${id}/votes`, fondateur.token, { votant_type: "personnage", votant_id: second.id, candidat_id: await candidatDe(id, second) });
    deplacerScrutin(id, { tour2_fin: -1 });
    const clos = await lire(id, fondateur);
    expect(clos.resultat).toBe("egalite");
    expect(clos.elu).toBeNull();
  });

  test("personne n'est élu par défaut", async () => {
    const id = await ouvrirAvecEgalite("Sans règle", "personne");
    await voterEgaux(id);
    const clos = await lire(id, fondateur);
    expect(clos.resultat).toBe("egalite");
    expect(clos.tirage).toBe(false);
  });
});

