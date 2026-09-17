# ShardUI-2 — Documentation

Site web du serveur Minecraft RP **Tetrago** : comptes, bibliothèque, civilisations, religions, commerces,
alliances, guerres, personnages, codex et pages d'administration. Application React monopage qui consomme
[Shard-API](../Shard-API) et ouvre l'éditeur de [ShardUI-2-Maps](../ShardUI-2-Maps).

Version actuelle : `2.0.14` (voir `package.json`).

## Sommaire

- [Vue d'ensemble](#vue-densemble)
- [Installation](#installation)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Organisation du code](#organisation-du-code)
- [Pages et routes](#pages-et-routes)
- [Session et droits](#session-et-droits)
- [Appels à l'API](#appels-à-lapi)
- [Modales de formulaire](#modales-de-formulaire)
- [Liens avec la carte](#liens-avec-la-carte)
- [Icônes FontAwesome](#icônes-fontawesome)
- [Tests d'utilisabilité](#tests-dutilisabilité)
- [Déploiement](#déploiement)
- [Points d'attention](#points-dattention)

## Vue d'ensemble

| Élément | Choix |
| --- | --- |
| Interface | React 19, React Router 7 |
| Outil de build | Vite 8 |
| Style | Tailwind CSS 4 + DaisyUI 5 |
| Icônes | FontAwesome 7 (`@fortawesome/react-fontawesome`) |
| Alertes | SweetAlert2 |
| Markdown | `react-markdown` + `remark-gfm` |
| HTTP | `fetch` (`src/services/api.js`) |
| Tests | Playwright (`tests/ux`) |
| Qualité | ESLint 10 (`eslint.config.js`) |

## Installation

Prérequis : Node.js 18 ou plus, npm, une Shard-API accessible.

```bash
npm install            # ou, depuis la racine de Shard-2 : npm run ui:init
# créer .env (et .env.development pour le développement), voir Configuration
npm run dev
```

En développement, lancer aussi Shard-API (`npm run dev` dans `Shard-API`) et, pour l'éditeur de carte,
ShardUI-2-Maps (`npm run dev` dans `ShardUI-2-Maps`). `npm run dev` à la racine de Shard-2 lance les trois.

## Configuration

Vite lit `.env`, puis `.env.<mode>` par-dessus (`.env.development` pour `npm run dev`). Ces fichiers ne sont pas
versionnés. Seules les variables préfixées `VITE_` sont incluses dans le code envoyé au navigateur : **elles sont
publiques**.

| Variable | Lue par | Rôle |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `services/api.js` | URL de Shard-API sans `/api`. Vide : appels relatifs (`/api/...`) sur l'origine du site |
| `VITE_MAPS_BASE_URL` | `services/mapEditor.js` | URL de ShardUI-2-Maps pour l'éditeur (défaut `https://map.beta.tetrago.fr`) |
| `VITE_SERVER_URL` | `pages/home/HomePage.jsx` | Adresse du serveur Minecraft affichée sur l'accueil |
| `API_PROXY_TARGET` | `vite.config.js` | Cible du proxy `/api` du serveur de développement (défaut `http://127.0.0.1:8002`) ; non exposée |
| `VITE_API_USER`, `VITE_API_PASSWORD` | `getAuthToken()` | Non utilisées (voir [points d'attention](#points-dattention)) |

Configuration de développement actuelle (`.env.development`) :

```env
VITE_MAPS_BASE_URL=http://localhost:3005
VITE_API_BASE_URL=
API_PROXY_TARGET=http://127.0.0.1:8001
```

Avec `VITE_API_BASE_URL` vide, le navigateur n'appelle que le serveur Vite, qui relaie `/api` vers Shard-API.
Cela fonctionne aussi à travers VS Code Remote SSH, où seul le port de Vite est redirigé. `API_PROXY_TARGET` doit
correspondre à `api.development` dans la configuration de Shard-API.

Le serveur de développement accepte les noms d'hôte `localhost`, `192.168.5.100`, `tetrago.fr`, `beta.tetrago.fr` et
`dev.tetrago.fr` (`server.allowedHosts`).

## Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur Vite en mode `development` (lance `icons` avant) |
| `npm run start` | Serveur Vite ouvert au réseau (`0.0.0.0:5173`, mode `start`, lance `icons` avant) |
| `npm run build` | Build de production dans `dist/` (lance `icons` avant) |
| `npm run preview` | Sert le build de `dist/` |
| `npm run lint` | ESLint |
| `npm run icons` | Régénère `src/config/fontawesome.icons.js` |
| `npm run test:ux` | Tests Playwright |

## Organisation du code

```
src/
├── main.jsx                  # Point d'entrée : routeur, icônes, connexion de l'éditeur de carte
├── App.jsx                   # Routes et mise en page (contenu + pied de page)
├── main.css, App.css         # Styles globaux (Tailwind, DaisyUI)
├── services/
│   ├── api.js                # Tous les appels à Shard-API
│   ├── session.js            # Utilisateur et jeton en localStorage
│   ├── authorisation.js      # checkMemberAuth, checkUserID
│   └── mapEditor.js          # Ouverture de l'éditeur de carte et transmission du jeton
├── config/                   # Données de configuration, sans JSX
│   ├── modals/               # Un fichier par formulaire (civilisation.js, ville.js…), lu par DynamicModal
│   ├── navbar.js             # Entrées de la barre de navigation
│   └── fontawesome.icons.js  # Généré par npm run icons (ne pas éditer)
├── utils/                    # Utilitaires (erreurs d'API, titres, pluriels, couleurs, conflits, personnages…)
├── pages/                    # Une page par route (voir ci-dessous)
└── components/
    ├── ui/                   # Générique : titres, Stat, ListCard, Skeleton, éditeurs de texte, icônes
    ├── layout/               # Barre de navigation, pied de page, bandeaux (Hero, GrimoireHero, ImageHero)
    ├── modals/               # Moteur de modales (DynamicModal, FormModal) et fields/ (champs dynamiques)
    ├── users/                # Comptes et profils (Login, Register, Profil, UsersList…)
    ├── membres/              # Appartenance à une entité RP (MemberButton, JoinHint, TransferFounderModal)
    ├── bibliotheque/         # Étagères de journaux et livres, chapitres
    ├── civilisations/        # Ville, religions d'une ville, résidents
    ├── personnages/          # Avatar et chip de personnage
    ├── conflits/             # Alliances et guerres (ConflictsSection)
    └── carte/                # Carte intégrée (MapEmbed)
scripts/generate-fontawesome-icons.mjs
tests/ux/                     # Tests Playwright et faux services
public/                       # Logos et images
```

### Conventions de rangement

- **Imports internes en alias `@/`** : `@` pointe sur `src/` (déclaré dans `vite.config.js` et `jsconfig.json`).
  On écrit `import Navbar from "@/components/layout/Navbar"` plutôt qu'un chemin relatif `../../`.
  Sans exception : même un CSS voisin s'importe par l'alias.
- **Dossiers en minuscules** ; composants en `PascalCase`, données et utilitaires en `camelCase` / `kebab-case`.
- **Une page = un fichier `*Page.jsx`** dont le nom est exactement celui de son export par défaut,
  dans `pages/<domaine>/`.
- **`components/` ne contient que des composants** : toute donnée de configuration va dans `config/`,
  toute fonction sans rendu dans `utils/`.
- **Un composant utilisé par plusieurs domaines** va dans `components/ui/` ; sinon il reste dans le dossier
  de son domaine.

### Utilitaires notables (`utils/`)

| Fichier | Rôle |
| --- | --- |
| `apiError.js` | Message lisible à partir d'une erreur de l'API (nomme les champs refusés par leur libellé) |
| `conflits.js` | Libellés et règles partagés des alliances et guerres ; entités que l'utilisateur peut représenter |
| `contrastColor.js` | Texte blanc ou noir selon la couleur de fond (YIQ) |
| `fontawesomeFull.js` | Chargement à la demande des packs d'icônes complets |
| `getAuthToken.js` | `getUserToken()` : demande un jeton à `/users/token` |
| `memberships.js` | Civilisations, religions et commerces dont un utilisateur est membre |
| `oauthProviders.js` | Fournisseurs affichés (Discord, Minecraft/Microsoft), `soon: true` pour « Bientôt disponible » |
| `pageTitle.js` | `RouteTitle` (titre par route) et `usePageTitle` (nom de l'élément affiché) |
| `personnages.js` | Libellés, résidence, rendu du skin (mc-heads.net), options du formulaire |
| `plural.js` | « 1 ville », « 3 villes » |
| `religionColor.js` | Couleur et icône d'une religion, identiques sur la carte |
| `requireLogin.js` | Lance une action ou propose de se connecter / s'inscrire |
| `showModal.js` | Ouvre une modale `<dialog>` par son identifiant |

## Pages et routes

Les routes sont déclarées dans `src/App.jsx`. Le titre de l'onglet vient de `pageTitle.js`
(« Titre - Tetrago »), puis du nom de l'élément sur les pages de détail.

| Route | Page | Accès |
| --- | --- | --- |
| `/` | Accueil, adresse du serveur | Public |
| `/codex` | Règles du serveur (contenu dans `pages/codex/CodexPage.jsx`) | Public |
| `/login`, `/register` | Connexion, inscription, connexion par compte externe | Public |
| `/auth/:provider/callback` | Retour de Discord ou Microsoft (connexion ou liaison) | Public |
| `/profil` | Mon profil : informations, comptes liés, adhésions, personnages, actions en attente | Connecté |
| `/profil/:user_id` | Profil public (rôles, compte Minecraft, adhésions, écrits) | Public |
| `/users` | Liste des utilisateurs | Administrateur |
| `/users/:user_id` | Édition d'un profil (rôles administrateur et modérateur RP) | Administrateur |
| `/bibliotheque` | Étagères des journaux et des livres | Public |
| `/bibliotheque/journal/:id` | Messages du salon Discord, attribution aux personnages | Public (actions : connecté) |
| `/bibliotheque/livre/:id` | Livre, chapitres et contenus | Public (édition : règle du livre) |
| `/civilisations`, `/civilisation/:id` | Liste et fiche (gouvernement, membres, villes, alliances, guerres, habitants, carte) | Public |
| `/civilisation/:civ_id/ville/:id` | Ville : quartiers, religions, magasins, habitants, carte | Public |
| `/quartier/:id` | Quartier : religions, habitants, carte | Public |
| `/religions`, `/religion/:id` | Liste et fiche (membres, présence, guerres de religion) | Public |
| `/commerces`, `/commerce/:id` | Liste et fiche (membres, magasins, filiales) | Public |
| `/alliances`, `/alliance/:id` | Liste et fiche (membres, invitations, guerres) | Public |
| `/guerres`, `/guerre/:id` | Liste, fiche, chronologie, camps, zones de conflit | Public (déclarations non validées : parties et modérateurs) |
| `/personnages`, `/personnage/:id` | Liste et fiche d'un personnage | Public |
| `/admin` | Redirige vers `/admin/dimensions` | — |
| `/admin/dimensions` | Dimensions de la carte | Administrateur |
| `/admin/personnages` | Espèces et classes | Administrateur ou modérateur RP |
| `/admin/monde` | Statistiques du monde : chiffres clés, évolution, lieux, zones, joueurs, dimensions | Administrateur |
| `*` | Page 404 | — |

Les routes au singulier sans identifiant (`/civilisation`, `/religion`, `/commerce`, `/alliance`, `/guerre`,
`/personnage`, `/bibliotheque/journal`, `/bibliotheque/livre`) redirigent vers la liste.

La barre de navigation (`components/layout/Navbar.jsx`) lit ses entrées dans `config/navbar.js` : Codex, Bibliothèque,
Civilisations, Religions, Commerces, Alliances, Guerres, Personnages. Le menu du compte ajoute les pages
d'administration selon les rôles.

## Session et droits

### Connexion

1. `Login` appelle `POST /api/users/login` pour vérifier les identifiants et récupérer le profil.
2. Il demande ensuite un jeton à `POST /api/users/token` (`getUserToken`, durée choisie par l'utilisateur).
3. Le profil est enregistré dans `localStorage.user`, le jeton dans `localStorage.token`.

Connexion par un compte externe : le bouton appelle `/users/oauth/<fournisseur>/login`, le navigateur part chez le
fournisseur, puis `OAuthCallback` (`/auth/:provider/callback`) envoie `code` et `state` à l'API. En mode `login`,
la page enregistre `access_token` et `user` ; en mode `link`, elle confirme la liaison. Le compte externe doit avoir
été lié depuis le profil au préalable.

`services/session.js` :

- `getSessionUser()` renvoie l'utilisateur seulement si **l'utilisateur et le jeton** sont présents.
- `clearSession()` efface les deux (déconnexion, ou session expirée).

### Affichage selon les droits

`services/authorisation.js` reproduit les règles de l'API pour afficher ou masquer les boutons :

- `checkMemberAuth(members, setAuth)` : vrai pour un Fondateur ou Admin de l'entité, ou un administrateur du site.
- `checkUserID(userID, setAuth)` : vrai pour l'utilisateur lui-même ou un administrateur.

Ces contrôles ne protègent rien : l'API vérifie chaque action et renvoie 401 ou 403 sinon.

## Appels à l'API

Tout passe par `src/services/api.js`. Les URL sont construites sur `${VITE_API_BASE_URL}/api`.

| Fonction | Usage |
| --- | --- |
| `apiRequest(method, path, body)` | Requête authentifiée (jeton `localStorage.token`). Renvoie le JSON, ou lève une `Error` au message lisible : session expirée (401), champs invalides (422), ou `detail` de l'API |
| `publicGet(path)` (interne) | Lecture publique ; l'erreur porte `status` |
| `dynamicLoadData(url, method, token)` | Chargement générique des modales |
| `getXxx()` | Lectures (civilisations, religions, commerces, villes, quartiers, livres, journaux, alliances, guerres, personnages, dimensions…) |
| `postToken`, `verifyToken` | Jetons |
| `startOAuth`, `completeOAuth`, `getLinkedPlatforms`, `unlinkPlatform`, `getPublicPlatforms` | Comptes externes |
| `transferFounder*`, `deleteMember*` | Membres |
| `createDimension`, `updateDimension`, `deleteDimension` | Dimensions |
| `getMondeResume`, `getMondeJoueurs`, `getMondeZones`, `getMondeHistoriqueLieu`, `resoudreMondePseudos`, `deleteMondeReleve` | Statistiques du monde |

Les fonctions récentes (alliances, guerres, personnages, monde) utilisent `apiRequest` / `publicGet`. Les plus
anciennes font leur propre `fetch` ; pour un nouvel appel, préférer les deux premières.

Quelques pages gardent des listes en `localStorage` (`journaux`, `livres`, `civilisations`) pour un affichage
immédiat au retour sur la page ; l'API reste la source.

## Modales de formulaire

Les formulaires de création et d'édition sont décrits par des objets de configuration
(`config/modals/*.js`) et rendus par `DynamicModal` / `FormModal`.

```js
export const villeModal = {
  id:      { default, add: "Modal_Add_Ville", edit: "Modal_Edit_Ville_$id" },   // id du <dialog>
  title:   { default, add, edit },
  success: { default, add, edit },
  error:   { default, add, edit },
  champs: [
    { name, label, description, placeholder, type, defaultValue, option: [], required, display, param },
  ],
  api: {
    get:    { method: "GET",    url: "$apiURL/civilisations/villes/id/$id" },
    create: { method: "POST",   url: "$apiURL/civilisations/villes/create" },
    update: { method: "PUT",    url: "$apiURL/civilisations/villes/update/$id" },
    delete: { method: "DELETE", url: "$apiURL/civilisations/villes/delete?VilleID=$id" },
  },
  dataKey: "ville",               // clé de la réponse GET contenant l'objet édité
  is_activate: { delete: true },  // bouton Supprimer
};
```

- **Remplacements** dans les URL : `$apiURL`, `$id` (paramètre `:id` de la route), `$local-id` (identifiant passé
  à la modale par la page, par exemple une ville dans la liste d'une civilisation).
- **Champs** : `type` choisit le composant dans `components/modals/fields/DynamicField.jsx` : `custom`, `toggle`,
  `checkbox`, `radio`, `select`, `textarea`, `color`, `icon`, `date`, et les champs spécialisés `users`,
  `villes`, `localisation`, `civilisation_dirigeante`, `commerce_dirigeant`. Tout autre type (`text`, `number`,
  `url`…) donne un `<input>` de ce type. `display: false` masque le champ.
- **Paramètres** (`param: true`) : valeur remplie automatiquement en mode `add` — `name: "user_id"` reçoit
  l'utilisateur connecté, `description: "url"` + `label: "id"` le paramètre `:id` de la route,
  `description: "local"` + `label: "id"` l'identifiant local.
- **Modes** : `add` part des `defaultValue` ; `edit` charge l'objet avec `api.get` puis `dataKey`.
- `showModal(config, mode, local)` ouvre la modale correspondante.

Pour un nouveau formulaire : copier `config/modals/exemple.js`, adapter les champs et les URL, puis placer
`<DynamicModal config={...} mode="add" />` dans la page.

## Liens avec la carte

### Carte intégrée

`MapEmbed` affiche une iframe `<dimension>-embedfull-<calque>` de ShardUI-2-Maps centrée sur une ville, un quartier,
les magasins d'un commerce ou les zones d'une guerre. `MapEmbedLocalisation` (champ `localisation` des modales)
affiche la vue `<dimension>-locate-<calque>`, qui renvoie la position au site par `postMessage`
(`{ source: "minedmap", type: "move", x, z, zoom }`) pour remplir les coordonnées.

Ces deux composants utilisent l'adresse fixe `https://map.beta.tetrago.fr` (voir [points d'attention](#points-dattention)).

### Éditeur

`openMapEditor({ dimension, type, id, x, z, zoom })` (`services/mapEditor.js`) ouvre dans un nouvel onglet :

```
<VITE_MAPS_BASE_URL>/<dimension.link>-editor-civilisations?<type>=<id>#x=<x>&z=<z>&zoom=<zoom>
```

| `type` | Édition |
| --- | --- |
| `civilisation` | Marqueurs de la civilisation |
| `ville` | Frontières de la ville |
| `quartier` | Frontières du quartier |
| `guerre` | Zones de conflit (guerre en cours) |

Le site et la carte n'ont pas la même origine, donc pas le même `localStorage`. L'éditeur demande le jeton par
`postMessage` ; `installMapEditorAuth()` (appelée dans `main.jsx`) répond :

- uniquement aux fenêtres ouvertes depuis cet onglet (`event.source.opener === window`) ;
- uniquement si leur origine est celle de `VITE_MAPS_BASE_URL` (sinon message `editor-auth-refused` avec la raison) ;
- avec le jeton **courant** : une reconnexion sur le site est reprise par l'éditeur.

```
Éditeur (Maps)                                   Site (ShardUI-2)
  { source: "minedmap", type: "editor-auth-request" } ──►
  ◄── { source: "shardui", type: "editor-auth", token }
```

Le jeton n'est valable que pour l'API qui l'a émis : `SHARD_API_BASE_URL` de la carte doit viser la même Shard-API
que `VITE_API_BASE_URL`.

## Icônes FontAwesome

Pour réduire le code chargé au démarrage (≈ 1 Mo au lieu de ≈ 2,5 Mo), seules les icônes citées dans le code sont
enregistrées au lancement :

1. `npm run icons` (lancé avant `dev`, `start` et `build`) parcourt `src/` à la recherche de
   `fa-solid|fa-regular|fa-brands|fas|far|fab fa-<nom>` et écrit `src/config/fontawesome.icons.js`.
2. `main.jsx` les ajoute à la bibliothèque.
3. Les icônes choisies par les joueurs (religions, couvertures) et le sélecteur (`IconPicker`) chargent les packs
   complets à la demande (`fontawesomeFull.js`, `DynamicIcon`).

Une icône construite dynamiquement (`` `fa-solid fa-${nom}` ``) est invisible pour la recherche : l'ajouter à
`EXTRA_ICONS` dans `scripts/generate-fontawesome-icons.mjs`. Une icône citée mais absente des packs est signalée.

## Tests d'utilisabilité

```bash
npm run test:ux
```

Playwright (`playwright.config.js`) démarre quatre serveurs sur des ports dédiés, sans toucher à la vraie base :

| Serveur | Port | Rôle |
| --- | --- | --- |
| `tests/ux/fake-discord.mjs` | 8013 | Faux Discord, Microsoft/Xbox/Minecraft et playerdb.co |
| `tests/ux/start-test-api.mjs` | 8011 | Shard-API sur une copie de `ShardDB.db` dans `tests/ux/.env-api/` |
| `tests/ux/fake-maps.mjs` | 8014 | Fausse carte pour la connexion de l'éditeur |
| Vite | 5183 | Le site, relié à l'API de test |

`start-test-api.mjs` cherche Shard-API dans `../Shard-API` (ou `SHARD_API_DIR`) et utilise son `.venv` : installer
Shard-API d'abord. Les tests tournent l'un après l'autre (un seul worker), en français, sur Chrome.

| Fichier | Parcours |
| --- | --- |
| `visiteur.spec.js` | Navigation sans compte |
| `nouvel-utilisateur.spec.js` | Inscription, connexion, premières actions |
| `profil-public.spec.js` | Profil public |
| `ville.spec.js`, `quartier.spec.js` | Villes, quartiers, religions |
| `alliances.spec.js`, `guerres.spec.js` | Alliances, cycle de vie des guerres, chronologie, annonces |
| `personnages.spec.js` | Personnages et attribution de messages |
| `discord.spec.js`, `microsoft.spec.js` | Liaison et connexion par compte externe |
| `editeur-carte.spec.js` | Ouverture de l'éditeur et transmission du jeton |
| `monde.spec.js` | Envoi d'un relevé et page `/admin/monde` |
| `mobile.spec.js` | Affichage mobile |

Résultats et traces d'échec : `tests/ux/.results/`. Ajouter un test à chaque nouvelle fonctionnalité.

## Déploiement

```bash
npm run build          # ou, depuis la racine de Shard-2 : npm run ui:build
```

`dist/` contient un site statique à servir par nginx (ou équivalent) avec un repli vers `index.html` pour les routes
du routeur :

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Le build est découpé en `react-vendor`, `ui-vendor` (DaisyUI), `vendor-fontawesome` (moteur seul) et `vendor-misc`
(SweetAlert2, react-modal) ; les packs d'icônes complets restent dans leurs propres fichiers, chargés à la demande.

En production, `VITE_API_BASE_URL` doit pointer vers la Shard-API publique (le proxy de Vite n'existe pas), ou le
serveur web doit relayer `/api` vers elle. Les variables sont figées au moment du build : reconstruire après un
changement de `.env`.

Chaque `redirect_uri` OAuth de Shard-API pointe vers `https://<site>/auth/<fournisseur>/callback`.

## Points d'attention

- **`VITE_API_USER` / `VITE_API_PASSWORD`** : lues par `getAuthToken()`, qui n'est appelée nulle part. Comme toute
  variable `VITE_`, elles seraient incluses dans le code public : ne pas y mettre les identifiants administrateur,
  et supprimer la fonction si elle reste inutilisée.
- **Profil en `localStorage`** : `is_admin` et `is_moderateur` y sont modifiables par l'utilisateur. Cela ne change
  que l'affichage ; l'API refuse les actions.
- **Formats de réponse** : selon les routes, le statut est dans `code`, `error` ou seulement dans le code HTTP.
  `apiRequest` gère les erreurs HTTP ; les anciennes fonctions testent parfois `error === 200`.
- **Adresse de la carte codée en dur** (`https://map.beta.tetrago.fr`) dans `MapEmbed`, `MapEmbedLocalisation`,
  `Navbar`, `Home`, `Admin/Monde` et `Admin/Dimensions` : seul l'éditeur suit `VITE_MAPS_BASE_URL`. En développement,
  les cartes intégrées affichent donc la carte en ligne.
- **Dépendance `react-scripts` `^0.0.0`** dans `package.json` : inutilisée avec Vite, peut être retirée.
- **README.md** : la liste des routes et la structure y sont partielles ; ce document décrit l'état actuel.
