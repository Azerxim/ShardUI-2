import { useEffect, useState } from "react";
import { getSessionUser } from "@/services/session";
import { getCivilisations, getLinkedPlatforms, getPersonnagesOfUser } from "@/services/api";

// Parcours du nouveau joueur affiché sur l'accueil (pages/home/HomePage.jsx).
// Le Codex lu, le Discord ouvert et l'IP copiée sont retenus dans ce navigateur ;
// le compte, le personnage, la civilisation et le compte Discord lié viennent de l'API.

// Invitation au Discord, où se dépose la candidature pour la whitelist du serveur
export const DISCORD_INVITE = "https://discord.gg/pcVFzYA534";

const CLE_CODEX = "parcours.codexLu";
const CLE_DISCORD = "parcours.discordRejoint";
const CLE_IP = "parcours.ipCopiee";

function lire(cle) {
  try {
    return localStorage.getItem(cle) === "1";
  } catch {
    return false;
  }
}

function retenir(cle) {
  try {
    localStorage.setItem(cle, "1");
  } catch {
    // Stockage indisponible (navigation privée) : l'étape restera simplement à faire
  }
}

export const marquerCodexLu = () => retenir(CLE_CODEX);
export const marquerIpCopiee = () => retenir(CLE_IP);

// Étapes vérifiables par l'API pour un joueur connecté : personnage créé, membre d'une civilisation, Discord lié
const aUnPersonnage = (userId) => getPersonnagesOfUser(userId)
  .then((liste) => Array.isArray(liste) && liste.length > 0);
const estDansUneCivilisation = (userId) => getCivilisations()
  .then((liste) => (Array.isArray(liste) ? liste : []).some(({ members }) => (members || []).some((membre) => membre.user_id === userId)));
const aLieDiscord = () => getLinkedPlatforms()
  .then((liste) => (Array.isArray(liste) ? liste : []).some((compte) => compte.platform === "discord"));

// Étapes dans l'ordre ; `fait` vaut null tant que l'information n'est pas connue.
export function useParcours() {
  const [user] = useState(getSessionUser);
  const [codexLu] = useState(() => lire(CLE_CODEX));
  const [discordOuvert, setDiscordOuvert] = useState(() => lire(CLE_DISCORD));
  const [ipCopiee, setIpCopiee] = useState(() => lire(CLE_IP));
  // null tant que l'API n'a pas répondu ; false sans session
  const [api, setApi] = useState(user ? null : { personnage: false, civilisation: false, discord: false });

  useEffect(() => {
    if (!user) return;
    let annule = false;
    const ouFaux = (promesse) => promesse.catch(() => false);
    Promise.all([ouFaux(aUnPersonnage(user.id)), ouFaux(estDansUneCivilisation(user.id)), ouFaux(aLieDiscord())])
      .then(([personnage, civilisation, discord]) => { if (!annule) setApi({ personnage, civilisation, discord }); });
    return () => { annule = true; };
  }, [user]);

  const etapes = [
    { id: "codex", fait: codexLu },
    { id: "compte", fait: Boolean(user) },
    { id: "civilisation", fait: api ? api.civilisation : null },
    { id: "personnage", fait: api ? api.personnage : null },
    // Candidature : on ne sait pas si elle est acceptée, on retient que le Discord a été ouvert (ou est lié au compte)
    { id: "discord", fait: discordOuvert || (api ? api.discord : null) },
    { id: "serveur", fait: ipCopiee },
  ];
  const chargement = etapes.some((etape) => etape.fait === null);
  const prochaine = chargement ? null : etapes.find((etape) => !etape.fait)?.id ?? "termine";

  const copierIp = () => {
    marquerIpCopiee();
    setIpCopiee(true);
  };

  const ouvrirDiscord = () => {
    retenir(CLE_DISCORD);
    setDiscordOuvert(true);
  };

  return { user, etapes, prochaine, chargement, copierIp, ouvrirDiscord };
}
