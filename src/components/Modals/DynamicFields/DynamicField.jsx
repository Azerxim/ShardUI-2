import {
  CheckboxField,
  ColorField,
  CustomField,
  DateField,
  IconField,
  InputField,
  RadioField,
  SelectField,
  TextareaField,
  ToggleField,
} from "./BasicFields";
import CivilisationDirigeanteField from "./CivilisationDirigeanteField";
import LocalisationField from "./LocalisationField";
import UsersField from "./UsersField";
import VillesField from "./VillesField";
import CommerceDirigeantField from "./CommerceDirigeantField";

// Type de champ (config.champs[].type) -> composant.
// Chaque champ est un vrai composant : ses hooks (chargement de données, état local)
// sont stables quel que soit le nombre ou l'ordre des champs du formulaire.
const FIELDS = {
  custom: CustomField,
  localisation: LocalisationField,
  civilisation_dirigeante: CivilisationDirigeanteField,
  users: UsersField,
  villes: VillesField,
  commerce_dirigeant: CommerceDirigeantField,
  toggle: ToggleField,
  checkbox: CheckboxField,
  radio: RadioField,
  select: SelectField,
  textarea: TextareaField,
  color: ColorField,
  icon: IconField,
  date: DateField,
};

export default function DynamicField(props) {
  const Field = FIELDS[props.champ.type] ?? InputField;
  return <Field {...props} />;
}
