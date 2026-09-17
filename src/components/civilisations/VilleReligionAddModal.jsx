import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getApiURL, getReligions } from "@/services/api";
import { formatInfluence } from "@/utils/religionColor";
import Swal from "sweetalert2";

export default function VilleReligionAddModal({
  id,
  ville_id, // identifiant du lieu : une ville, ou un quartier avec scope="quartier"
  scope = "ville",
  ville_religion_list = [],
  onSubmit = () => { },
}) {
  const [religion, setReligion] = useState(0);
  const [influence, setInfluence] = useState(0);
  const [religionList, setReligionList] = useState([]);
  const apiURL = getApiURL();

  useEffect(() => {
    getReligions()
      .then((data) => setReligionList(data.map((item) => item.religion)))
      .catch((error) => console.error("Error fetching religions:", error));
  }, []);

  // Une religion ne peut être associée qu'une fois à la ville
  const available = religionList.filter(
    (item) => !ville_religion_list.some((existing) => existing.id === item.id)
  );
  const attributed = ville_religion_list.reduce((sum, item) => sum + (Number(item.influence) || 0), 0);
  const remaining = Math.max(0, 100 - attributed);

  const close = () => document.getElementById(id)?.close();

  const resetForm = () => {
    setReligion(0);
    setInfluence(0);
  };

  const saveData = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${apiURL}/religions/${scope}/${ville_id}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ReligionID: parseInt(religion), influence }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.religion || data.erreur) {
        throw new Error(data.erreur || data.text || (typeof data.detail === "string" ? data.detail : null) || "Erreur API lors de l'ajout de la religion.");
      }
      Swal.fire({ icon: "success", title: "Succès", text: "Religion ajoutée avec succès." });
      onSubmit(data);
      resetForm();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Oops...", text: error.message });
    }
    close();
  };

  const handleCancel = () => {
    close();
    resetForm();
  };

  return (
    <dialog id={id} className="modal">
      <div className="modal-box max-h-[90dvh] overflow-y-auto">
        <h3 className="flex justify-center w-full font-bold text-2xl pr-5">
          Ajouter une religion
        </h3>
        <div className="divider divider-neutral"></div>
        <form onSubmit={saveData}>
          <button
            className="btn btn-md btn-circle btn-ghost absolute right-4 top-4"
            type="button"
            onClick={handleCancel}
          >
            <FontAwesomeIcon icon="fas fa-xmark" size="xl" />
          </button>
          <div className="modal-content flex flex-col gap-5">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Religion</legend>
              {available.length === 0 && religionList.length > 0 ? (
                <p className="italic opacity-70">Toutes les religions sont déjà présentes dans {scope === "quartier" ? "ce quartier" : "cette ville"}.</p>
              ) : (
                <select
                  value={religion}
                  className="select select-ghost bg-base-100 brightness-98 w-full"
                  onChange={(e) => setReligion(e.target.value)}
                  required={true}
                >
                  <option key="placeholder" disabled={true} value={0}>
                    Sélectionnez une religion
                  </option>
                  {available.map((religionItem) => (
                    <option key={religionItem.id} value={religionItem.id}>
                      {religionItem.title}
                    </option>
                  ))}
                </select>
              )}
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Influence (%)</legend>
              <div className="flex flex-row items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={influence}
                  onChange={(e) => setInfluence(parseFloat(e.target.value))}
                  className="range range-primary flex-1"
                />
                <input
                  type="number"
                  name="influence"
                  min={0}
                  max={100}
                  step={0.1}
                  value={influence}
                  onChange={(e) => setInfluence(parseFloat(e.target.value) || 0)}
                  className="input input-ghost bg-base-100 brightness-98 w-24"
                  required={true}
                />
              </div>
              <p className="label">
                Influence non attribuée {scope === "quartier" ? "dans le quartier" : "dans la ville"} : {formatInfluence(remaining)}
              </p>
            </fieldset>
          </div>
          <div className="modal-action flex flex-row-reverse gap-2 justify-between">
            <div className="flex flex-row gap-2">
              <div className="tooltip" data-tip="Annuler">
                <button type="button" className="btn btn-md rounded-3xl" onClick={handleCancel}>
                  <FontAwesomeIcon icon="fas fa-xmark" />
                </button>
              </div>
              <div className="tooltip tooltip-primary" data-tip="Sauvegarder">
                <button type="submit" className="btn btn-md btn-primary rounded-3xl gap-2" disabled={available.length === 0}>
                  <FontAwesomeIcon icon="fas fa-check" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>Close</button>
      </form>
    </dialog>
  );
}
