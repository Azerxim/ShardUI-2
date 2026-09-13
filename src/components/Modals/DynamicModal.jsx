import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  dynamicLoadData,
  getApiURL
} from "../../services/api";
import Swal from "sweetalert2";
import { useParams } from "react-router-dom";

import DynamicField from "./DynamicFields/DynamicField";

export default function DynamicModal({
  config,
  onSubmit = () => { },
  onDelete = () => { },
  mode = "default",
  local = { id: null },
}) {
  const User = JSON.parse(localStorage.getItem("user"));
  const params = useParams();
  const apiURL = getApiURL();

  // Mode "add" : valeurs par défaut de la config (et paramètres user / url / local).
  // Mode "edit" : vide, puis rempli par le chargement ci-dessous.
  const [formValues, setFormValues] = useState(() => {
    if (mode !== "add") return {};
    const initialValues = {};
    config.champs.forEach((champ) => {
      if (champ.param && champ.name === "user_id") {
        initialValues[champ.name] = User ? User.id : champ.defaultValue;
      } else if (champ.param && champ.description == "url" && champ.label == "id") {
        initialValues[champ.name] = params.id ? parseInt(params.id) : champ.defaultValue;
      } else if (champ.param && champ.description == "local" && champ.label == "id") {
        initialValues[champ.name] = local.id ? parseInt(local.id) : champ.defaultValue;
      } else {
        initialValues[champ.name] = champ.defaultValue;
      }
    });
    return initialValues;
  });

  // Mode "edit" : chargement des données existantes
  useEffect(() => {
    if (mode !== "edit") return;
    let cancelled = false;

    const api = config.api.get;
    dynamicLoadData(api.url.replace("$id", params.id).replace("$local-id", local.id), api.method, localStorage.getItem("token"))
      .then((data) => {
        if (!cancelled) setFormValues(data && data[config.dataKey] ? data[config.dataKey] : {});
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
  }, [config, mode, params.id, local.id]);

  const handleInputChange = (name, value) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveData = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (mode != "default") {
      const api = mode === "add" ? config.api.create : config.api.update;
      await fetch(api.url.replace("$id", params.id).replace("$local-id", local.id).replace("$apiURL", apiURL), {
        method: api.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formValues),
      })
        .then(async (response) => {
          if (!response.ok) {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: config.error[mode],
            });
          } else {
            const data = await response.json();
            Swal.fire({
              icon: "success",
              title: "Succès",
              text: config.success[mode],
            });
            onSubmit(data);
          }
        })
        .catch((error) => {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: error.message,
          });
        });
    }
    document.getElementById(config.id[mode].replace("$local-id", local.id)).close();
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    const api = config.api.delete;
    const apiUrl = api.url.replace("$id", params.id).replace("$local-id", local.id);
    await fetch(apiUrl.replace("$apiURL", apiURL), {
      method: api.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Erreur API lors de la suppression.",
          });
        } else {
          const data = await response.json();
          Swal.fire({
            icon: "success",
            title: "Succès",
            text: data.text ? data.text : config.success.delete,
          });
          onDelete();
        }
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.message,
        });
      });
    document.getElementById(config.id[mode].replace("$local-id", local.id)).close();
  };

  return (
    <>
      <dialog id={config.id[mode].replace("$local-id", local.id)} className="modal">
        <div className="modal-box max-h-[90dvh] overflow-y-auto">
          <h3 className="flex justify-center w-full font-bold text-2xl pr-5">
            {config.title[mode]}
          </h3>
          <div className="divider divider-neutral"></div>
          <form onSubmit={saveData}>
            <button
              className="btn btn-md btn-circle btn-ghost absolute right-4 top-4"
              type="button"
              onClick={() => document.getElementById(config.id[mode].replace("$local-id", local.id)).close()}
            >
              <FontAwesomeIcon icon="fas fa-xmark" size="xl" />
            </button>
            <div className="modal-content flex flex-col gap-5">
              {config.champs.map((champ, index) => (
                <div
                  key={index}
                  className={`form-control flex flex-col gap-1 w-full ${champ.display ? "" : "hidden"}`}
                >
                  <DynamicField
                    champ={champ}
                    config={config}
                    params={params}
                    value={formValues?.[champ.name] ?? champ.defaultValue}
                    formValues={formValues}
                    onChange={handleInputChange}
                  />
                </div>
              ))}
            </div>
            <div className="modal-action flex flex-row-reverse gap-2 justify-between">
              <div className="flex flex-row gap-2">
                <div className="tooltip" data-tip="Annuler">
                  <button
                    type="button"
                    className="btn btn-md rounded-3xl"
                    onClick={() =>
                      document.getElementById(config.id[mode].replace("$local-id", local.id)).close()
                    }
                  >
                    <FontAwesomeIcon icon="fas fa-xmark" />
                  </button>
                </div>
                <div className="tooltip tooltip-primary" data-tip="Sauvegarder">
                  <button type="submit" className="btn btn-md btn-primary rounded-3xl gap-2">
                    <FontAwesomeIcon icon="fas fa-check" />
                  </button>
                </div>
              </div>
              {config.is_activate.delete && (
                <div className="flex flex-row gap-2">
                  <div className="tooltip tooltip-error" data-tip="Supprimer">
                    <button
                      type="button"
                      className={`btn btn-md btn-error rounded-3xl ${mode === "edit" ? "" : "hidden"}`}
                      onClick={() => handleDelete()}
                    >
                      <FontAwesomeIcon icon="fas fa-trash" />
                    </button>
                  </div>
                </div>
              )}
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
