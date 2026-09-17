// Modales d'ajout / d'édition des membres d'une religion ou d'un commerce
// (même fonctionnement que civilisationMemberModal et civilisationMemberEditModal).
const ROLE_OPTIONS = [
  { label: "Membre", value: "Membre" },
  { label: "Admin", value: "Admin" },
];

function roleField(label) {
  return {
    name: "role",
    label: "Rôle",
    description: `Le rôle de l'utilisateur dans ${label}.`,
    placeholder: "Sélectionner un rôle",
    type: "select",
    defaultValue: "Membre",
    render: null,
    option: ROLE_OPTIONS,
    required: true,
    display: true,
    param: false,
  };
}

// name : suffixe des identifiants de modale, entity : segment d'URL de l'API, label : "la religion", "le commerce"…
function createMemberConfigs({ name, entity, label }) {
  const texts = {
    title: { default: "Modal", add: `Ajouter un membre à ${label}`, edit: `Modifier un membre de ${label}` },
    success: { default: "Succès", add: `Membre ajouté à ${label} avec succès.`, edit: `Membre de ${label} modifié avec succès.` },
    error: { default: "Erreur", add: `Erreur lors de l'ajout du membre à ${label}.`, edit: `Erreur lors de la modification du membre de ${label}.` },
  };

  const add = {
    id: { default: "Modal", add: `Modal_Add_${name}_Member`, edit: `Modal_Edit_${name}_Member` },
    ...texts,
    champs: [
      {
        name: "user_id",
        label: "Utilisateur",
        description: `L'utilisateur à ajouter à ${label}.`,
        placeholder: "Sélectionner un utilisateur",
        type: "users",
        defaultValue: "",
        render: null,
        option: [],
        required: true,
        display: true,
        param: false,
      },
      roleField(label),
    ],
    api: {
      get: { method: "GET", url: `$apiURL/${entity}/members/$id/list` },
      create: { method: "POST", url: `$apiURL/${entity}/members/$id/add` },
      update: { method: "PUT", url: `$apiURL/${entity}/members/$id/update` },
      delete: { method: "DELETE", url: `$apiURL/${entity}/members/$id/remove` },
    },
    dataKey: `${entity.slice(0, -1)}_member`,
    is_activate: { delete: false },
  };

  const edit = {
    id: { default: "Modal", add: `Modal_Add_${name}_Member_Edit_$local-id`, edit: `Modal_Edit_${name}_Member_Edit_$local-id` },
    ...texts,
    champs: [
      {
        name: "user_id",
        label: "id",
        description: "local",
        placeholder: "0",
        type: "text",
        defaultValue: "0",
        render: null,
        option: [],
        required: true,
        display: false,
        param: true,
      },
      roleField(label),
    ],
    api: {
      get: { method: "GET", url: `$apiURL/${entity}/members/$id/$local-id/read` },
      create: { method: "POST", url: `$apiURL/${entity}/members/$id/add` },
      update: { method: "PUT", url: `$apiURL/${entity}/members/$id/$local-id/update` },
      delete: { method: "DELETE", url: `$apiURL/${entity}/members/$id/remove` },
    },
    // Clé renvoyée par la route /read de l'API
    dataKey: `${entity.slice(0, -1)}_member_edit`,
    is_activate: { delete: false },
  };

  return { add, edit };
}

const religion = createMemberConfigs({ name: "Religion", entity: "religions", label: "la religion" });
const commerce = createMemberConfigs({ name: "Commerce", entity: "commerces", label: "le commerce" });

export const religionMemberModal = religion.add;
export const religionMemberEditModal = religion.edit;
export const commerceMemberModal = commerce.add;
export const commerceMemberEditModal = commerce.edit;
