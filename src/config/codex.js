// ===== Contenu du Codex =====
// Deux livres (la loi du serveur, le codex du rôle-play), découpés en chapitres et articles.
// Chaque article peut porter `warn: true` pour les fautes à tolérance zéro.
// Référence d'un article : « Art. <livre>.<chapitre>.<article> » (ex. II.5.3), ancre #<id du chapitre>-<n°>.
// Partagé par le Codex de saison et celui de lancement (components/codex/CodexContenu.jsx).
export const LIVRES = [
  {
    id: "loi",
    numero: "Livre I",
    titre: "La loi du serveur",
    icon: "fa-solid fa-scale-balanced",
    dek: "Les règles qui tiennent Tetrago debout, joueur contre joueur, machine contre machine — valables partout, en jeu comme hors-jeu.",
    chapitres: [
      {
        id: "conduite",
        titre: "Conduite générale",
        icon: "fa-solid fa-comments",
        articles: [
          { titre: "Respect avant tout.", texte: "Insultes, harcèlement, propos haineux ou discriminatoires entraînent une sanction immédiate, en jeu comme sur le Discord.", warn: true },
          { titre: "Un seul compte par joueur.", texte: "Les comptes secondaires ne sont tolérés qu'avec l'accord de l'équipe, notamment pour incarner un personnage secondaire." },
          { titre: "L'autorité du staff.", texte: "L'équipe tranche les litiges en dernier recours. Une décision se conteste par ticket Discord, jamais en public ni en rôle-play." },
          { titre: "Le chat général reste hors-jeu.", texte: "Débats politiques, religieux ou provocateurs n'y ont pas leur place — la discussion commune n'est pas une tribune." },
        ],
      },
      {
        id: "terres",
        titre: "Terres & constructions",
        icon: "fa-solid fa-city",
        articles: [
          // { titre: "Protège avant de bâtir.", texte: "Toute parcelle doit être protégée avant construction. Une terre non protégée reste à tes risques." },
          { titre: "Le grief est une faute grave.", texte: "Détruire, voler ou modifier les biens d'autrui sans accord RP ou hors-jeu est banni sans négociation.", warn: true },
          { titre: "Distance de courtoisie.", texte: "Laisse un espace raisonnable entre ta bâtisse et celle d'un voisin déjà installé — le monde est vaste, la politesse ne l'est jamais assez." },
          { titre: "Ressources naturelles.", texte: "Gisements rares, arbres anciens et ruines sont un bien commun ; le pillage industriel au détriment des autres joueurs est sanctionné." },
        ],
      },
      {
        id: "triche",
        titre: "Triche & exploits",
        icon: "fa-solid fa-user-secret",
        articles: [
          // { titre: "Aucun client modifié.", texte: "X-ray, kill-aura, auto-clic ou tout mod procurant un avantage injuste sont proscrits ; les mods cosmétiques restent tolérés sur demande.", warn: true },
          { titre: "Duplication & failles.", texte: "Tout bug de duplication doit être signalé à l'équipe, jamais exploité. Les contrevenants perdent leurs gains et s'exposent au bannissement." },
          { titre: "Machines à lag.", texte: "Fermes ou circuits redstone conçus pour ralentir le serveur seront démantelés sans préavis." },
        ],
      },
      {
        id: "economie",
        titre: "Économie & échanges",
        icon: "fa-solid fa-coins",
        articles: [
          { titre: "Le tetra, seule monnaie du royaume.", texte: "Un tetra vaut un diamant. Aucune transaction contre argent réel, biens externes ou service tiers n'est autorisée.", warn: true },
          { titre: "Échanges équitables.", texte: "Une arnaque entre joueurs — bien promis non livré, double prix — est traitée comme un vol." },
          { titre: "Marché libre, prix libres.", texte: "L'équipe ne fixe pas les prix, mais intervient en cas de monopole abusif ou de sabotage économique organisé." },
        ],
      },
      {
        id: "sanctions",
        titre: "Sanctions & appels",
        icon: "fa-solid fa-gavel",
        articles: [
          { titre: "Trois degrés de justice.", texte: "Avertissement → mise à l'épreuve (droits restreints) → bannissement. La gravité de la faute peut brûler des étapes." },
          { titre: "Le droit d'appel.", texte: "Toute sanction peut être contestée par ticket Discord sous 14 jours, preuves ou contexte RP à l'appui." },
          { titre: "Casier propre.", texte: "Les fautes mineures s'effacent après 3 mois de bonne conduite ; triche et harcèlement restent au dossier." },
        ],
      },
    ],
  },
  {
    id: "rp",
    numero: "Livre II",
    titre: "Le codex du rôle-play",
    icon: "fa-solid fa-hat-wizard",
    dek: "Ici, tu ne joues plus seulement à Minecraft — tu écris, avec les autres, l'histoire de Tetrago. Ces articles protègent le récit commun.",
    chapitres: [
      {
        id: "incarnation",
        titre: "Incarnation & immersion",
        icon: "fa-solid fa-masks-theater",
        articles: [
          { titre: "En terre RP, reste en personnage.", texte: "Dans les zones marquées « rôle-play actif », parle et agis comme ton personnage le ferait — pas comme un joueur derrière un écran." },
          // { titre: "/ooc, ta soupape hors-jeu.", texte: "Toute clarification technique passe par /ooc ou entre doubles parenthèses. Les deux discours ne se mélangent jamais." },
          { titre: "Ni méta-jeu, ni jeu de pouvoir.", texte: "Utiliser une information que ton personnage ignore, ou imposer une action à un autre joueur sans son accord, brise l'histoire de tous.", warn: true },
          { titre: "La cohérence prime sur la performance.", texte: "Un personnage lâche qui fuit un combat est plus intéressant qu'un héros qui gagne toujours — joue des failles, pas seulement des victoires." },
        ],
      },
      {
        id: "combat",
        titre: "Combat & mort",
        icon: "fa-solid fa-shield-halved",
        articles: [
          { titre: "Le combat se propose, il ne surprend pas.", texte: "Initie un affrontement par une mise en scène — émotes, dialogue — laissant à l'autre une chance de réagir avant les coups." },
          { titre: "La mort est une histoire, pas une punition.", texte: "Une perte définitive de personnage se négocie avec la victime et requiert son accord explicite. Seule exception : l'assassinat par piège scellé et validé (« Guerres & batailles »).", warn: true },
          { titre: "Blessures & convalescence.", texte: "Une défaite RP entraîne une convalescence jouée plutôt qu'une disparition instantanée ; sa durée se discute avec un modérateur RP." },
          { titre: "PvP en zone neutre.", texte: "Hors des terres marquées « conflit », tout affrontement reste soumis à l'accord des deux joueurs." },
        ],
      },
      {
        id: "magie",
        titre: "Magie & pouvoirs",
        icon: "fa-solid fa-wand-magic-sparkles",
        articles: [
          { titre: "Un don s'obtient, il ne s'improvise pas.", texte: "Toute capacité magique doit être validée par l'équipe Lore avant d'être jouée, avec ses limites écrites noir sur blanc." },
          { titre: "Le god-modding est interdit.", texte: "Aucun pouvoir n'est absolu ; chaque sort a un coût, un temps de préparation et une chance d'échec.", warn: true },
          { titre: "La magie se joue, elle ne se décrète pas.", texte: "« Je te transforme en pierre » n'est pas une action valide — propose, l'autre joueur dispose." },
        ],
      },
      {
        id: "royaumes",
        titre: "Royaumes & diplomatie",
        icon: "fa-solid fa-chess-rook",
        articles: [
          { titre: "Fonder un royaume.", texte: "Toute faction ou maison noble se déclare sur la page Civilisations — titre, gouvernement et date de fondation RP à l'appui." },
          { titre: "Les guerres se déclarent, elles ne s'improvisent pas.", texte: "Un conflit entre civilisations se prépare en amont avec un modérateur RP, qui encadre son issue et ses enjeux." },
          { titre: "Le territoire RP n'est pas la protection technique.", texte: "Revendiquer une terre en jeu (lore, bannière) est distinct du claim de construction — les deux se négocient séparément." },
        ],
      },
      {
        id: "guerres",
        titre: "Guerres & batailles",
        icon: "fa-solid fa-chess-knight",
        articles: [
          { titre: "Une armée à la mesure de son peuple.", texte: "Une civilisation lève au plus un soldat pour dix habitants de sa population officielle, relevée sur la carte. Les troupes fictives au-delà n'existent pas." },
          { titre: "Des troupes réparties et déclarées.", texte: "Au début du conflit, chaque camp déclare au modérateur RP de la guerre la répartition de ses soldats entre armées et garnisons. Une même troupe ne combat jamais en deux lieux à la fois." },
          { titre: "Déplacements publics, déplacements secrets.", texte: "Un déplacement public s'inscrit dans la chronologie de la guerre. Un déplacement secret doit être scellé en action secrète avant d'être joué : celui qu'on révèle sans l'avoir scellé n'a jamais eu lieu." },
          { titre: "Ne tombe que ce qui est désigné.", texte: "Pendant une guerre, seuls les bâtiments et zones destructibles désignés sur la fiche de la ville peuvent être détruits. Tout le reste demeure protégé : le détruire est un grief.", warn: true },
          { titre: "L'assassinat par piège.", texte: "Un piège posé en jeu peut tuer un personnage sans l'accord de sa victime, à deux conditions : avoir été scellé en action secrète avant d'être posé, et validé par un modérateur RP après les faits. Sans l'une ou l'autre, le piège ne fait que blesser.", warn: true },
        ],
      },
      {
        id: "coherence",
        titre: "Cohérence de l'époque",
        icon: "fa-solid fa-landmark",
        articles: [
          { titre: "Un Moyen Âge où la magie existe.", texte: "Tetrago vit à l'heure médiévale-fantastique : techniques, savoirs et constructions de son temps, et une magie encadrée par le chapitre « Magie & pouvoirs »." },
          { titre: "Ni poudre, ni machines.", texte: "Armes à feu, canons, explosifs, moteurs et inventions modernes n'existent pas en RP, même quand le jeu les permet." },
          { titre: "Bâtir selon son temps.", texte: "Bois, pierre, torchis et ardoise plutôt que façades lisses, grandes baies vitrées ou tours d'habitation : une ville se reconnaît à son époque." },
          { titre: "La mécanique se dissimule.", texte: "Pistons, redstone et automatismes sont permis s'ils sont cachés ou justifiés : une herse de château, un monte-charge de mine, jamais une machinerie apparente." },
          { titre: "En cas de doute, l'équipe Lore tranche.", texte: "Une construction ou un récit dont la cohérence se discute est soumis à l'équipe Lore, qui peut demander de l'adapter." },
        ],
      },
      {
        id: "fermes",
        titre: "Fermes & ressources",
        icon: "fa-solid fa-wheat-awn",
        articles: [
          { titre: "Toute ferme se déclare.", texte: "Chaque ferme, manuelle ou automatique, se déclare sur la page Fermes du site (/fermes) avec sa position, une photo et sa justification RP : qui l'exploite, ce qu'elle produit, et pourquoi. Un modérateur RP la valide." },
          { titre: "Toute ferme s'habille.", texte: "Elle est intégrée à un bâtiment cohérent avec ce qu'elle produit — moulin, étable, mine, atelier — sans machinerie ni mob apparents depuis l'extérieur.", warn: true },
          { titre: "Mise en conformité.", texte: "Un modérateur RP peut demander de déclarer, d'habiller ou de réduire une ferme : la demande s'affiche sur sa déclaration, qui repasse en examen une fois corrigée. Une ferme laissée hors règle peut être désactivée, comme les machines à lag." },
        ],
      },
      {
        id: "memoire",
        titre: "Mémoire & légendes",
        icon: "fa-solid fa-feather-pointed",
        articles: [
          { titre: "La légende commune se respecte.", texte: "L'histoire déjà écrite par d'autres joueurs — batailles, pactes, lignées — ne peut être réécrite sans leur accord." },
          { titre: "Contributions majeures validées.", texte: "Toute intrigue capable de changer la carte politique ou géographique de Tetrago passe par l'équipe Lore avant d'être jouée." },
          { titre: "Les archives du royaume.", texte: "Les grands événements RP méritent d'être consignés dans la Bibliothèque, pour nourrir la mémoire commune du serveur." },
        ],
      },
    ],
  },
];
