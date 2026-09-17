import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "@/components/layout/Navbar";
import TitleH1 from "@/components/ui/TitleH1";
import { showModalID } from "@/utils/showModal";
import {
    getDimensions,
    createDimension,
    updateDimension,
    deleteDimension
} from "@/services/api";

const MODAL_ID = "admin-dimension-modal";
const MAP_URL = "https://map.beta.tetrago.fr";
const EMPTY_FORM = { id: null, title: "", link: "", description: "" };

function AccessMessage({ text, link, label }) {
    return (
        <>
            <Navbar active="admin-dimensions" />
            <div className="text-center py-12 px-4">
                <p className="text-xl">{text}</p>
                <Link to={link} className="btn btn-primary mt-4">{label}</Link>
            </div>
        </>
    );
}

export default function AdminDimensionsPage() {
    const user = JSON.parse(localStorage.getItem("user"));
    const isAdmin = Boolean(user?.is_admin);
    const [dimensions, setDimensions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isAdmin) return;
        getDimensions()
            .then((data) => setDimensions(Array.isArray(data) ? data : []))
            .catch((err) => {
                console.error("Erreur lors de la récupération des dimensions:", err);
                setError(err);
            })
            .finally(() => setLoading(false));
    }, [isAdmin]);

    if (!user) {
        return <AccessMessage text="Vous devez être connecté pour accéder à cette page." link="/login" label="Se connecter" />;
    }
    if (!user.is_admin) {
        return <AccessMessage text="Vous n'avez pas les droits nécessaires pour accéder à cette page." link="/" label="Retour à l'accueil" />;
    }

    const openForm = (dimension = EMPTY_FORM) => {
        setForm({
            id: dimension.id,
            title: dimension.title ?? "",
            link: dimension.link ?? "",
            description: dimension.description ?? ""
        });
        showModalID(MODAL_ID);
    };

    const closeForm = () => document.getElementById(MODAL_ID)?.close();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            title: form.title.trim(),
            link: form.link.trim() || null,
            description: form.description.trim() || null
        };

        setSaving(true);
        try {
            if (form.id) {
                const saved = await updateDimension({ id: form.id, ...payload });
                setDimensions(dimensions.map((dim) => dim.id === form.id ? saved : dim));
            } else {
                const saved = await createDimension(payload);
                setDimensions([...dimensions, saved]);
            }
            closeForm();
            setForm(EMPTY_FORM);
            Swal.fire({ icon: "success", title: "Succès", text: form.id ? "Dimension modifiée." : "Dimension créée." });
        } catch (err) {
            closeForm();
            Swal.fire({ icon: "error", title: "Oops...", text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (dimension) => {
        const confirm = await Swal.fire({
            icon: "warning",
            title: "Supprimer la dimension ?",
            text: `${dimension.title} sera définitivement supprimée.`,
            showCancelButton: true,
            confirmButtonText: "Supprimer",
            cancelButtonText: "Annuler",
        });
        if (!confirm.isConfirmed) return;

        try {
            await deleteDimension(dimension.id);
            setDimensions(dimensions.filter((dim) => dim.id !== dimension.id));
            Swal.fire({ icon: "success", title: "Succès", text: "Dimension supprimée." });
        } catch (err) {
            Swal.fire({ icon: "error", title: "Oops...", text: err.message });
        }
    };

    const FctDimensions = [
        { id: 1, title: "Nouvelle", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: true, function: () => openForm() }
    ];

    let content;
    if (loading) {
        content = (
            <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    } else if (error) {
        content = (
            <div className="alert alert-error">
                <span>Impossible de récupérer la liste des dimensions.</span>
            </div>
        );
    } else if (dimensions.length === 0) {
        content = <p className="italic opacity-70">Aucune dimension définie.</p>;
    } else {
        content = (
            <ul className="flex flex-col gap-2">
                {dimensions.map((dimension) => (
                    <li key={dimension.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-base-200 rounded-2xl p-3 sm:p-4">
                        <div className="flex flex-row items-start gap-3 flex-1 min-w-0">
                            <span className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 bg-base-300">
                                <FontAwesomeIcon icon="fa-solid fa-earth-europe" />
                            </span>
                            <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex flex-row flex-wrap items-center gap-2">
                                    <span className="font-bold text-lg break-words">{dimension.title}</span>
                                    <span className="badge badge-sm badge-neutral">#{dimension.id}</span>
                                </div>
                                {dimension.link ? (
                                    <a href={`${MAP_URL}/${dimension.link}`} target="_blank" rel="noopener noreferrer" className="link link-primary text-sm font-mono break-all">
                                        {dimension.link}
                                        <FontAwesomeIcon icon="fa-solid fa-arrow-up-right-from-square" className="ml-1 text-xs" />
                                    </a>
                                ) : (
                                    <span className="text-sm text-warning">Pas de lien de carte : les cartes intégrées ne s'afficheront pas.</span>
                                )}
                                {dimension.description ? (
                                    <p className="text-sm opacity-70 break-words">{dimension.description}</p>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex flex-row gap-2 justify-end">
                            <button type="button" className="btn btn-sm rounded-2xl gap-2" onClick={() => openForm(dimension)}>
                                <FontAwesomeIcon icon="fa-solid fa-pen" />
                                <span>Modifier</span>
                            </button>
                            <button type="button" className="btn btn-sm btn-ghost btn-circle text-error tooltip tooltip-left" data-tip="Supprimer" onClick={() => handleDelete(dimension)}>
                                <FontAwesomeIcon icon="fa-solid fa-trash" />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <>
            <Navbar active="admin-dimensions" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col gap-4 w-full">
                    <TitleH1 text="Dimensions" icon="fas fa-earth-europe" fonctions={FctDimensions} />
                    <p className="text-sm opacity-70 px-1">
                        Une dimension correspond à un monde de la carte. Son lien est le préfixe utilisé par la carte ({MAP_URL}/<b>lien</b>-embedfull-…) pour les cartes intégrées des villes et civilisations.
                    </p>
                    {content}
                    {!loading && !error ? <i className="text-sm opacity-70">{dimensions.length} dimension(s) définie(s).</i> : null}
                </div>

                <dialog id={MODAL_ID} className="modal">
                    <div className="modal-box max-h-[90dvh] overflow-y-auto">
                        <button type="button" className="btn btn-md btn-circle btn-ghost absolute right-4 top-4" onClick={closeForm}>
                            <FontAwesomeIcon icon="fas fa-xmark" size="xl" />
                        </button>
                        <h3 className="flex justify-center w-full font-bold text-2xl pr-5">
                            {form.id ? "Modifier la dimension" : "Nouvelle dimension"}
                        </h3>
                        <div className="divider divider-neutral"></div>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <label className="flex flex-col gap-1">
                                <span className="font-semibold">Titre *</span>
                                <input type="text" name="title" className="input input-bordered w-full" placeholder="Tetrago" value={form.title} onChange={handleChange} required />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="font-semibold">Lien de la carte</span>
                                <input type="text" name="link" className="input input-bordered w-full font-mono" placeholder="tetrago" value={form.link} onChange={handleChange} pattern="[A-Za-z0-9_\-]+" title="Lettres, chiffres, tirets et underscores uniquement" />
                                <span className="text-xs opacity-70 break-all">
                                    {form.link.trim() ? `${MAP_URL}/${form.link.trim()}-embedfull-civilisations` : "Identifiant du monde sur la carte."}
                                </span>
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="font-semibold">Description</span>
                                <textarea name="description" className="textarea textarea-bordered w-full" placeholder="Overworld" rows={3} value={form.description} onChange={handleChange}></textarea>
                            </label>
                            <div className="modal-action flex flex-row gap-2 justify-end">
                                <button type="button" className="btn btn-md rounded-3xl" onClick={closeForm}>Annuler</button>
                                <button type="submit" className="btn btn-md btn-primary rounded-3xl gap-2" disabled={saving}>
                                    {saving ? <span className="loading loading-spinner loading-sm"></span> : <FontAwesomeIcon icon="fas fa-check" />}
                                    <span>Enregistrer</span>
                                </button>
                            </div>
                        </form>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button>Close</button>
                    </form>
                </dialog>
            </main>
        </>
    );
}
