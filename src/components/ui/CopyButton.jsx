import { useState } from "react";

export default function CopyButton({ text, icon, classes = "btn btn-success", style = { padding: "24px", fontSize: "1.25rem" }, textCopy = text, tooltip = { text: "Copier", position: "bottom" }, onCopy = () => { } }) {
    // Message affiché après le clic : confirmation, ou texte à recopier à la main si le presse-papier est refusé
    const [notification, setNotification] = useState(null);

    const handleCopy = async () => {
        try {
            // Copy text to clipboard
            await navigator.clipboard.writeText(textCopy);
            setNotification("Copié dans le presse-papier !");
            onCopy();
        } catch (err) {
            console.error("Failed to copy text:", err);
            setNotification(`Copie impossible : recopiez ${textCopy}`);
        }
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        // shrink-0 / whitespace-nowrap : dans une rangée de boutons, le bloc d'infobulle ne doit pas se comprimer
        <div className={`tooltip tooltip-${tooltip.position} shrink-0`} data-tip={tooltip.text}>
            <a className={`${classes} whitespace-nowrap`} onClick={handleCopy} style={style}>
                {icon}
                <span>{text}</span>

                {/* Notification */}
                {notification && (
                    <div
                        className="bg-info rounded-xl shadow-xl"
                        style={{
                            position: "fixed",
                            bottom: "20px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            padding: "10px 20px",
                            zIndex: 1000,
                            transition: "opacity 0.3s ease-in-out",
                        }}
                    >
                        {notification}
                    </div>
                )}
            </a>
        </div>
    );
}