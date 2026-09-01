import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import VilleReligionEditModal from '../Modals/VilleReligionEditModal';
import {
    getApiURL
} from '../../services/api'
import Swal from "sweetalert2";
import { showModalID } from '../Functions/showModal';
export default function ReligionButton({ religion, ville = {}, auth = false, tooltip = { position: "bottom" }, bgColor = "bg-base-100", textColor = "", onDelete = () => { }, onModify = () => { } }) {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const apiURL = getApiURL();

    useEffect(() => {
        if (!menuOpen) return;

        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("contextmenu", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("contextmenu", handleClickOutside);
        };
    }, [menuOpen]);

    const handleContextMenu = (e) => {
        e.preventDefault();
        setMenuOpen(true);
    };

    const handleDelete = async (religion) => {
        const token = localStorage.getItem('token');
        const api = {
            url: `${apiURL}/religions/ville/${ville?.id ? ville.id : 0}/delete/${religion.id}`,
            method: "DELETE"
        }

        await fetch(api.url, {
            method: api.method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to delete religion from ville");
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Religion supprimée',
                        text: 'La religion a été supprimée de la ville avec succès.',
                    });
                    onDelete(religion);
                }
            })
            .catch(error => {
                console.error(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: 'Une erreur est survenue lors de la suppression de la religion de la ville.',
                });
            });
    }

    // console.log(religion);

    const icon = religion.icon ? religion.icon : "fa-solid fa-cross";

    return (
        <div className="relative w-min" ref={menuRef}>
            <button
                className={`w-min tooltip tooltip-${tooltip.position}`}
                data-tip={religion.description}
                onContextMenu={handleContextMenu}
                onClick={() => navigate(`/religion/${religion.id}`)}
            >
                <div className={`btn ${bgColor} ${textColor} rounded-3xl shadow-md p-2 h-10 w-min`}>
                    <div className="flex items-center space-x-2 flex-nowrap">
                        {icon && <FontAwesomeIcon icon={icon} />}
                        <span className='whitespace-nowrap mr-2'>{religion.title}</span>
                        <span>|</span>
                        <span className='whitespace-nowrap'>{religion.influence}%</span>
                    </div>
                </div>
            </button>

            <VilleReligionEditModal
                id={`ville-religion-edit-modal-${religion.id}`}
                ville_id={ville?.id ? ville.id : 0}
                religion_id={religion.id}
                onSubmit={(data) => {
                    // console.log("Updated data:", data);
                    onModify(data);
                }}
            />

            {auth && menuOpen && (
                <ul className="menu absolute left-0 top-full z-50 mt-1 w-40 rounded-box bg-base-100 shadow-md">
                    <li>
                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen(false);
                                showModalID(`ville-religion-edit-modal-${religion.id}`);
                            }}
                        >
                            <FontAwesomeIcon icon="fa-solid fa-pen" />
                            <span>Modifier</span>
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="text-error"
                            onClick={() => {
                                setMenuOpen(false);
                                handleDelete(religion);
                            }}
                        >
                            <FontAwesomeIcon icon="fa-solid fa-trash" />
                            <span>Supprimer</span>
                        </button>
                    </li>
                </ul>
            )}

        </div>
    );
}