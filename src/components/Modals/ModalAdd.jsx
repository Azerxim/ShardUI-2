import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from "sweetalert2"
import { useParams } from "react-router-dom";

import { getAuthToken } from "../Functions/getAuthToken";

export default function ModalAdd({ config, onSubmit }) {
  const User = JSON.parse(localStorage.getItem('user'));
  const params = useParams();

  // Initialize state with default values from config
  const [formValues, setFormValues] = useState(() => {
    const initialValues = {};
    config.champs.forEach(champ => {
      if (champ.param && champ.name === "user_id") {
        initialValues[champ.name] = User ? User.id : champ.defaultValue;
      } else {
        initialValues[champ.name] = champ.defaultValue;
      }
    });
    return initialValues;
  });

  const handleInputChange = (name, value) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveData = async (e) => {
    e.preventDefault();
    // Logic to save the entry
    console.log("Form values:", formValues);
    const token = localStorage.getItem('token');
    await fetch(config.api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formValues)
    })
    .then(async (response) => {
      if (!response.ok) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: config.error.text,
        });
      } else {
        const data = await response.json();
        Swal.fire({
            icon: "success",
            title: "Succès",
            text: config.success.text,
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
    document.getElementById(config.id).close();
  }

  const renderInput = (champ) => {
    let value = formValues[champ.name] ?? champ.defaultValue;

    switch (champ.type) {
      case "custom":
        if (champ.render) {
          return champ.render(value, handleInputChange);
        }
        return "Invalid custom render function";

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
                  onChange={(e) => handleInputChange(champ.name, e.target.checked)}
                  className="toggle toggle-primary"
                  required={champ.required}
                />
                <label className="label">
                  <span className="label-text text-base-content">{champ.option[0].label}</span>
                </label>
              </div>
              
              {champ.description && <p className="label">{champ.description}</p>}
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
                  onChange={(e) => handleInputChange(champ.name, e.target.checked)}
                  className="checkbox checkbox-primary"
                  required={champ.required}
                />
                <label className="label">
                  <span className="label-text text-base-content">{champ.option[0].label}</span>
                </label>
              </div>
              
              {champ.description && <p className="label">{champ.description}</p>}
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
                      checked={value === opt.value}
                      onChange={(e) => handleInputChange(champ.name, e.target.value)}
                      className="radio radio-primary"
                      required={champ.required}
                    />
                    <label className="label">
                      <span className="label-text text-base-content">{opt.label}</span>
                    </label>
                  </div>
                ))}
              </div>

              {champ.description && <p className="label">{champ.description}</p>}
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
                <option key="placeholder" disabled={true}>{champ.placeholder}</option>
                {champ.option.map((opt, index) => (
                  <option key={index} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {champ.description && <p className="label">{champ.description}</p>}
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

              {champ.description && <p className="label">{champ.description}</p>}
              {!champ.required && <span className="label">Optional</span>}
            </fieldset>
          </>
        );

      case "color":
        return (
          <>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{champ.label}</legend>
              
              <div className="rounded-xl" style={{ backgroundColor: value}}>
                <input
                  type={champ.type}
                  name={champ.name}
                  placeholder={champ.placeholder}
                  value={value}
                  onChange={(e) => handleInputChange(champ.name, e.target.value)}
                  className="input input-ghost bg-base-100 brightness-98 w-full"
                  style={{opacity: 0, cursor: 'pointer'}}
                  required={champ.required}
                />
              </div>
              
              {champ.description && <p className="label">{champ.description}</p>}
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
                style={{cursor: 'pointer'}}
                className="input input-ghost bg-base-100 brightness-98 w-full"
                required={champ.required}
              />
              
              {champ.description && <p className="label">{champ.description}</p>}
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
              
              {champ.description && <p className="label">{champ.description}</p>}
              {!champ.required && <span className="label">Optional</span>}
            </fieldset>
          </>
        );
    }
  }

  console.log("Form values:", formValues);

  return (
    <>
      <dialog id={config.id} className="modal">
        <div className="modal-box">
          <h3 className="flex justify-center w-full font-bold text-2xl">{config.title}</h3>
          <div className="divider divider-neutral"></div>
          <form onSubmit={saveData}>
            <div className="modal-content flex flex-col gap-5">
              {config.champs.map((champ, index) => (
                <div key={index} className={`form-control flex flex-col gap-1 w-full ${champ.display ? '' : 'hidden'}`}>
                  {renderInput(champ)}
                </div>
              ))}
            </div>
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => document.getElementById(config.id).close()}>Close</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}