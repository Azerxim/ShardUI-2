export const Config_Modal_Civilisation_Member_Edit = {
  id: {
    default: "Modal",
    add: "Modal_Add_Civilisation_Member_Edit_$local-id",
    edit: "Modal_Edit_Civilisation_Member_Edit_$local-id",
  },
  title: {
    default: "Modal",
    add: "Ajouter un membre à la civilisation",
    edit: "Modifier un membre de la civilisation",
  },
  success: {
    default: "Succès",
    add: "Membre ajouté à la civilisation avec succès.",
    edit: "Membre modifié de la civilisation avec succès."
  },
  error: {
    default: "Erreur",
    add: "Erreur lors de l'ajout du membre à la civilisation.",
    edit: "Erreur lors de la modification du membre de la civilisation."
  },
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
    {
      name: "role",
      label: "Rôle",
      description: "Le rôle de l'utilisateur dans la civilisation.",
      placeholder: "Sélectionner un rôle",
      type: "select",
      defaultValue: "Membre",
      render: null,
      option: [
        { label: "Membre", value: "Membre" },
        { label: "Admin", value: "Admin" },
      ],
      required: true,
      display: true,
      param: false,
    },
  ],
  api: {
    get: { method: "GET", url: "$apiURL/civilisations/members/$id/list" },
    create: { method: "POST", url: "$apiURL/civilisations/members/$id/add" },
    update: { method: "PUT", url: "$apiURL/civilisations/members/$id/$local-id/update" },
    delete: { method: "DELETE", url: "$apiURL/civilisations/members/$id/remove" },
  },
  dataKey: "civilisation_member_edit",
  is_activate: {
    delete: false,
  },
};