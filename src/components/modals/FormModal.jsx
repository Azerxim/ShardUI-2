import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

const resolve = (option, values) => (typeof option === "function" ? option(values) : option);

// Modale de formulaire décrite par la page (alliances, guerres…).
// fields : [{ name, label, type, options, required, placeholder, help, empty, resets }]
//   type : "text" | "textarea" | "select" | "radio" | "date" | "color" | "icons"
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
                        {fields.map((field) => (
                            <fieldset key={field.name} className="fieldset">
                                <legend className="fieldset-legend">{field.label}{field.required ? " *" : ""}</legend>
                                {renderField(field)}
                                {field.help ? <p className="label whitespace-normal">{resolve(field.help, values)}</p> : null}
                            </fieldset>
                        ))}
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
