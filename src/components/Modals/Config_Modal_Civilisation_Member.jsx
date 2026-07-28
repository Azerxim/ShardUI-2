import { getData } from "../Functions/getData";

export const Config_Modal_Civilisation_Member = {
  id: {
    default: "Modal",
    add: "Modal_Add_Civilisation_Member",
    edit: "Modal_Edit_Civilisation_Member",
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
      name: "civilisation_id",
      label: "Civilisation ID",
      description: "L'ID de la civilisation.",
      placeholder: "",
      type: "number",
      defaultValue: 0,
      render: null,
      option: [],
      required: true,
      display: false,
      param: true,
    },
    {
      name: "member_id",
      label: "Utilisateur",
      description: "L'utilisateur à ajouter à la civilisation.",
      placeholder: "Sélectionner un utilisateur",
      type: "select",
      defaultValue: "",
      render: async (configs, value, handleInputChange) => {
        const params = configs.params;
        const config = configs.config;
        const champ = {
          ...config.champs.find(c => c.name === "member_id"),
        }
        const options = await champ.option(params);
        console.log(options)
        return (
          <>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{champ.label}</legend>

              <select 
                defaultValue={champ.placeholder} 
                className="select select-ghost bg-base-100 brightness-98 w-full" 
                onChange={(e) => handleInputChange(champ.name, e.target.value)} 
                required={champ.required}
              >
                <option key="placeholder" disabled={true}>{champ.placeholder}</option>
                {options.map((opt, index) => (
                  <option key={index} value={opt.value} selected={value.toString() === opt.value.toString()}>{opt.label}</option>
                ))}
              </select>

              {champ.description && <p className="label">{champ.description}</p>}
              {!champ.required && <span className="label">Optional</span>}
            </fieldset>
          </>
        )
      },
      options: async (params) => {
        const users = await getData(`/api/users/list`);
        const membersCiv = await getData(`/api/civilisations/members/${params.id}/list`);
        // const idsMembersCiv = membersCiv.map(member => member.user_id);
        console.log(users)
        console.log(membersCiv);
        // console.log(idsMembersCiv);
        // return users.filter((user) => !idsMembersCiv.includes(user.user_id)).map(user => { return { label: user.full_name, value: user.id } });
        return []
      },
      option: [],
      required: true,
      display: true,
      param: false,
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
        { label: "Citoyen", value: "Citoyen" },
        { label: "Garde", value: "Garde" },
        { label: "Marchand", value: "Marchand" },
        { label: "Militaire", value: "Militaire" },
        { label: "Admin", value: "Admin" },
        { label: "Gouverneur", value: "Gouverneur" }
      ],
      required: true,
      display: true,
      param: false,
    },
  ],
  api: {
    get: { method: "GET", url: "$apiURL/civilisations/members/$id/list" },
    create: { method: "POST", url: "$apiURL/civilisations/members/$id/add" },
    update: { method: "PUT", url: "$apiURL/civilisations/members/$id/update" },
    delete: { method: "DELETE", url: "$apiURL/civilisations/members/$id/remove" },
  },
  dataKey: "civilisation_member",
};