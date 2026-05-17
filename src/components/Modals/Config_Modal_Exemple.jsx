const Config_Modal_Exemple = {
  id: {
    default: "Modal",
    add: "Modal_Add_Exemple",
    edit: "Modal_Edit_Exemple",
  },
  title: {
    default: "Modal",
    add: "Ajouter un exemple",
    edit: "Modifier un exemple",
  },
  success: {
    default: "Succès",
    add: "Exemple créé avec succès.",
    edit: "Exemple modifié avec succès."
  },
  error: {
    default: "Erreur",
    add: "Erreur lors de la création de l'exemple.",
    edit: "Erreur lors de la modification de l'exemple."
  },
  champs: [
    {
      name: "title",                        // Nom du champ dans le formulaire
      label: "Titre",                       // Label affiché pour le champ
      description: "",                      // Description du champ (optionnel)
      placeholder: "Titre de l'exemple",    // Placeholder pour le champ
      type: "text",                         // Type de champ (text, textarea, color, date, etc.)
      defaultValue: "",                     // Valeur par défaut du champ
      render: (value, onChange) => (<></>), // Fonction de rendu personnalisée pour le champ (optionnel)
      option: [{ label: "", value: "" }],   // Options pour les champs de type select, radio, checkbox, toggle ou custom (optionnel)
      required: true,                       // Indique si le champ est requis
      display: true,                        // Indique si le champ doit être affiché dans le modal
      param: false,                         // Indique si le champ est un paramètre modifiable par le systeme (exemple : user_id qui est modifier en fonction de l'utilisateur connecté)
    },
  ],
  api: {
    get: { method: "GET", url: "/api/.../$id" },        // Endpoint pour récupérer les données d'un élément (remplacer $id par l'identifiant de l'élément)
    create: { method: "POST", url: "/api/..." },        // Endpoint pour créer un nouvel élément
    update: { method: "PUT", url: "/api/.../$id" },     // Endpoint pour mettre à jour un élément (remplacer $id par l'identifiant de l'élément)
    delete: { method: "DELETE", url: "/api/.../$id" },  // Endpoint pour supprimer un élément (remplacer $id par l'identifiant de l'élément)
  },
  dataKey: "exemple",                       // Clé pour accéder aux données dans la réponse de l'API (ex: data.exemple)
};