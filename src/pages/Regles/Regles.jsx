import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "../../components/Navigation/Navbar";
import GrimoireHero from "../../components/Layouts/GrimoireHero";
import TitleH1 from "../../components/Objects/TitleH1";
import TitleH2 from "../../components/Objects/TitleH2";

// ===== Contenu du codex =====
// Chaque article peut porter `warn: true` pour les fautes à tolérance zéro.
const livres = [
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
          { titre: "Monnaie du royaume uniquement.", texte: "Aucune transaction contre argent réel, biens externes ou service tiers n'est autorisée.", warn: true },
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
          { titre: "La mort est une histoire, pas une punition.", texte: "Une perte définitive de personnage se négocie avec la victime et requiert son accord explicite.", warn: true },
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

const sommaire = livres.flatMap((livre) =>
  livre.chapitres.map((chapitre) => ({ ...chapitre, livre: livre.numero }))
);

export default function ReglesPage() {
  return (
    <>
      <Navbar active="regles" />
      <div className="bg-base-100">
        <main className="container mx-auto p-4">

          {/* Hero façon grimoire étoilé, cohérent avec l'accueil */}
          <GrimoireHero
            icon="fa-solid fa-scroll"
            title="Le Codex de Tetrago"
            description="Deux livres tiennent ce monde debout : la loi qui protège le serveur, et le codex qui protège l'histoire que nous écrivons ensemble. Le lire n'est pas une option — c'en est la condition."
          />

          {/* Sommaire */}
          <section className="mb-14 scroll-mt-24">
            <TitleH2 text="Sommaire" icon="fa-solid fa-list-ul" />
            <div className="flex flex-wrap gap-2 mt-3">
              {sommaire.map((chapitre) => (
                <a
                  key={chapitre.id}
                  href={`#${chapitre.id}`}
                  className="btn btn-sm bg-base-200 hover:bg-base-300 rounded-full"
                >
                  <FontAwesomeIcon icon={chapitre.icon} />
                  <span>{chapitre.titre}</span>
                </a>
              ))}
            </div>
          </section>

          {/* Livres */}
          {livres.map((livre) => (
            <section key={livre.id} className="mb-16">
              <TitleH1 text={`${livre.numero} — ${livre.titre}`} icon={livre.icon} />
              <p className="mt-3 mb-6 opacity-80 max-w-2xl">{livre.dek}</p>

              <div className="flex flex-col gap-4">
                {livre.chapitres.map((chapitre) => (
                  <div
                    key={chapitre.id}
                    id={chapitre.id}
                    className="bg-base-200 p-4 rounded-3xl shadow-md scroll-mt-24"
                  >
                    <TitleH2 text={chapitre.titre} icon={chapitre.icon} classes="" />
                    <div className="flex flex-col gap-3 mt-3">
                      {chapitre.articles.map((article, index) => (
                        <div key={index} className="flex gap-3">
                          <span className="opacity-50 mt-0.5">{index + 1}.</span>
                          <p>
                            <strong>{article.titre}</strong>{" "}
                            {article.warn && (
                              <span className="badge badge-error badge-sm align-middle mx-1">
                                Zéro tolérance
                              </span>
                            )}
                            {article.texte}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Serment de clôture */}
          <section className="grimoire-hero rounded-3xl py-16 px-4 text-center">
            <div className="grimoire-stars"></div>
            <div className="relative flex flex-col items-center gap-4 text-neutral-content">
              <FontAwesomeIcon icon="fa-solid fa-feather-pointed" size="2x" className="text-warning" />
              <h2 className="text-2xl font-bold">Le Serment</h2>
              <p className="max-w-xl italic opacity-90">
                « Je jure, en foulant les terres de Tetrago, d'honorer ce codex — de bâtir sans détruire, de jouer
                sans tricher, d'incarner sans imposer. Que ma parole vaille sceau. »
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <a href="/civilisations" className="btn btn-secondary">
                  <FontAwesomeIcon icon="fa-solid fa-flag" />
                  Fonder ma civilisation
                </a>
                <a
                  href="https://discord.gg/nUFwE9S"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost bg-base-200"
                >
                  <FontAwesomeIcon icon="fa-brands fa-discord" />
                  Une question ? Le Discord
                </a>
              </div>
            </div>
          </section>

        </main>
      </div>
    </>
  );
}
