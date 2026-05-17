const ModalExempleConfig = {
  id: "ExempleModal",
  title: "Exemple de modal",
  champs: [
    {
      name: "title",                        // Nom du champ dans le formulaire
      label: "Titre",                       // Label affiché pour le champ
      description: "",                      // Description du champ (optionnel)
      placeholder: "Titre du journal",      // Placeholder pour le champ
      type: "text",                         // Type de champ (text, textarea, color, date, etc.)
      defaultValue: "",                     // Valeur par défaut du champ
      render: (value, onChange) => (<></>), // Fonction de rendu personnalisée pour le champ (optionnel)
      option: [{ label: "", value: "" }],   // Options pour les champs de type select, radio, checkbox, toggle ou custom (optionnel)
      required: true,                       // Indique si le champ est requis
      display: true,                        // Indique si le champ doit être affiché dans le modal
      param: false,                         // Indique si le champ est un paramètre modifiable par le systeme (exemple : user_id qui est modifier en fonction de l'utilisateur connecté)
    },
  ],
  api: "/api/...",
  success: { text: "Succès." },
  error: { text: "Erreur." },
};