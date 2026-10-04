import { MAISON_COULEUR_DEFAUT, MAISON_ICONS, MAISON_ICON_DEFAUT } from "@/config/lignees";

// Formulaire d'une maison noble, partagé par la liste (fondation) et la fiche (modification).
// chefs : options du chef (ses personnages à la fondation, les membres ensuite)
export const maisonChamps = ({ chefs, civilisations }) => [
    { name: "title", label: "Nom", type: "text", required: true, placeholder: "Ex. Orval, du Val-Sombre" },
    { name: "chef_id", label: "Chef de la maison", type: "select", required: true, options: chefs, empty: "Créez d'abord un personnage." },
    { name: "devise", label: "Devise", type: "text", placeholder: "Ex. Plutôt rompre que plier" },
    { name: "icon", label: "Meuble du blason", type: "icons", options: MAISON_ICONS },
    { name: "couleur", label: "Couleur du blason", type: "color" },
    { name: "civilisation_id", label: "Civilisation", type: "select", placeholder: "Aucune", options: civilisations },
    { name: "date_fondation", label: "Fondée le (date RP)", type: "date", help: "Avec une date, la fondation entre dans les chroniques." },
    { name: "description", label: "Histoire", type: "textarea", placeholder: "Origines, terres, faits d'armes…" },
];

export const maisonValeurs = (maison = null) => ({
    title: maison?.title ?? "",
    chef_id: maison?.chef_id ?? "",
    devise: maison?.devise ?? "",
    icon: maison?.icon ?? MAISON_ICON_DEFAUT,
    couleur: maison?.couleur ?? MAISON_COULEUR_DEFAUT,
    civilisation_id: maison?.civilisation_id ?? "",
    date_fondation: maison?.date_fondation ?? "",
    description: maison?.description ?? "",
});

export const maisonCorps = (values) => ({
    title: values.title,
    chef_id: values.chef_id ? Number(values.chef_id) : null,
    devise: values.devise || null,
    icon: values.icon || null,
    couleur: values.couleur || null,
    civilisation_id: values.civilisation_id ? Number(values.civilisation_id) : null,
    date_fondation: values.date_fondation || null,
    description: values.description || null,
});
