import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getApiURL,
  getVilleReligionById
} from "../../services/api";
import Swal from "sweetalert2";

export default function VilleReligionEditModal({
  id,
  ville_id,
  religion_id,
  onSubmit = () => { },
}) {
  const [data, setData] = useState(null);
  const [influence, setInfluence] = useState(0);
  const [defaultInfluence, setDefaultInfluence] = useState(0);
  const apiURL = getApiURL();

  useEffect(() => {
    getVilleReligionById(ville_id, religion_id)
      .then((data) => {
        // console.log("Fetched data:", data);
        setData(data.ville_religion);
        setInfluence(data.ville_religion.influence);
        setDefaultInfluence(data.ville_religion.influence);
      });
  }, []);

  const resetForm = () => {
    setData(null);
    setInfluence(defaultInfluence);
  };

  const saveData = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    const api = {
      url: `${apiURL}/religions/ville/${ville_id}/update/influence`,
      method: "PUT"
    }

    const body = JSON.stringify({
      ReligionID: religion_id,
      influence: influence
    });

    await fetch(api.url, {
      method: api.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body,
    })
      .then(async (response) => {
        if (!response.ok) {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Erreur API lors de la mise à jour de la religion.",
          });
        } else {
          const data = await response.json();
          Swal.fire({
            icon: "success",
            title: "Succès",
            text: "Religion mise à jour avec succès.",
          });
          onSubmit(data);
          resetForm();
        }
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.message,
        });
      });
      document.getElementById(id).close();
  };

  const handleCancel = () => {
    document.getElementById(id).close();
    resetForm();
  };

  // console.log("Form values:", { religion, influence });
  // console.log("ReligionsList", religionList);

  return (
    <>
      <dialog id={id} className="modal">
        <div className="modal-box max-h-[90dvh] overflow-y-auto">
          <h3 className="flex justify-center w-full font-bold text-2xl pr-5">
            Modifier la religion
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
              <div className="form-control flex flex-col gap-1 w-full">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Influence</legend>

                  <input
                    type="number"
                    name="influence"
                    value={influence}
                    onChange={(e) => setInfluence(parseFloat(e.target.value))}
                    className="input input-ghost bg-base-100 brightness-98 w-full"
                    required={false}
                  />

                  <p className="label">Influence de la religion sur la ville</p>
                </fieldset>
              </div>
            </div>
            <div className="modal-action flex flex-row-reverse gap-2 justify-between">
              <div className="flex flex-row gap-2">
                <div className="tooltip" data-tip="Annuler">
                  <button
                    type="button"
                    className="btn btn-md rounded-3xl"
                    onClick={handleCancel}
                  >
                    <FontAwesomeIcon icon="fas fa-xmark" />
                    {/* <span>Annuler</span> */}
                  </button>
                </div>
                <div className="tooltip tooltip-primary" data-tip="Sauvegarder">
                  <button type="submit" className="btn btn-md btn-primary rounded-3xl gap-2">
                    <FontAwesomeIcon icon="fas fa-check" />
                    {/* <span>Sauvegarder</span> */}
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
    </>
  );
}
