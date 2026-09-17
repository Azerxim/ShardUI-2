import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from "sweetalert2";

import DynamicModal from '@/components/modals/DynamicModal';
import MarkdownTextEditor from '@/components/ui/MarkdownTextEditor';
import { showModal } from '@/utils/showModal';
import { livreContentLocalModal } from '@/config/modals/livre-content-local';
import { getApiURL } from "@/services/api";

// Chapitre d'un livre : titre numéroté et contenu Markdown, modifiable directement par les ayants droit.
// updateLivreContent reçoit { content: chapitre } (même format que la réponse de l'API), deleteLivreContent le chapitre.
export default function LivreChapitre({ content, index = 0, authorisation = false, updateLivreContent = () => { }, deleteLivreContent = () => { } }) {
    const saveContent = async (chapitre) => {
        const config = livreContentLocalModal;
        const api = config.api.update;
        try {
            const response = await fetch(api.url.replace("$local-id", chapitre.id).replace("$apiURL", getApiURL()), {
                method: api.method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(chapitre),
            });
            if (!response.ok) {
                Swal.fire({ icon: "error", title: "Oops...", text: config.error.edit });
            }
        } catch (error) {
            Swal.fire({ icon: "error", title: "Oops...", text: error.message });
        }
    };

    const updateContent = (newContent) => {
        const chapitre = { ...content, content: newContent };
        updateLivreContent({ content: chapitre });
        saveContent(chapitre);
    };

    return (
        <section id={`chapitre-${content.id ?? index}`} className="flex flex-col gap-3 w-full bg-base-200 p-4 sm:p-6 rounded-3xl scroll-mt-24">
            <div className="flex flex-row items-start gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-base-300 font-bold tabular-nums shrink-0">
                    {index + 1}
                </span>
                <h2 className="flex-1 min-w-0 text-xl font-bold break-words pt-1">{content.chapitre}</h2>
                {authorisation ? (
                    <button
                        type="button"
                        className="btn btn-sm btn-ghost btn-circle tooltip tooltip-left"
                        data-tip="Modifier ce chapitre"
                        onClick={() => showModal(livreContentLocalModal, "edit", { id: content.id })}
                    >
                        <FontAwesomeIcon icon="fa-solid fa-pen" />
                    </button>
                ) : null}
            </div>

            <MarkdownTextEditor value={content.content} authorisation={authorisation} onChange={updateContent} />

            {authorisation ? (
                <DynamicModal
                    config={livreContentLocalModal}
                    local={{ id: content.id }}
                    mode="edit"
                    onSubmit={updateLivreContent}
                    onDelete={() => deleteLivreContent(content)}
                />
            ) : null}
        </section>
    );
}
