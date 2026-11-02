import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    getUserById
} from '@/services/api'
import { civilisationMemberEditModal } from '@/config/modals/civilisation-member-edit';
import DynamicModal from '@/components/modals/DynamicModal';
import { showModal } from '@/utils/showModal';

// Membre d'une civilisation, d'une religion ou d'un commerce : une ligne avec portrait, nom et rôle (badge pour le fondateur).
// Les actions (modifier / supprimer / transférer) restent dans le menu, ouvert par
// le bouton visible ou par clic droit.
// editConfig : config DynamicModal d'édition du membre ; null = pas de modification ni suppression
// (ex. religions, sans routes dédiées).
// Couleur stable par utilisateur et initiale du nom, pour le portrait sans image
const couleurDe = (id) => `hsl(${((Number(id) || 0) * 137) % 360} 45% 40%)`;
const initiale = (nom) => (nom || "?").trim().charAt(0).toUpperCase();

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
        // Charte « Chancellerie » : une ligne par membre (portrait, nom, rôle), comme la maquette des fiches
        <div className="relative flex flex-row items-center gap-3 w-full ligne-fiche" ref={menuRef} onContextMenu={handleContextMenu}>
            <a href={linkUrl || undefined} className="flex flex-row items-center gap-3 flex-1 min-w-0 group">
                <span className={`flex items-center justify-center w-9 h-9 rounded-full overflow-hidden shrink-0 font-bold text-sm ${bgColor} ${textColor}`} style={bgColor ? undefined : { backgroundColor: couleurDe(member.user_id), color: "#ffffff" }} aria-hidden="true">
                    {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> : initiale(username)}
                </span>
                <span className="flex flex-col min-w-0 leading-tight">
                    <span className="font-bold truncate group-hover:underline">{username}</span>
                    {member.role && !isFondateur ? <span className="text-sm opacity-70 truncate">{member.role}</span> : null}
                </span>
            </a>

            {isFondateur ? (
                <span className={`badge badge-sm gap-1 border-0 shrink-0 ${roleColor ? "text-white" : "badge-primary"}`} style={{ backgroundColor: roleColor || undefined }}>
                    <FontAwesomeIcon icon="fa-solid fa-crown" />
                    {member.role}
                </span>
            ) : null}

            {hasActions ? (
                <button
                    type="button"
                    className="btn btn-sm btn-ghost btn-circle shrink-0"
                    aria-label={`Actions pour ${username}`}
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    <FontAwesomeIcon icon="fa-solid fa-ellipsis-vertical" />
                </button>
            ) : null}

            {auth && menuOpen && !isFondateur && editConfig && (
                <ul className="menu absolute right-0 top-full z-50 mt-1 w-40 rounded-box bg-base-100 shadow-md">
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
                <ul className="menu absolute right-0 top-full z-50 mt-1 w-40 rounded-box bg-base-100 shadow-md">
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
