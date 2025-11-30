import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function UserButton({ userid, bgColor = "", textColor = "" }) {
    const [username, setUsername] = useState("Utilisateur inconnu");
    const [imageUrl, setImageUrl] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    fetch(`/api/user/read/${userid}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error == 200) {
                setUsername(data.user.pseudo);
                setImageUrl(data.user.image_url);
                setLinkUrl(`/profil/${data.user.id}`);
            }
        })
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