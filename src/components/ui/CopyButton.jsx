import { useState } from "react";

export default function CopyButton({ text, icon, classes = "btn btn-success", style = { padding: "24px", fontSize: "1.25rem" }, textCopy = text, tooltip = { text: "Copier", position: "bottom" } }) {
    // State to manage notification visibility
    const [showNotification, setShowNotification] = useState(false);

    const handleCopy = async () => {
        try {
            // Copy text to clipboard
            await navigator.clipboard.writeText(textCopy);
            setShowNotification(true); // Show notification
            // Hide notification after 3 seconds
            setTimeout(() => setShowNotification(false), 3000);
        } catch (err) {
            console.error("Failed to copy text:", err);
        }
    };

    return (
        // shrink-0 / whitespace-nowrap : dans une rangée de boutons, le bloc d'infobulle ne doit pas se comprimer
        <div className={`tooltip tooltip-${tooltip.position} shrink-0`} data-tip={tooltip.text}>
            <a className={`${classes} whitespace-nowrap`} onClick={handleCopy} style={style}>
                {icon}
                <span>{text}</span>

                {/* Notification */}
                {showNotification && (
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
                        Copié dans le presse-papier !
                    </div>
                )}
            </a>
        </div>
    );
}