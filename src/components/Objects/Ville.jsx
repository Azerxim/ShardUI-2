import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MapEmbed from './MapEmbed';
import TitleButtons from '../Objects/TitleButtons';
import { showModal } from '../Functions/showModal';
import { Config_Modal_Ville } from '../Modals/Config_Modal_Ville';
import DynamicModal from '../Modals/DynamicModal';

export default function Ville({ info, dimensions, auth = false, updateVille = () => {}, deleteVille = () => {} }) {
    // console.log(info, dimensions)
    const dimension = dimensions ? dimensions.find(dim => dim.id === info.dimension_id) : null;

    const villes_fonctions = [
        // { id: 0, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Ville, "edit", { id: info.id }) },
        // { id: 1, title: "Transfert", icon: "fas fa-exchange-alt", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => {}}
    ];

    return (
        <>
        <div className="flex flex-row gap-2 w-full">
            <div className="flex flex-col gap-4 w-full bg-base-200 p-4 rounded-2xl">
                <div className="flex flex-row gap-2 w-full justify-between">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row gap-2 items-center font-bold text-2xl">
                            {info.is_capital ? (
                                <FontAwesomeIcon icon="fa-solid fa-archway" />
                            ) : (<FontAwesomeIcon icon="fa-solid fa-city" />)}
                            <span>{info.title}</span>
                        </div>
                        {info.founded_date ? (
                            <div className="flex flex-row gap-2 items-center">
                                <FontAwesomeIcon icon="fa-solid fa-calendar" />
                                <span>Fondation:</span>
                                <span>{info.founded_date ? new Date(info.founded_date).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : null}</span>
                            </div>
                        ) : null}
                        {info.population ? (
                            <div className="flex flex-row gap-2 items-center">
                                <span>{info.population}</span>
                            </div>
                        ) : null}
                        {info.description ? (
                            <div className="flex flex-row gap-2 items-center">
                                <span>{info.description}</span>
                            </div>
                        ) : null}
                    </div>
                    <div className="hidden lg:flex">
                        <MapEmbed
                            dimension={dimension}
                            width={400}
                            height={200}
                            embed="civilisations"
                            x={info.x}
                            z={info.z}
                            zoom={0}
                            title={`Carte de ${info.title}`}
                        />
                    </div>
                </div>
            </div>
            <TitleButtons classes = 'flex flex-col gap-2 items-center' fonctions={villes_fonctions} />
        </div>
        {/* <DynamicModal config={Config_Modal_Ville} mode="edit" local={{ id: info.id }} onSubmit={(ville) => { updateVille(ville) }} onDelete={ (ville) => { deleteVille(ville) }} /> */}
        </>
    );
}