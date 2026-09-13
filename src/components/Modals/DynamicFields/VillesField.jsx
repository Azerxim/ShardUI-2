import { useEffect, useState } from "react";
import { getVilles } from "../../../services/api";
import FieldWrapper from "./FieldWrapper";
import { selectValue } from "./selectValue";

// Liste déroulante des villes ("Aucune ville" possible si le champ est facultatif)
export default function VillesField({ champ, value, onChange }) {
  const [villes, setVilles] = useState([]);

  useEffect(() => {
    getVilles()
      .then((data) => setVilles([...data].sort((a, b) => a.title.localeCompare(b.title))))
      .catch((error) => console.error("Error fetching villes:", error));
  }, []);

  return (
    <FieldWrapper champ={champ}>
      <select
        value={selectValue(value, villes.map((ville) => ville.id))}
        className="select select-ghost bg-base-100 brightness-98 w-full"
        onChange={(e) => onChange(champ.name, e.target.value)}
        required={champ.required}
      >
        <option key="placeholder" value="" disabled={champ.required}>
          {champ.required ? champ.placeholder : "Aucune ville"}
        </option>
        {villes.map((ville) => (
          <option key={ville.id} value={String(ville.id)}>
            {ville.title}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}
