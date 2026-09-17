import { useEffect, useState } from "react";
import { getCommerces } from "@/services/api";
import FieldWrapper from "@/components/modals/fields/FieldWrapper";
import { selectValue } from "@/components/modals/fields/selectValue";

// Interrupteur "commerce dirigeant" ; sinon, choix du commerce dirigeant (écrit dirigeant_commerce_id).
// Seuls les commerces dirigeants, autres que celui édité, peuvent être choisis.
export default function CommerceDirigeantField({ champ, value, formValues, onChange }) {
  const [commerceList, setCommerceList] = useState([]);

  useEffect(() => {
    getCommerces()
      .then(setCommerceList)
      .catch((error) => console.error("Error fetching commerces:", error));
  }, []);

  const choices = commerceList
    .map((item) => item.commerce)
    .filter((commerce) => commerce.is_commerce_dirigeant !== false && commerce.id !== formValues?.id)
    .sort((a, b) => a.title.localeCompare(b.title));

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

      {value == false && (
        choices.length > 0 ? (
          <select
            value={selectValue(formValues?.dirigeant_commerce_id, choices.map((commerce) => commerce.id))}
            className="select select-ghost bg-base-100 brightness-98 w-full"
            onChange={(e) => onChange("dirigeant_commerce_id", e.target.value)}
            required
          >
            <option key="placeholder" value="" disabled={true}>
              {champ.placeholder}
            </option>
            {choices.map((commerce) => (
              <option key={commerce.id} value={String(commerce.id)}>
                {commerce.title}
              </option>
            ))}
          </select>
        ) : (
          <span className="label">Aucun commerce dirigeant disponible.</span>
        )
      )}
    </FieldWrapper>
  );
}
