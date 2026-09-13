import { useEffect, useState } from "react";
import { getCivilisations } from "../../../services/api";
import FieldWrapper from "./FieldWrapper";
import { selectValue } from "./selectValue";

// Interrupteur "civilisation dirigeante" ; sinon, choix de la civilisation dirigeante
// (écrit dirigeante_civilisation_id)
export default function CivilisationDirigeanteField({ champ, value, formValues, onChange }) {
  const [civilisationList, setCivilisationList] = useState([]);

  useEffect(() => {
    getCivilisations()
      .then(setCivilisationList)
      .catch((error) => console.error("Error fetching civilisations:", error));
  }, []);

  return (
    <FieldWrapper champ={champ} showOptional={false}>
      <div className="flex gap-2">
        <input
          type="checkbox"
          name={champ.name}
          checked={value}
          onChange={(e) => onChange(champ.name, e.target.checked)}
          className="toggle toggle-primary"
          required={champ.required}
        />
        <label className="label">
          <span className="label-text text-base-content">
            {champ.option[0].label}
          </span>
        </label>
      </div>

      {civilisationList.length > 0 && value == false && (
        <select
          value={selectValue(formValues?.dirigeante_civilisation_id, civilisationList.map((item) => item.civilisation.id))}
          className="select select-ghost bg-base-100 brightness-98 w-full"
          onChange={(e) => onChange("dirigeante_civilisation_id", e.target.value)}
        >
          <option key="placeholder" value="" disabled={true}>
            {champ.placeholder}
          </option>
          {civilisationList.map((item) => (
            <option key={item.civilisation.id} value={String(item.civilisation.id)}>
              {item.civilisation.title ? item.civilisation.title : item.civilisation.id}
            </option>
          ))}
        </select>
      )}
    </FieldWrapper>
  );
}
