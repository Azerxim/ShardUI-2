import { useEffect, useState } from "react";
import { getDimensions } from "../../../services/api";
import MapEmbedLocalisation from "../../Objects/MapEmbedLocalisation";
import { selectValue } from "./selectValue";

// Dimension + coordonnées X/Z, avec carte de localisation (écrit dimension_id, x et z)
export default function LocalisationField({ champ, formValues, onChange }) {
  const [dimensions, setDimensions] = useState([]);
  const [mapZoom, setMapZoom] = useState(0);

  useEffect(() => {
    getDimensions()
      .then(setDimensions)
      .catch((error) => console.error("Error fetching dimensions:", error));
  }, []);

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{champ.label}</legend>

      <div className="flex flex-row gap-2 w-full bg-base-200 rounded-3xl pr-4 pl-4 pt-1 pb-4">
        <div className="flex-2">
          <legend className="fieldset-legend">Dimension</legend>

          <select
            value={selectValue(formValues?.dimension_id, dimensions.map((dimension) => dimension.id))}
            className="select select-ghost bg-base-100 brightness-98 w-full"
            onChange={(e) => onChange("dimension_id", e.target.value)}
            required={champ.required}
          >
            <option key="placeholder" value="" disabled={true}>
              {champ.placeholder}
            </option>
            {dimensions.map((dimension) => (
              <option key={dimension.id} value={String(dimension.id)}>
                {dimension.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <legend className="fieldset-legend">Coordonnées X</legend>

          <input
            type="number"
            name="x"
            placeholder="Coordonnée X de la ville"
            value={formValues?.x ?? 0}
            onChange={(e) => onChange("x", e.target.value)}
            className="input input-ghost bg-base-100 brightness-98 w-full"
            required={champ.required}
          />
        </div>
        <div className="flex-1">
          <legend className="fieldset-legend">Coordonnées Z</legend>

          <input
            type="number"
            name="z"
            placeholder="Coordonnée Z de la ville"
            value={formValues?.z ?? 0}
            onChange={(e) => onChange("z", e.target.value)}
            className="input input-ghost bg-base-100 brightness-98 w-full"
            required={champ.required}
          />
        </div>
      </div>

      <div className="hidden lg:flex">
        {formValues?.dimension_id !== undefined ? (
          <MapEmbedLocalisation
            dimension={dimensions.find((dim) => dim.id === parseInt(formValues.dimension_id))}
            width={450}
            height={200}
            embed="civilisations"
            x={formValues?.x}
            z={formValues?.z}
            zoom={mapZoom}
            onMove={({ x, z, zoom }) => {
              setMapZoom(zoom);
              onChange("x", x);
              onChange("z", z);
            }}
          />
        ) : null}
      </div>

      {champ.description && (
        <p className="label">{champ.description}</p>
      )}
      {!champ.required && <span className="label">Optional</span>}
    </fieldset>
  );
}
