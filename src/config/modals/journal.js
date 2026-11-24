import Swal from "sweetalert2";

import { getSessionUser } from "@/services/session";

import { CATEGORIES_JOURNAUX, CATEGORIE_JOURNAL_DEFAUT, COULEUR_JOURNAL_DEFAUT } from "@/config/journaux";

// Suppression : le salon Discord créé par le site est supprimé, ou seulement délié (case décochée) ; un salon lié
// à un journal existant n'est jamais supprimé (Shard-API services/salons_journaux.py)
async function confirmerSuppression(journal) {
  const salonDuSite = Boolean(journal?.uid) && journal?.salon_cree !== false;
  const { isConfirmed, value } = await Swal.fire({
    icon: "warning",
    title: "Supprimer ce journal ?",
    text: !journal?.uid
      ? "Le journal et ses attributions de messages seront supprimés."
      : salonDuSite
        ? "Le journal et ses attributions de messages seront supprimés. Son salon Discord peut être gardé : il est alors seulement délié du site."
        : "Le journal et ses attributions de messages seront supprimés. Le salon Discord lié est conservé, seulement délié du site.",
    ...(salonDuSite ? { input: "checkbox", inputValue: 1, inputPlaceholder: "Supprimer aussi le salon Discord" } : {}),
    showCancelButton: true,
    confirmButtonText: "Supprimer",
    cancelButtonText: "Annuler",
    confirmButtonColor: "#b3263a",
  });
  if (!isConfirmed) return null;
  return salonDuSite && !value ? "?supprimer_salon=false" : "";
}

export const journalModal = {
  id: {
    default: "Modal",
    add: "Modal_Add_Journal",
    edit: "Modal_Edit_Journal",
  },
  title: {
    default: "Modal",
    add: "Ajouter un journal",
    edit: "Modifier un journal",
  },
  success: {
    default: "Succès",
    add: "Journal créé avec succès.",
    edit: "Journal modifié avec succès."
  },
  error: {
    default: "Erreur",
    add: "Erreur lors de la création du journal.",
    edit: "Erreur lors de la modification du journal."
  },
  champs: [
    {
      name: "title",
      label: "Titre",
      description: null,
      placeholder: "Titre du journal",
      type: "text",
      defaultValue: "",
      render: null,
      option: [],
      required: true,
      display: true,
      param: false, 
    },
    {
      name: "author",
      label: "Auteur role-play",
      description: null,
      placeholder: "Auteur RP du journal",
      type: "text",
      defaultValue: "",
      render: null,
      option: [],
      required: true,
      display: true,
      param: false,
    },
    {
      name: "user_id",
      label: "ID de l'utilisateur",
      description: null,
      placeholder: "ID de l'utilisateur",
      type: "number",
      defaultValue: 0,
      render: null,
      option: [],
      required: true,
      display: false,
      param: true,
    },
    {
      name: "description",
      label: "Description",
      description: null,
      placeholder: "Description du journal",
      type: "textarea",
      defaultValue: "",
      render: null,
      option: [],
      required: false,
      display: true,
      param: false,
    },
    {
      name: "categorie",
      label: "Catégorie",
      description: "Range le journal dans la bibliothèque, et son salon dans la catégorie Discord correspondante.",
      placeholder: "Choisir une catégorie",
      type: "select",
      defaultValue: CATEGORIE_JOURNAL_DEFAUT,
      render: null,
      // « Monde » n'est proposée qu'aux administrateurs (adminOnly, voir SelectField)
      option: Object.entries(CATEGORIES_JOURNAUX).map(([value, { label, adminOnly }]) => ({ label, value, adminOnly })),
      required: true,
      display: true,
      param: false,
    },
    {
      name: "salon",
      label: "Salon Discord",
      description: "Le site crée un salon pour le journal, ou relie un salon qui existe déjà sur le serveur.",
      placeholder: "",
      type: "radio",
      defaultValue: "creer",
      render: null,
      option: [
        { label: "Créer un salon", value: "creer" },
        { label: "Lier un salon existant", value: "lier" },
      ],
      required: false,
      display: true,
      param: false,
      modes: ["add"],
      // Lier un salon existant : administrateurs seulement ; un joueur obtient toujours un nouveau salon
      visibleIf: () => Boolean(getSessionUser()?.is_admin),
    },
    {
      name: "uid",
      label: "Identifiant du salon à lier",
      description: "Sur Discord, mode développeur activé : clic droit sur le salon, « Copier l'identifiant du salon ».",
      placeholder: "1234567890123456789",
      type: "text",
      defaultValue: "",
      render: null,
      option: [],
      required: true,
      display: true,
      param: false,
      modes: ["add"],
      visibleIf: (valeurs) => valeurs.salon === "lier" && Boolean(getSessionUser()?.is_admin),
    },
    {
      name: "cover_icon",
      label: "Icône",
      description: "Affichée sur la tuile du journal dans la bibliothèque et en emblème de sa page.",
      placeholder: "Icône du journal",
      type: "icon",
      defaultValue: "fa-solid fa-newspaper",
      render: null,
      option: [],
      required: true,
      display: true,
      param: false,
    },
    {
      name: "cover_color",
      label: "Couleur",
      description: "Teinte la tuile du journal dans la bibliothèque et l'en-tête de sa page.",
      placeholder: "",
      type: "color",
      defaultValue: COULEUR_JOURNAL_DEFAUT,
      render: null,
      option: [],
      required: true,
      display: true,
      param: false,
    },
    {
      name: "published_date",
      label: "Date de publication dans le RP",
      description: null,
      placeholder: "",
      type: "date",
      // Rien n'est rempli d'office : le champ RP (InputDateRp) propose la date du jour dans le RP
      defaultValue: null,
      render: null,
      option: [],
      required: false,
      display: true,
      param: false,
    },
    {
      name: "is_public",
      label: "Le journal est-il public ?",
      description: "Un journal privé n'est visible que par son auteur et les administrateurs.",
      placeholder: "",
      type: "radio",
      defaultValue: true,
      render: null,
      option: [
        { label: "Public", value: "true" },
        { label: "Privé", value: "false" },
      ],
      required: true,
      display: true,
      param: false,
    },
  ],
  api: {
    get: { method: "GET", url: "$apiURL/bibliotheque/journaux/read/$id" },
    create: { method: "POST", url: "$apiURL/bibliotheque/journaux/create" },
    update: { method: "PUT", url: "$apiURL/bibliotheque/journaux/update/$id" },
    delete: { method: "DELETE", url: "$apiURL/bibliotheque/journaux/delete/$id" },
  },
  dataKey: "journal",
  is_activate: {
    delete: true,
  },
  confirmDelete: confirmerSuppression,
};