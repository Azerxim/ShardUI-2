import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    getUserById
} from '../../services/api'
import { Config_Modal_Civilisation_Member_Edit } from '../Modals/Config_Modal_Civilisation_Member_Edit';
import DynamicModal from '../Modals/DynamicModal';
import { showModal } from '../Functions/showModal';

export default function MemberButton({ member, auth = false, tooltip = { position: "bottom" }, bgColor = "", textColor = "", onDelete = () => { }, onModifyMember = () => { } }) {
    const [username, setUsername] = useState("Utilisateur inconnu");
    const [imageUrl, setImageUrl] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // console.log("Authorisation dans MemberButton:", auth);

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
        e.preventDefault();
        setMenuOpen(true);
    };

    return (
        <div className="relative w-min" ref={menuRef}>
            <a
                href={linkUrl}
                className={`w-min tooltip tooltip-${tooltip.position}`}
                data-tip={member.role}
                onContextMenu={handleContextMenu}
            >
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

            {auth && menuOpen && member.role != "Fondateur" && (
                <ul className="menu absolute left-0 top-full z-50 mt-1 w-40 rounded-box bg-base-100 shadow-md">
                    <li>
                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen(false);
                                showModal(Config_Modal_Civilisation_Member_Edit, "edit", { id: member.user_id });
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
            <DynamicModal config={Config_Modal_Civilisation_Member_Edit} local={{ id: member.user_id }} mode="edit" onSubmit={(content) => { onModifyMember(content) }} />
        </div>
    );
}