import { useState } from 'react';

export default function UserButton({ userid, link, bgColor = "bg-base-200", textColor = "text-neutral-950" }) {
    const [username, setUsername] = useState("Utilisateur inconnu");
    const [imageUrl, setImageUrl] = useState("");
    fetch(`/api/user/read/${userid}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.error == 200) {
            setUsername(data.user.full_name);
            setImageUrl(data.user.image_url);
        }
    })
    return (
        <a href={link} className='w-min'>
            <div className={`${bgColor} ${textColor} rounded-3xl shadow-md p-2 h-10 w-min`}>
                <div className="flex items-center space-x-2 flex-nowrap">
                    <div className="avatar">
                        <div className="mask mask-circle w-6">
                            {imageUrl != "" ? (<img src={imageUrl} />) : (<img src="/profil_black.png" />)}
                        </div>
                    </div>
                    <span className='whitespace-nowrap mr-2'>{username}</span>
                </div>
            </div>
        </a>
    );
}