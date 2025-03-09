'use client'

import { useState } from "react";

export default function CopyBtn({ text, icon }) {
    // Initial text
    const [textToCopy, setTextToCopy] = useState(text); 
    // State to manage notification visibility
    const [showNotification, setShowNotification] = useState(false); 

    const handleCopy = async () => {
        try {
            // Copy text to clipboard
            await navigator.clipboard.writeText(textToCopy);
            setShowNotification(true); // Show notification
            // Hide notification after 3 seconds
            setTimeout(() => setShowNotification(false), 3000); 
        } catch (err) {
            console.error("Failed to copy text:", err);
        }
    };

    return (
        <div>
            <button className="btn btn-success" onClick={handleCopy} style={{ padding: "24px", fontSize: "1.25rem" }}>
                {icon}
                <span>{text}</span>
            </button>

            {/* Notification */}
            {showNotification && (
                <div
                style={{
                    position: "fixed",
                    bottom: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#333",
                    color: "#fff",
                    padding: "10px 20px",
                    borderRadius: "4px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    zIndex: 1000,
                    transition: "opacity 0.3s ease-in-out",
                }}
                >
                Copié dans le presse-papier !
                </div>
            )}
        </div>
    );
}