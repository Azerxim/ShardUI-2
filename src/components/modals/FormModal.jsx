import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import LocalisationField from "@/components/modals/fields/LocalisationField";

const resolve = (option, values) => (typeof option === "function" ? option(values) : option);

// Modale de formulaire décrite par la page (alliances, guerres…).
// fields : [{ name, label, type, options, required, placeholder, help, empty, resets }]
//   type : "text" | "textarea" | "select" | "radio" | "checkboxes" | "file" | "date" | "number" | "color" | "icons"
//   checkboxes : valeur = tableau des options cochées ; file : valeur = File (accept : types acceptés)
//   localisation : monde + X/Z avec carte de localisation, comme pour les villes (écrit dimension_id, x et z)
//   onglets : la valeur est l'onglet choisi ; options : [{ value, label, aide?, fields? }] — seuls les champs de
//     l'onglet actif sont affichés (ceux des autres gardent leur valeur : c'est à onSubmit de l'ignorer)
//   options (select, radio, icons) et empty (texte si aucun choix) : valeur ou fonction (valeurs) => valeur
//   resets : champs vidés quand celui-ci change (ex. le type de guerre remet à zéro les camps)
// onSubmit(valeurs) appelle l'API ; une Error levée affiche son message puis rouvre la modale.
// Pour repartir de nouvelles valeurs initiales, changer la key du composant.
export default function FormModal({ id, title, intro = null, fields = [], initialValues = {}, submitLabel = "Valider", submitIcon = "fas fa-check", submitClass = "btn-primary", onSubmit = async () => { } }) {
    const [values, setValues] = useState(initialValues);
    const [busy, setBusy] = useState(false);

    const dialog = () => document.getElementById(id);

    const setValue = (field, value) => {
        setValues((prev) => {
            const next = { ...prev, [field.name]: value };
            (field.resets || []).forEach((name) => { next[name] = ""; });
            return next;
        });
    };

    const blocked = fields.some((field) => field.required && ["select", "radio"].includes(field.type) && (resolve(field.options, values) || []).length === 0);

    const handleCancel = () => {
        dialog()?.close();
        setValues(initialValues);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setBusy(true);
        // La modale (top layer) masquerait les alertes : on la ferme avant l'appel
        dialog()?.close();
        try {
            await onSubmit(values);
            setValues(initialValues);
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Action impossible", text: error.message });
            dialog()?.showModal();
        } finally {
            setBusy(false);
        }
    };

    const renderField = (field) => {
        const value = values[field.name] ?? "";
        const inputClass = "input input-ghost bg-base-100 brightness-98 w-full";
        const options = resolve(field.options, values) || [];

        switch (field.type) {
            case "textarea":
                return <textarea name={field.name} value={value} placeholder={field.placeholder} required={field.required} rows={3} onChange={(e) => setValue(field, e.target.value)} className="textarea textarea-ghost bg-base-100 brightness-98 w-full" />;
            case "select":
                if (options.length === 0) {
                    return <p className="italic opacity-70">{resolve(field.empty, values) || "Aucun choix disponible."}</p>;
                }
                return (
                    <select name={field.name} value={options.some((opt) => String(opt.value) === String(value)) ? String(value) : ""} required={field.required} onChange={(e) => setValue(field, e.target.value)} className="select select-ghost bg-base-100 brightness-98 w-full">
                        {/* Choix facultatif : le libellé vide (« Aucune ») reste sélectionnable */}
                        <option value="" disabled={field.required}>{field.placeholder || "Choisir…"}</option>
                        {options.map((opt) => <option key={opt.value} value={String(opt.value)}>{opt.label}</option>)}
                    </select>
                );
            case "radio":
                return (
                    <div className="flex flex-row flex-wrap gap-x-4 gap-y-2">
                        {options.map((opt) => (
                            <label key={opt.value} className="flex flex-row items-center gap-2 cursor-pointer">
                                <input type="radio" name={`${id}-${field.name}`} value={String(opt.value)} checked={String(value) === String(opt.value)} required={field.required} onChange={() => setValue(field, opt.value)} className="radio radio-primary" />
                                <span className="label-text text-base-content">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                );
            case "checkboxes": {
                const cochees = Array.isArray(value) ? value : [];
                return (
                    <div className="flex flex-row flex-wrap gap-x-4 gap-y-2">
                        {options.map((opt) => (
                            <label key={opt.value} className="flex flex-row items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name={`${field.name}-${opt.value}`}
                                    checked={cochees.includes(opt.value)}
                                    onChange={(e) => setValue(field, e.target.checked ? [...cochees, opt.value] : cochees.filter((v) => v !== opt.value))}
                                    className="checkbox checkbox-primary checkbox-sm"
                                />
                                <span className="label-text text-base-content">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                );
            }
            case "file":
                // Un champ fichier ne se remplit pas par programme : sa valeur est le File choisi
                return <input type="file" name={field.name} accept={field.accept} required={field.required} onChange={(e) => setValue(field, e.target.files?.[0] ?? null)} className="file-input file-input-ghost bg-base-100 brightness-98 w-full" />;
            case "onglets": {
                const actif = options.find((opt) => String(opt.value) === String(value)) ?? options[0];
                return (
                    <div className="flex flex-col gap-2">
                        <div role="tablist" aria-label={field.label} className="tabs tabs-box bg-base-200 flex-wrap w-fit">
                            {options.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    role="tab"
                                    aria-selected={opt === actif}
                                    className={`tab ${opt === actif ? "tab-active" : ""}`}
                                    onClick={() => setValue(field, opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div role="tabpanel" className="flex flex-col gap-2">
                            {actif?.aide ? <p className="text-sm opacity-80">{resolve(actif.aide, values)}</p> : null}
                            {(actif?.fields || []).map(renderChamp)}
                        </div>
                    </div>
                );
            }
            case "icons":
                return (
                    <div className="flex flex-row flex-wrap gap-2">
                        {options.map((icon) => (
                            <button key={icon} type="button" aria-label={icon} aria-pressed={value === icon} onClick={() => setValue(field, icon)} className={`btn btn-square ${value === icon ? "btn-primary" : "btn-ghost bg-base-100"}`}>
                                <FontAwesomeIcon icon={icon} />
                            </button>
                        ))}
                    </div>
                );
            default:
                return <input type={field.type || "text"} name={field.name} value={value} placeholder={field.placeholder} required={field.required} onChange={(e) => setValue(field, e.target.value)} className={field.type === "color" ? "w-full h-10 cursor-pointer rounded-2xl" : inputClass} />;
        }
    };

    // Un champ avec sa légende et son aide ; aussi appelé pour les champs d'un onglet
    function renderChamp(field) {
        if (field.type === "localisation") {
            // Champ des modales dynamiques (villes, magasins) : il porte sa propre légende
            return (
                <LocalisationField
                    key={field.name}
                    champ={field}
                    formValues={values}
                    onChange={(name, value) => setValues((prev) => ({ ...prev, [name]: value }))}
                />
            );
        }
        return (
            <fieldset key={field.name} className="fieldset">
                <legend className="fieldset-legend">{field.label}{field.required ? " *" : ""}</legend>
                {renderField(field)}
                {field.help ? <p className="label whitespace-normal">{resolve(field.help, values)}</p> : null}
            </fieldset>
        );
    }

    return (
        <dialog id={id} className="modal">
            <div className="modal-box max-h-[90dvh] overflow-y-auto">
                <h3 className="flex justify-center w-full font-bold text-2xl pr-8">{title}</h3>
                <div className="divider divider-neutral"></div>
                <form onSubmit={handleSubmit}>
                    <button className="btn btn-md btn-circle btn-ghost absolute right-4 top-4" type="button" aria-label="Fermer" onClick={handleCancel}>
                        <FontAwesomeIcon icon="fas fa-xmark" size="xl" />
                    </button>
                    <div className="flex flex-col gap-4">
                        {intro ? (
                            <div role="note" className="alert alert-info alert-soft">
                                <FontAwesomeIcon icon="fa-solid fa-circle-info" />
                                <span>{intro}</span>
                            </div>
                        ) : null}
                        {fields.map(renderChamp)}
                    </div>
                    <div className="modal-action">
                        <button type="button" className="btn btn-md rounded-3xl" onClick={handleCancel}>Annuler</button>
                        <button type="submit" className={`btn btn-md rounded-3xl gap-2 ${submitClass}`} disabled={busy || blocked}>
                            <FontAwesomeIcon icon={submitIcon} />
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button>Close</button>
            </form>
        </dialog>
    );
}
