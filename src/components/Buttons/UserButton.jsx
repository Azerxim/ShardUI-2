import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function UserButton({ userid, bgColor = "", textColor = "" }) {
    const [username, setUsername] = useState("Utilisateur inconnu");
    const [imageUrl, setImageUrl] = useState("");
    const [linkUrl, setLinkUrl] = useState("");

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`/api/users/id/${userid}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des informations utilisateur");
                }

                const data = await response.json();
                setUsername(data.full_name);
                setImageUrl(data.image_url);
                setLinkUrl(`/profil/${data.id}`);
            } catch (error) {
                console.error("Erreur dans UserButton:", error);
            }
        };

        if (userid) {
            fetchUserData();
        }
    }, [userid]);
    return (
        <a href={linkUrl} className='w-min'>
            <div className={`btn ${bgColor} ${textColor} rounded-2xl shadow-md p-2 h-10 w-min`}>
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
    );
}