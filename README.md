# ShardUI-2

> Documentation complète : [DOCUMENTATION.md](DOCUMENTATION.md).

Interface web du serveur **Tetrago** : portail communautaire du serveur (comptes utilisateurs, bibliothèque de récits/journaux, fiches de civilisations, etc.). Application React consommant l'API [Shard-API](../Shard-API).

## Stack technique

- [React 19](https://react.dev/) + [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/) (build & dev server)
- [Tailwind CSS 4](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/) pour les composants UI
- [Axios](https://axios-http.com/) / `fetch` pour les appels API
- [Font Awesome](https://fontawesome.com/) pour les icônes
- [SweetAlert2](https://sweetalert2.github.io/) pour les popups
- [react-markdown](https://github.com/remarkjs/react-markdown) + `remark-gfm` pour le rendu Markdown

## Prérequis

- Node.js (version récente, ≥ 18 recommandé)
- npm
- Une instance de [Shard-API](../Shard-API) accessible (locale ou distante)

## Installation

```bash
npm install
```

## Configuration

Copier [.env.example](.env.example) en `.env` à la racine du projet (non versionné) et renseigner les valeurs :

```bash
cp .env.example .env
```

- `VITE_API_BASE_URL` : URL de base de Shard-API (les appels sont faits sur `${VITE_API_BASE_URL}/api`). Vide, les
  appels sont relatifs (`/api/...`) sur l'origine du site — utile derrière le proxy du serveur de développement.
- `VITE_SERVER_URL` : adresse du serveur Minecraft, affichée sur l'accueil.
- `VITE_MAPS_BASE_URL` (optionnel) : URL de ShardUI-2-Maps, utilisée par les cartes intégrées, les liens du site et
  l'éditeur (par défaut `https://map.beta.tetrago.fr`, voir [src/config/maps.js](src/config/maps.js)). En
  développement, `.env.development` la fixe à `http://localhost:3005`. Le jeton de connexion est transmis à
  l'éditeur par `postMessage` : l'API utilisée par la carte doit être la même que `VITE_API_BASE_URL`.

## Scripts disponibles

```bash
npm run dev       # Lance le serveur de développement Vite
npm run start     # Lance le serveur de dev, accessible sur le réseau (0.0.0.0:5173)
npm run build     # Build de production dans dist/
npm run preview   # Prévisualise le build de production
npm run lint      # Lint du code avec ESLint
```

## Structure du projet

```
src/
├── components/
│   ├── ui/             # Générique et réutilisable : titres, Stat, ListCard, Skeleton, éditeurs de texte…
│   ├── layout/         # Navbar, Footer, Hero / ImageHero / GrimoireHero
│   ├── modals/         # Moteur de modales (DynamicModal, FormModal) + fields/ (champs dynamiques)
│   ├── users/          # Comptes et profils : Login, Register, Profil, UsersList…
│   ├── membres/        # Appartenance à une entité RP : MemberButton, JoinHint, TransferFounderModal
│   ├── bibliotheque/   # Étagères de journaux/livres, chapitres
│   ├── civilisations/  # Ville, religions d'une ville, résidents
│   ├── personnages/    # Avatar et chip de personnage
│   ├── conflits/       # Alliances et guerres (ConflictsSection)
│   └── carte/          # Intégration de ShardUI-2-Maps (MapEmbed)
├── config/             # Données de configuration, sans JSX
│   ├── modals/         # Un fichier par formulaire (civilisation.js, ville.js…), lu par DynamicModal
│   ├── navbar.js       # Entrées de la barre de navigation
│   ├── maps.js         # MAPS_BASE_URL : adresse de ShardUI-2-Maps
│   └── fontawesome.icons.js  # Généré par `npm run icons` — ne pas modifier à la main
├── pages/              # Une page par route ; dossier en minuscules, fichier = nom de l'export (*Page.jsx)
│   ├── home/ users/ bibliotheque/ civilisations/ religions/ commerces/
│   ├── alliances/ guerres/ personnages/ codex/ admin/ template/ not-found/
├── services/
│   ├── api.js            # Appels HTTP vers Shard-API (auth, users, bibliothèque, civilisations…)
│   ├── authorisation.js  # Gestion des droits/rôles
│   ├── session.js        # Utilisateur courant et jeton stockés côté navigateur
│   └── mapEditor.js      # Pont d'authentification avec l'éditeur de carte
├── utils/              # Fonctions utilitaires (jeton, fetch, modales, couleurs, dates…)
├── App.jsx / App.css   # Déclaration des routes
└── main.jsx / main.css # Point d'entrée
```

### Conventions

- **Imports internes en alias `@/`** — `@` pointe sur `src/` (déclaré dans [vite.config.js](vite.config.js)
  et [jsconfig.json](jsconfig.json)). On écrit `import Navbar from "@/components/layout/Navbar"`, jamais
  `../../components/...`. La règle est sans exception — y compris pour un CSS voisin
  (`import "@/components/layout/Navbar.css"`) — pour que déplacer un fichier ne casse jamais ses imports.
- **Dossiers en minuscules**, fichiers de composants en `PascalCase`, fichiers de données/utilitaires en `camelCase`
  ou `kebab-case`.
- **Une page = un fichier `*Page.jsx`** dont le nom correspond exactement à l'export par défaut.
- **`components/` ne contient que des composants.** Toute donnée de configuration va dans `config/`, toute
  fonction sans rendu dans `utils/`.
- **Un composant partagé par plusieurs domaines** va dans `components/ui/` ; sinon il reste dans le dossier
  de son domaine.

## Routes principales

Déclarées dans [src/App.jsx](src/App.jsx). Les accès indiqués sont ceux de l'affichage : c'est l'API qui fait foi.

| Route | Description | Accès |
|---|---|---|
| `/` | Accueil, adresse du serveur | Public |
| `/codex` | Règles du serveur | Public |
| `/roadmap` | Feuille de route : fonctionnalités disponibles, en chantier et à venir | Public |
| `/login`, `/register` | Connexion, inscription, connexion par compte externe | Public |
| `/auth/:provider/callback` | Retour de Discord ou Microsoft | Public |
| `/profil` | Mon profil : informations, comptes liés, adhésions, personnages | Connecté |
| `/profil/:user_id` | Profil public | Public |
| `/users`, `/users/:user_id` | Liste et édition des utilisateurs | Administrateur |
| `/bibliotheque` | Étagères des journaux et des livres | Public |
| `/bibliotheque/journal/:id`, `/bibliotheque/livre/:id` | Détail d'un journal / livre | Public |
| `/civilisations`, `/civilisation/:id` | Liste et fiche de civilisation | Public |
| `/civilisation/:civ_id/ville/:id`, `/quartier/:id` | Ville, quartier | Public |
| `/religions`, `/religion/:id` | Liste et fiche de religion | Public |
| `/commerces`, `/commerce/:id` | Liste et fiche de commerce | Public |
| `/alliances`, `/alliance/:id` | Liste et fiche d'alliance | Public |
| `/guerres`, `/guerre/:id` | Liste, fiche, chronologie, camps, zones | Public |
| `/personnages`, `/personnage/:id` | Liste et fiche de personnage | Public |
| `/admin/dimensions`, `/admin/monde` | Dimensions de la carte, statistiques du monde | Administrateur |
| `/admin/personnages` | Espèces et classes | Administrateur ou modérateur RP |
| `*` | Page 404 | — |

Les routes au singulier sans identifiant (`/civilisation`, `/religion`, `/commerce`, `/alliance`, `/guerre`,
`/personnage`, `/bibliotheque/journal`, `/bibliotheque/livre`) redirigent vers la liste correspondante.
Le détail de chaque page figure dans [DOCUMENTATION.md](DOCUMENTATION.md#pages-et-routes).

## Déploiement

```bash
npm run build
```

Le résultat est généré dans `dist/` et peut être servi par n'importe quel serveur statique (nginx, etc.). Le build est découpé en chunks (`react-vendor`, `ui-vendor`, `vendor-fontawesome`, `vendor-misc`) pour optimiser le chargement — voir [vite.config.js](vite.config.js).

## Projets liés

- [Shard-API](../Shard-API) — API backend consommée par cette interface
- [ShardUI-2-Maps](../ShardUI-2-Maps) — Application de cartographie du serveur
