const ModalExempleConfig = {
  id: "ExempleModal",
  title: "Exemple de modal",
  champs: [
    {
      name: "title",                        // Nom du champ dans le formulaire
      label: "Titre",                       // Label affiché pour le champ
      placeholder: "Titre du journal",      // Placeholder pour le champ
      type: "text",                         // Type de champ (text, textarea, color, date, etc.)
      defaultValue: "",                     // Valeur par défaut du champ
      required: true,                       // Indique si le champ est requis
      display: true,                        // Indique si le champ doit être affiché dans le modal
      param: false,                         // Indique si le champ est un paramètre modifiable par le systeme (exemple : user_id qui est modifier en fonction de l'utilisateur connecté)
    },
  ],
  api: "/api/...",
  success: { text: "Succès." },
  error: { text: "Erreur." },
};

export const ModalJournalAddConfig = {
  id: "JournalAddModal",
  title: "Ajouter un journal",
  champs: [
    {
      name: "title",
      label: "Titre",
      placeholder: "Titre du journal",
      type: "text",
      defaultValue: "",
      required: true,
      display: true,
      param: false, 
    },
    {
      name: "author",
      label: "Auteur",
      placeholder: "Auteur du journal",
      type: "text",
      defaultValue: "",
      required: true,
      display: true,
      param: false,
    },
    {
      name: "user_id",
      label: "ID de l'utilisateur",
      placeholder: "ID de l'utilisateur",
      type: "number",
      defaultValue: 0,
      required: true,
      display: false,
      param: true,
    },
    {
      name: "description",
      label: "Description",
      placeholder: "Description du journal",
      type: "textarea",
      defaultValue: "",
      required: false,
      display: true,
      param: false,
    },
    {
      name: "cover_color",
      label: "Couleur de la couverture",
      placeholder: "",
      type: "color",
      defaultValue: "#5865F2",
      required: true,
      display: true,
      param: false,
    },
    {
      name: "published_date",
      label: "Date de publication dans le RP",
      placeholder: "",
      type: "date",
      defaultValue: new Date().toISOString().split("T")[0],
      required: true,
      display: true,
      param: false,
    },
  ],
  api: "/api/bibliotheque/journaux/create",
  success: { text: "Journal créé avec succès." },
  error: { text: "Erreur lors de la création du journal." },
};

export const ModalCivilisationAddConfig = {
  id: "CivilisationAddModal",
  title: "Ajouter une civilisation",
  champs: [
    {
      name: "title",
      label: "Titre",
      placeholder: "Titre de la civilisation",
      type: "text",
      defaultValue: "",
      required: true,
      display: true,
      param: false,
    },
    {
      name: "description",
      label: "Description",
      placeholder: "Description de la civilisation",
      type: "textarea",
      defaultValue: "",
      required: false,
      display: true,
      param: false,
    },
    {
      name: "date_founded",
      label: "Date de fondation dans le RP",
      placeholder: "",
      type: "date",
      defaultValue: new Date().toISOString().split("T")[0],
      required: false,
      display: true,
      param: false,
    },
    {
      name: "gouvernement_id",
      label: "Gouvernement",
      placeholder: "Gouvernement de la civilisation",
      type: "number",
      defaultValue: 0,
      required: false,
      display: false,
      param: false,
    },
    {
      name: "is_public",
      label: "Public",
      placeholder: "La civilisation est-elle publique ?",
      type: "checkbox",
      defaultValue: true,
      required: false,
      display: true,
      param: false,
    },
  ],
  api: "/api/civilisations/create",
  success: { text: "Civilisation créée avec succès." },
  error: { text: "Erreur lors de la création de la civilisation." },
};