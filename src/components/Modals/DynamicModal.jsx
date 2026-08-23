import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  dynamicLoadData,
  getApiURL,
  getUsers,
  getDimensions
} from "../../services/api";
import Swal from "sweetalert2";
import { useParams } from "react-router-dom";

import MapEmbedLocalisation from "../Objects/MapEmbedLocalisation";

import { getAuthToken } from "../Functions/getAuthToken";

export default function DynamicModal({
  config,
  onSubmit,
  onDelete = () => { },
  mode = "default",
  local = { id: null },
}) {
  const User = JSON.parse(localStorage.getItem("user"));
  const params = useParams();
  const apiURL = getApiURL();

  // console.log("DynamicModal params:", params);
  // console.log("DynamicModal local:", local);

  // Initialize state with default values from config
  const [formValues, setFormValues] = useState({});
  const [loadData, setLoadData] = useState({});
  const [loadFormValues, setLoadFormValues] = useState(() => {
    const initialValues = {};
    config.champs.forEach((champ) => {
      if (champ.param && champ.name === "user_id") {
        initialValues[champ.name] = User ? User.id : champ.defaultValue;
      } else if (champ.param && champ.description == "url" && champ.label == "id") {
        // console.log("params.id:", params.id);
        initialValues[champ.name] = params.id ? parseInt(params.id) : champ.defaultValue;
      } else if (champ.param && champ.description == "local" && champ.label == "id") {
        // console.log("local.id:", local.id);
        initialValues[champ.name] = local.id ? parseInt(local.id) : champ.defaultValue;
      } else {
        initialValues[champ.name] = champ.defaultValue;
      }
    });
    return initialValues;
  });
  const fetchLoadData = async () => {
    try {
      const token = localStorage.getItem("token");
      let api = config.api.get;
      const data = await dynamicLoadData(api.url.replace("$id", params.id).replace("$local-id", local.id), api.method, token);
      return (data && data[config.dataKey]) ? data[config.dataKey] : {};
    } catch (err) {
      console.error(err);
      return {};
    }
  };

  // Load data when component mounts or when mode changes
  useEffect(() => {
    if (mode === "add") {
      setFormValues(loadFormValues);
    } else if (mode === "edit") {
      fetchLoadData().then((data) => {
        setFormValues(data);
      });
    } else {
      setFormValues({});
    }
  }, [config, mode]);

  const handleInputChange = (name, value) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveData = async (e) => {
    e.preventDefault();
    // Logic to save the entry
    console.log("Save Form values:", formValues);
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

  const renderInput = (config, champ) => {
    let value
    try {
      value = formValues[champ.name] ?? champ.defaultValue;
    } catch (error) {
      // console.error(`Error accessing formValues for champ.name: ${champ.name}`, error);
      value = champ.defaultValue;
    }

    switch (champ.type) {
      case "custom":
        if (champ.render) {
          return champ.render({ config, params }, value, handleInputChange);
        }
        return "Invalid custom render function";

      case "localisation":
        const [dimensions, setDimensions] = useState([]);
        const [mapZoom, setMapZoom] = useState(0);

        useEffect(() => {
          const fetchDimensions = async () => {
            const dimensionsData = await getDimensions();
            setDimensions(dimensionsData);
          };
          fetchDimensions();
        }, []);
        // console.log("Dimensions fetched:", dimensions);
        return (
          <>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{champ.label}</legend>

              <div className="flex flex-row gap-2 w-full bg-base-200 rounded-3xl pr-4 pl-4 pt-1 pb-4">
                <div className="flex-2">
                  <legend className="fieldset-legend">Dimension</legend>

                  <select
                    defaultValue={champ.placeholder}
                    className="select select-ghost bg-base-100 brightness-98 w-full"
                    onChange={(e) => handleInputChange("dimension_id", e.target.value)}
                    required={champ.required}
                  >
                    <option key="placeholder" disabled={true}>
                      {champ.placeholder}
                    </option>
                    {dimensions.map((dimension) => (
                      <option
                        key={dimension.id}
                        value={parseInt(dimension.id)}
                        selected={value === parseInt(dimension.id)}
                      >
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
                    onChange={(e) => handleInputChange("x", e.target.value)}
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
                    onChange={(e) => handleInputChange("z", e.target.value)}
                    className="input input-ghost bg-base-100 brightness-98 w-full"
                    required={champ.required}
                  />
                </div>
              </div>

              <div className="hidden lg:flex">
                {formValues?.dimension_id !== undefined ? (
                  <MapEmbedLocalisation
                    dimension={dimensions ? dimensions.find(dim => dim.id === parseInt(formValues.dimension_id)) : null}
                    width={450}
                    height={200}
                    embed="civilisations"
                    x={formValues?.x}
                    z={formValues?.z}
                    zoom={mapZoom}
                    onMove={({ x, z, zoom }) => {
                      setMapZoom(zoom);
                      handleInputChange("x", x);
                      handleInputChange("z", z);
                    }}
                  />
                ) : null}
              </div>


              {champ.description && (
                <p className="label">{champ.description}</p>
              )}
              {!champ.required && <span className="label">Optional</span>}
            </fieldset>
          </>
        );


      case "users":
        const [users, setUsers] = useState([]);

        useEffect(() => {
          const fetchUsers = async () => {
            const usersData = await getUsers();
            setUsers(usersData);
          };
          fetchUsers();
        }, []);
        // console.log("Users fetched:", users);
        return (
          <>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{champ.label}</legend>

              <select
                defaultValue={champ.placeholder}
                className="select select-ghost bg-base-100 brightness-98 w-full"
                onChange={(e) => handleInputChange(champ.name, e.target.value)}
                required={champ.required}
              >
                <option key="placeholder" disabled={true}>
                  {champ.placeholder}
                </option>
                {users.map((user) => (
                  <option
                    key={user.id}
                    value={parseInt(user.id)}
                    selected={value === parseInt(user.id)}
                  >
                    {user.full_name ? user.full_name : user.username}
                  </option>
                ))}
              </select>

              {champ.description && (
                <p className="label">{champ.description}</p>
              )}
              {!champ.required && <span className="label">Optional</span>}
            </fieldset>
          </>
        );

      case "toggle":
        return (
          <>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{champ.label}</legend>

              <div className="flex gap-2">
                <input
                  type={champ.type}
                  name={champ.name}
                  checked={value}
                  onChange={(e) =>
                    handleInputChange(champ.name, e.target.checked)
                  }
                  className="toggle toggle-primary"
                  required={champ.required}
                />
                <label className="label">
                  <span className="label-text text-base-content">
                    {champ.option[0].label}
                  </span>
                </label>
              </div>

              {champ.description && (
                <p className="label">{champ.description}</p>
              )}
              {!champ.required && <span className="label">Optional</span>}
            </fieldset>
          </>
        );

      case "checkbox":
        return (
          <>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{champ.label}</legend>

              <div className="flex gap-2">
                <input
                  type={champ.type}
                  name={champ.name}
                  checked={value}
                  onChange={(e) =>
                    handleInputChange(champ.name, e.target.checked)
                  }
                  className="checkbox checkbox-primary"
                  required={champ.required}
                />
                <label className="label">
                  <span className="label-text text-base-content">
                    {champ.option[0].label}
                  </span>
                </label>
              </div>

              {champ.description && (
                <p className="label">{champ.description}</p>
              )}
              {!champ.required && <span className="label">Optional</span>}
            </fieldset>
          </>
        );

      case "radio":
        return (
          <>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{champ.label}</legend>

              <div className="flex flex-row gap-2">
                {champ.option.map((opt, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type={champ.type}
                      name={champ.name}
                      value={opt.value}
                      checked={value.toString() === opt.value.toString()}
                      onChange={(e) =>
                        handleInputChange(champ.name, e.target.value)
                      }
                      className="radio radio-primary"
                      required={champ.required}
                    />
                    <label className="label">
                      <span className="label-text text-base-content">
                        {opt.label}
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              {champ.description && (
                <p className="label">{champ.description}</p>
              )}
              {!champ.required && <span className="label">Optional</span>}
            </fieldset>
          </>
        );

      case "select":
        return (
          <>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{champ.label}</legend>

              <select
                defaultValue={champ.placeholder}
                className="select select-ghost bg-base-100 brightness-98 w-full"
                onChange={(e) => handleInputChange(champ.name, e.target.value)}
                required={champ.required}
              >
                <option key="placeholder" disabled={true}>
                  {champ.placeholder}
                </option>
                {champ.option.map((opt, index) => (
                  <option
                    key={index}
                    value={opt.value}
                    selected={value.toString() === opt.value.toString()}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>

              {champ.description && (
                <p className="label">{champ.description}</p>
              )}
              {!champ.required && <span className="label">Optional</span>}
            </fieldset>
          </>
        );

      case "textarea":
        return (
          <>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{champ.label}</legend>

              <textarea
                name={champ.name}
                placeholder={champ.placeholder}
                className="textarea textarea-ghost bg-base-100 brightness-98 w-full"
                required={champ.required}
                value={value}
                onChange={(e) => handleInputChange(champ.name, e.target.value)}
              ></textarea>

              {champ.description && (
                <p className="label">{champ.description}</p>
              )}
              {!champ.required && <span className="label">Optional</span>}
            </fieldset>
          </>
        );

      case "color":
        return (
          <>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{champ.label}</legend>

              <div className="rounded-3xl" style={{ backgroundColor: value }}>
                <input
                  type={champ.type}
                  name={champ.name}
                  placeholder={champ.placeholder}
                  value={value}
                  onChange={(e) =>
                    handleInputChange(champ.name, e.target.value)
                  }
                  className="input input-ghost bg-base-100 brightness-98 w-full"
                  style={{ opacity: 0, cursor: "pointer" }}
                  required={champ.required}
                />
              </div>

              {champ.description && (
                <p className="label">{champ.description}</p>
              )}
              {!champ.required && <span className="label">Optional</span>}
            </fieldset>
          </>
        );

      case "date":
        return (
          <>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{champ.label}</legend>

              <input
                type={champ.type}
                name={champ.name}
                placeholder={champ.placeholder}
                value={value}
                onChange={(e) => handleInputChange(champ.name, e.target.value)}
                style={{ cursor: "pointer" }}
                className="input input-ghost bg-base-100 brightness-98 w-full"
                required={champ.required}
              />

              {champ.description && (
                <p className="label">{champ.description}</p>
              )}
              {!champ.required && <span className="label">Optional</span>}
            </fieldset>
          </>
        );

      default:
        return (
          <>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{champ.label}</legend>

              <input
                type={champ.type}
                name={champ.name}
                placeholder={champ.placeholder}
                value={value}
                onChange={(e) => handleInputChange(champ.name, e.target.value)}
                className="input input-ghost bg-base-100 brightness-98 w-full"
                required={champ.required}
              />

              {champ.description && (
                <p className="label">{champ.description}</p>
              )}
              {!champ.required && <span className="label">Optional</span>}
            </fieldset>
          </>
        );
    }
  };

  // console.log("Form values:", formValues);

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
                  {renderInput(config, champ)}
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
              {config.is_activate.delete && (
                <div className="flex flex-row gap-2">
                  <div className="tooltip tooltip-error" data-tip="Supprimer">
                    <button
                      type="button"
                      className={`btn btn-md btn-error rounded-3xl ${mode === "edit" ? "" : "hidden"}`}
                      onClick={() => handleDelete()}
                    >
                      <FontAwesomeIcon icon="fas fa-trash" />
                      {/* <span>Supprimer</span> */}
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
