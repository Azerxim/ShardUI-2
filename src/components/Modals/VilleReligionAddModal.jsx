import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getApiURL,
  getReligions
} from "../../services/api";
import Swal from "sweetalert2";
import { useParams } from "react-router-dom";

import MapEmbedLocalisation from "../Objects/MapEmbedLocalisation";

export default function VilleReligionAddModal({
  id,
  ville_id,
  ville_religion_list,
  onSubmit = () => { },
  onDelete = () => { },
}) {

  const [religion, setReligion] = useState(0);
  const [influence, setInfluence] = useState(0);
  const [religionList, setReligionList] = useState([]);
  const apiURL = getApiURL();

  useEffect(() => {
    getReligions()
      .then((data) => {
        let religionsdata = [];
        data.forEach((item) => {
          religionsdata.push(item.religion);
        });
        setReligionList(religionsdata);
      });
  }, []);

  const resetForm = () => {
    setReligion(0);
    setInfluence(0);
  };

  const saveData = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    const api = {
      url: `${apiURL}/religions/ville/${ville_id}/add`,
      method: "POST"
    }

    const body = JSON.stringify({
      ReligionID: religion,
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
            text: "Erreur API lors de l'ajout de la religion.",
          });
        } else {
          const data = await response.json();
          Swal.fire({
            icon: "success",
            title: "Succès",
            text: "Religion ajoutée avec succès.",
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
              <div className="form-control flex flex-col gap-1 w-full">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Religion</legend>

                  <select
                    value={religion ?? 0}
                    className="select select-ghost bg-base-100 brightness-98 w-full"
                    onChange={(e) => setReligion(e.target.value)}
                    required={true}
                  >
                    <option key="placeholder" disabled={true} value={0}>
                      Sélectionnez une religion
                    </option>
                    {religionList.map((religionItem) => (
                      <option
                        key={religionItem.id}
                        value={parseInt(religionItem.id)}
                      >
                        {religionItem.title}
                      </option>
                    ))}
                  </select>
                </fieldset>
              </div>
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
