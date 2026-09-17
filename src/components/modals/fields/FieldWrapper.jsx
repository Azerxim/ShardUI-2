// Cadre commun des champs de DynamicModal : légende, contenu, description et mention "Optional"
export default function FieldWrapper({ champ, showOptional = true, children }) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{champ.label}</legend>

      {children}

      {champ.description && (
        <p className="label">{champ.description}</p>
      )}
      {showOptional && !champ.required && <span className="label">Optional</span>}
    </fieldset>
  );
}
