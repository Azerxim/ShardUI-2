import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    getUserById
} from '@/services/api'
import { civilisationMemberEditModal } from '@/config/modals/civilisation-member-edit';
import DynamicModal from '@/components/modals/DynamicModal';
import { showModal } from '@/utils/showModal';

// Membre d'une civilisation ou d'une religion : utilisateur + rôle en badge.
// Les actions (modifier / supprimer / transférer) restent dans le menu, ouvert par
// le bouton visible ou par clic droit.
// editConfig : config DynamicModal d'édition du membre ; null = pas de modification ni suppression
// (ex. religions, sans routes dédiées).
export default function MemberButton({ member, auth = false, bgColor = "", textColor = "", roleColor = "", editConfig = civilisationMemberEditModal, onDelete = () => { }, onModifyMember = () => { }, onTransfer = () => { } }) {
    const [username, setUsername] = useState("Utilisateur inconnu");
    const [imageUrl, setImageUrl] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await getUserById(member.user_id);
                setUsername(data.full_name);
                setImageUrl(data.image_url);
                setLinkUrl(`/profil/${data.id}`);
            } catch (error) {
                console.error("Erreur dans MemberButton:", error);
            }
        };

        if (member.user_id) {
            fetchUserData();
        }
    }, [member.user_id]);

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
        if (!auth || !(member.role === "Fondateur" || editConfig)) return;
        e.preventDefault();
        setMenuOpen(true);
    };

    const isFondateur = member.role === "Fondateur";
    // Aucune action disponible pour ce membre : pas de bouton ni de menu
    const hasActions = auth && (isFondateur || Boolean(editConfig));

    return (
        <div className="relative flex flex-row items-center gap-2 bg-base-200 rounded-3xl pr-3" ref={menuRef} onContextMenu={handleContextMenu}>
            <a href={linkUrl} className='w-min'>
                <div className={`btn ${bgColor} ${textColor} rounded-3xl shadow-md p-2 h-10 w-min`}>
                    <div className="flex items-center space-x-2 flex-nowrap">
                        <div className="avatar">
                            <div className="mask mask-circle w-6 px-1">
                                {imageUrl != "" && imageUrl != null ? (<img src={imageUrl} />) : (<FontAwesomeIcon icon="fa-solid fa-user" />)}
                            </div>
                        </div>
                        <span className='whitespace-nowrap mr-2'>{username}</span>
                    </div>
                </div>
            </a>

            {member.role ? (
                isFondateur ? (
                    <span className={`badge badge-sm gap-1 border-0 ${roleColor ? "text-white" : "badge-primary"}`} style={{ backgroundColor: roleColor || undefined }}>
                        <FontAwesomeIcon icon="fa-solid fa-crown" />
                        {member.role}
                    </span>
                ) : (
                    <span className="badge badge-sm badge-ghost">{member.role}</span>
                )
            ) : null}

            {hasActions ? (
                <button
                    type="button"
                    className="btn btn-xs btn-ghost btn-circle -mr-1"
                    aria-label={`Actions pour ${username}`}
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    <FontAwesomeIcon icon="fa-solid fa-ellipsis-vertical" />
                </button>
            ) : null}

            {auth && menuOpen && !isFondateur && editConfig && (
                <ul className="menu absolute left-0 top-full z-50 mt-1 w-40 rounded-box bg-base-100 shadow-md">
                    <li>
                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen(false);
                                showModal(editConfig, "edit", { id: member.user_id });
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
                                onDelete(member);
                            }}
                        >
                            <FontAwesomeIcon icon="fa-solid fa-trash" />
                            <span>Supprimer</span>
                        </button>
                    </li>
                </ul>
            )}

            {auth && menuOpen && isFondateur && (
                <ul className="menu absolute left-0 top-full z-50 mt-1 w-40 rounded-box bg-base-100 shadow-md">
                    <li>
                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen(false);
                                onTransfer(member);
                            }}
                        >
                            <FontAwesomeIcon icon="fa-solid fa-arrow-right-from-bracket" />
                            <span>Transférer</span>
                        </button>
                    </li>
                </ul>
            )}
            {editConfig ? (
                <DynamicModal config={editConfig} local={{ id: member.user_id }} mode="edit" onSubmit={(content) => { onModifyMember(content) }} />
            ) : null}
        </div>
    );
}
