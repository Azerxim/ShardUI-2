import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getApiURL } from "../../services/api";
import Swal from "sweetalert2";

export default function VilleReligionEditModal({
  id,
  ville_id,
  religion,
  onSubmit = () => { },
}) {
  // Saisie en cours ; null = valeur actuelle de la religion (suit les mises à jour de la page)
  const [draft, setDraft] = useState(null);
  const influence = draft ?? religion?.influence ?? 0;
  const setInfluence = setDraft;
  const apiURL = getApiURL();

  const close = () => document.getElementById(id)?.close();

  const handleCancel = () => {
    close();
    setDraft(null);
  };

  const saveData = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${apiURL}/religions/ville/${ville_id}/update/influence`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ReligionID: religion.id, influence }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.religion) {
        throw new Error(data.erreur || data.text || "Erreur API lors de la mise à jour de la religion.");
      }
      Swal.fire({ icon: "success", title: "Succès", text: "Influence mise à jour avec succès." });
      onSubmit(data);
      setDraft(null);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Oops...", text: error.message });
    }
    close();
  };

  return (
    <dialog id={id} className="modal">
      <div className="modal-box max-h-[90dvh] overflow-y-auto">
        <h3 className="flex justify-center w-full font-bold text-2xl pr-5">
          {religion?.title ? `Influence : ${religion.title}` : "Modifier la religion"}
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
              <p className="label">Part de la population de la ville suivant cette religion</p>
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
                <button type="submit" className="btn btn-md btn-primary rounded-3xl gap-2">
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
