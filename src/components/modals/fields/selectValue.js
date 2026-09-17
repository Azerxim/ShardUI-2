// Valeur d'un <select> contrôlé de DynamicModal.
// Renvoie "" (option d'invite) si la valeur est vide ou ne correspond à aucune option :
// sinon le navigateur afficherait la première option alors que la valeur réelle diffère.
export function selectValue(value, optionValues) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  return optionValues.some((option) => String(option) === stringValue) ? stringValue : "";
}
