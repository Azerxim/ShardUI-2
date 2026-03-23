import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from "sweetalert2"

import { getAuthToken } from "../Functions/getAuthToken";

export default function Modal({ config, onSubmit }) {
  const User = JSON.parse(localStorage.getItem('user'));

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
      case "checkbox":
        return (
          <div className="flex gap-2">
            <label className="label">
              <span className="label-text text-base-content">{champ.label}</span>
            </label>
            <input
              type={champ.type}
              name={champ.name}
              checked={value}
              onChange={(e) => handleInputChange(champ.name, e.target.checked)}
              className="checkbox"
              required={champ.required}
            />
          </div>
        );
      case "textarea":
        return (
          <>
            <label className="label">
              <span className="label-text text-base-content">{champ.label}</span>
            </label>
            <textarea
              name={champ.name}
              placeholder={champ.placeholder}
              className="textarea textarea-bordered w-full"
              required={champ.required}
              value={value}
              onChange={(e) => handleInputChange(champ.name, e.target.value)}
            ></textarea>
          </>
        );
      case "color":
        return (
          <>
            <label className="label">
              <span className="label-text text-base-content">{champ.label}</span>
            </label>
            <div className="rounded-xl" style={{ backgroundColor: value}}>
              <input
                type={champ.type}
                name={champ.name}
                placeholder={champ.placeholder}
                value={value}
                onChange={(e) => handleInputChange(champ.name, e.target.value)}
                className="input input-bordered w-full"
                style={{opacity: 0, cursor: 'pointer'}}
                required={champ.required}
              />
            </div>
          </>
        );
      case "date":
        return (
          <>
            <label className="label">
              <span className="label-text text-base-content">{champ.label}</span>
            </label>
            <input
              type={champ.type}
              name={champ.name}
              placeholder={champ.placeholder}
              value={value}
              onChange={(e) => handleInputChange(champ.name, e.target.value)}
              style={{cursor: 'pointer'}}
              className="input input-bordered w-full"
              required={champ.required}
            />
          </>
        );
      default:
        return (
          <>
            <label className="label">
              <span className="label-text text-base-content">{champ.label}</span>
            </label>
            <input
              type={champ.type}
              name={champ.name}
              placeholder={champ.placeholder}
              value={value}
              onChange={(e) => handleInputChange(champ.name, e.target.value)}
              className="input input-bordered w-full"
              required={champ.required}
            />
          </>
        );
    }
  }

  return (
    <>
      <dialog id={config.id} className="modal">
        <div className="modal-box">
          <h3 className="flex justify-center w-full font-bold text-2xl">{config.title}</h3>
          <div className="divider divider-neutral"></div>
          <form onSubmit={saveData}>
            <div className="modal-content flex flex-col gap-2">
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