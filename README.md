# ShardUI-2

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

Créer un fichier `.env` à la racine du projet (non versionné) avec les variables suivantes :

```env
VITE_API_USER=
VITE_API_PASSWORD=
VITE_SERVER_URL=
VITE_API_BASE_URL=
```

- `VITE_API_BASE_URL` : URL de base de l'API Shard-API consommée par le front (les appels sont faits sur `${VITE_API_BASE_URL}/api`).
- `VITE_SERVER_URL` : URL du serveur minecraft.
- `VITE_API_USER` / `VITE_API_PASSWORD` : identifiants administrateur utilisés pour l'authentification côté API.

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
│   ├── Buttons/       # Boutons réutilisables (copie, membre, utilisateur…)
│   ├── Functions/     # Fonctions utilitaires (auth token, fetch de données, modales…)
│   ├── Layouts/       # Header/Footer/Navbar
│   ├── Modals/        # Modales de configuration (civilisations, gouvernement, journal, livres…)
│   └── Objects/       # Composants UI (éditeurs de texte, étagère de livres, profils…)
├── pages/
│   ├── Home/           # Pages d'accueil (variantes classique / innovante / creative)
│   ├── Users/           # Login, inscription, profils, gestion des utilisateurs
│   ├── Bibliotheque/    # Journaux et livres
│   ├── Civilisations/   # Fiches de civilisations
│   └── NotFound/        # Page 404
├── services/
│   ├── api.js            # Appels HTTP vers Shard-API (auth, users, bibliothèque, civilisations…)
│   └── authorisation.js  # Gestion des droits/rôles
├── App.jsx    # Déclaration des routes
└── main.jsx   # Point d'entrée
```

## Routes principales

| Route | Description |
|---|---|
| `/` | Accueil |
| `/login`, `/register` | Authentification |
| `/profil`, `/profil/:user_id` | Profil courant / profil public |
| `/users`, `/users/:user_id` | Liste et administration des utilisateurs |
| `/bibliotheque` | Bibliothèque (journaux & livres) |
| `/bibliotheque/journal/:id`, `/bibliotheque/livre/:id` | Détail d'un journal / livre |
| `/civilisations`, `/civilisation/:id` | Liste et fiche de civilisation |

## Déploiement

```bash
npm run build
```

Le résultat est généré dans `dist/` et peut être servi par n'importe quel serveur statique (nginx, etc.). Le build est découpé en chunks (`react-vendor`, `ui-vendor`, `vendor-fontawesome`, `vendor-misc`) pour optimiser le chargement — voir [vite.config.js](vite.config.js).

## Projets liés

- [Shard-API](../Shard-API) — API backend consommée par cette interface
- [ShardUI-2-Maps](../ShardUI-2-Maps) — Application de cartographie du serveur
