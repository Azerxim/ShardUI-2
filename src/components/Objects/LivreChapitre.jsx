import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TitleH2 from '../Objects/TitleH2';
import TitleH3 from '../Objects/TitleH3';
import DynamicModal from '../Modals/DynamicModal';
import MarkdownTextEditor from '../Objects/MarkdownTextEditor';

import { showModal } from '../Functions/showModal';
import { Config_Modal_Livre_Content_Local } from '../Modals/Config_Modal_Livre_Content_Local';
import { getApiURL } from "../../services/api";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";

export default function LivreChapitre({ livre, content, authorisation = false, updateLivreContent = () => { }, deleteLivreContent = () => { } }) {
    // console.log("LivreChapitre content:", content);
    const apiURL = getApiURL();
    const params = useParams();

    const content_fonctions = [
        { id: 0, title: "Modifier", icon: "fas fa-edit", class: "bg-base-250 hover:bg-base-300", connected: true, authorisation: authorisation, tooltip: { text: "Modifier ce chapitre", position: "bottom" }, function: () => showModal(Config_Modal_Livre_Content_Local, "edit", { id: content.id }) }
    ];

    const saveContent = async (data) => {
        // Logic to save the entry
        const config = Config_Modal_Livre_Content_Local;
        const token = localStorage.getItem("token");
        const api = config.api.update;;
        await fetch(api.url.replace("$id", params.id).replace("$local-id", data.id).replace("$apiURL", apiURL), {
            method: api.method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        })
            .then(async (response) => {
                if (!response.ok) {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: config.error["edit"],
                    });
                } else {
                    const data = await response.json();
                }
            })
            .catch((error) => {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: error.message,
                });
            });
    };

    const updateContent = (newContent) => {
        content.content = newContent;
        saveContent(content);
        updateLivreContent(content);
    };

    return (
        <>
            <div className="mb-4 bg-base-250 p-4 rounded-3xl shadow-md">
                <TitleH2 text={content.chapitre} classes="" fonctions={content_fonctions} />
                <DynamicModal config={Config_Modal_Livre_Content_Local} local={{ id: content.id }} mode="edit" onSubmit={(content) => { updateLivreContent(content) }} onDelete={() => { deleteLivreContent(content) }} />
                <MarkdownTextEditor value={content.content} authorisation={authorisation} onChange={(newValue) => { updateContent(newValue) }} />
            </div>
        </>
    );
}