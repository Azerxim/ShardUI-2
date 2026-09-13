import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import VilleReligionEditModal from "../Modals/VilleReligionEditModal";
import { showModalID } from "../Functions/showModal";
import { religionColor, religionIcon, formatInfluence } from "../Functions/religionColor";
import { getApiURL } from "../../services/api";

const influenceOf = (religion) => Math.max(0, Number(religion.influence) || 0);

// Barre empilée : part de chaque religion dans la ville, le reste en fond neutre
function ReligionsBar({ religions, total, className = "h-3" }) {
    const scale = Math.max(100, total);

    return (
        <div className={`flex w-full rounded-full overflow-hidden bg-base-300 ${className}`}>
            {religions.map((religion) => (
                <div
                    key={religion.id}
                    className="h-full"
                    style={{ width: `${(influenceOf(religion) / scale) * 100}%`, backgroundColor: religionColor(religion) }}
                    title={`${religion.title} : ${formatInfluence(religion.influence)}`}
                ></div>
            ))}
        </div>
    );
}

// Lieu des religions : mêmes routes /religions/{scope}/{id}/… pour une ville ou un quartier
const PLACES = {
    ville: { this: "cette ville", from: "de la ville" },
    quartier: { this: "ce quartier", from: "du quartier" },
};

// ville : lieu affiché (une ville, ou un quartier avec scope="quartier")
export default function VilleReligions({ religions = [], ville = null, scope = "ville", auth = false, compact = false, onModify = () => { }, onDelete = () => { } }) {
    const navigate = useNavigate();
    const place = PLACES[scope] ?? PLACES.ville;

    const sorted = [...(religions || [])].sort((a, b) => influenceOf(b) - influenceOf(a));
    const total = sorted.reduce((sum, religion) => sum + influenceOf(religion), 0);

    if (sorted.length === 0) {
        return <p className="italic opacity-70">Aucune religion</p>;
    }

    // Version courte (carte de ville dans la page civilisation, déjà dans un lien) :
    // largeur fixe pour que les barres de toutes les villes soient comparables
    if (compact) {
        return (
            <div className="flex flex-col gap-2 w-64 max-w-full">
                <ReligionsBar religions={sorted} total={total} className="h-2" />
                <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-sm">
                    {sorted.map((religion) => (
                        <span key={religion.id} className="flex flex-row items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: religionColor(religion) }}></span>
                            <span>{religion.title}</span>
                            <span className="opacity-70">{formatInfluence(religion.influence)}</span>
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    const handleDelete = async (religion) => {
        const confirm = await Swal.fire({
            icon: "warning",
            title: "Retirer la religion ?",
            text: `${religion.title} ne sera plus associée à ${ville?.title ?? place.this}.`,
            showCancelButton: true,
            confirmButtonText: "Retirer",
            cancelButtonText: "Annuler",
        });
        if (!confirm.isConfirmed) return;

        try {
            const response = await fetch(`${getApiURL()}/religions/${scope}/${ville?.id ?? 0}/delete/${religion.id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.erreur || data.error) {
                throw new Error(data.erreur || data.text || (typeof data.detail === "string" ? data.detail : null) || "Erreur API lors du retrait de la religion.");
            }
            Swal.fire({ icon: "success", title: "Religion retirée", text: `${religion.title} a été retirée ${place.from}.` });
            onDelete(religion);
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: "error", title: "Oops...", text: error.message });
        }
    };

    const dominant = sorted.length > 1 && influenceOf(sorted[0]) > influenceOf(sorted[1]) ? sorted[0].id : null;

    return (
        <div className="flex flex-col gap-3 w-full bg-base-100 p-2 sm:p-4 rounded-2xl">
            <ReligionsBar religions={sorted} total={total} />
            {total < 100 ? (
                <span className="text-sm opacity-70">Sans religion : {formatInfluence(100 - total)}</span>
            ) : total > 100 ? (
                <span className="text-sm text-warning">Total des influences : {formatInfluence(total)} (plus de 100 %)</span>
            ) : null}

            <ul className="flex flex-col gap-2">
                {sorted.map((religion) => {
                    const color = religionColor(religion);
                    return (
                        <li key={religion.id} className="flex flex-row items-center gap-2 sm:gap-3 bg-base-200 rounded-2xl p-2 sm:p-3">
                            <button
                                type="button"
                                className="flex flex-row items-center gap-2 sm:gap-3 flex-1 min-w-0 text-left cursor-pointer"
                                onClick={() => navigate(`/religion/${religion.id}`)}
                            >
                                <span className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-white" style={{ backgroundColor: color }}>
                                    <FontAwesomeIcon icon={religionIcon(religion)} />
                                </span>
                                <span className="flex flex-col flex-1 min-w-0 gap-1">
                                    <span className="flex flex-row items-center gap-2 font-bold">
                                        <span className="truncate">{religion.title}</span>
                                        {religion.id === dominant ? <span className="badge badge-sm badge-neutral">Majoritaire</span> : null}
                                    </span>
                                    <span className="w-full h-2 rounded-full bg-base-300 overflow-hidden">
                                        <span className="block h-full rounded-full" style={{ width: `${Math.min(100, influenceOf(religion))}%`, backgroundColor: color }}></span>
                                    </span>
                                </span>
                                <span className="font-semibold tabular-nums w-12 sm:w-16 shrink-0 text-right">{formatInfluence(religion.influence)}</span>
                            </button>

                            {auth ? (
                                <>
                                    <div className="flex flex-row gap-1">
                                        <button type="button" className="btn btn-sm btn-ghost btn-circle tooltip tooltip-left" data-tip="Modifier l'influence" onClick={() => showModalID(`${scope}-religion-edit-modal-${religion.id}`)}>
                                            <FontAwesomeIcon icon="fa-solid fa-pen" />
                                        </button>
                                        <button type="button" className="btn btn-sm btn-ghost btn-circle text-error tooltip tooltip-left" data-tip={`Retirer ${place.from}`} onClick={() => handleDelete(religion)}>
                                            <FontAwesomeIcon icon="fa-solid fa-trash" />
                                        </button>
                                    </div>
                                    <VilleReligionEditModal
                                        id={`${scope}-religion-edit-modal-${religion.id}`}
                                        ville_id={ville?.id ?? 0}
                                        scope={scope}
                                        religion={religion}
                                        onSubmit={onModify}
                                    />
                                </>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
