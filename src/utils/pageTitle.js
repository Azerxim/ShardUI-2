import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";

const SITE_NAME = "Tetrago";

// Titre par défaut de chaque route, affiché dès l'arrivée sur la page.
// Les pages de détail le remplacent par le nom de l'élément une fois chargé (usePageTitle).
const ROUTE_TITLES = [
    ["/", null],
    ["/login", "Connexion"],
    ["/register", "Inscription"],
    ["/auth/:provider/callback", "Connexion"],
    ["/profil", "Mon profil"],
    ["/profil/:user_id", "Profil"],
    ["/users", "Utilisateurs"],
    ["/users/:user_id", "Éditeur de profil"],
    ["/bibliotheque", "Bibliothèque"],
    ["/bibliotheque/journal/:id", "Journal"],
    ["/bibliotheque/livre/:id", "Livre"],
    ["/civilisations", "Civilisations"],
    ["/civilisation/:id", "Civilisation"],
    ["/civilisation/:civ_id/ville/:id", "Ville"],
    ["/quartier/:id", "Quartier"],
    ["/religions", "Religions"],
    ["/religion/:id", "Religion"],
    ["/commerces", "Commerces"],
    ["/commerce/:id", "Commerce"],
    ["/alliances", "Alliances"],
    ["/alliance/:id", "Alliance"],
    ["/guerres", "Guerres"],
    ["/guerre/:id", "Guerre"],
    ["/personnages", "Personnages"],
    ["/personnage/:id", "Personnage"],
    ["/codex", "Codex"],
    ["/admin/dimensions", "Dimensions"],
    ["/admin/personnages", "Espèces et classes"],
    ["/admin/monde", "Statistiques du monde"],
];

const setDocumentTitle = (title) => {
    document.title = title ? `${title} - ${SITE_NAME}` : SITE_NAME;
};

// Placé avant <Routes> : son effet passe avant ceux des pages lors d'un changement de route
export function RouteTitle() {
    const { pathname } = useLocation();

    useEffect(() => {
        const route = ROUTE_TITLES.find(([path]) => matchPath(path, pathname));
        setDocumentTitle(route ? route[1] : "Page introuvable");
    }, [pathname]);

    return null;
}

// Titre propre à la page (nom de l'élément affiché) ; ignoré tant qu'il n'est pas chargé
export function usePageTitle(title) {
    useEffect(() => {
        if (title) setDocumentTitle(title);
    }, [title]);
}
