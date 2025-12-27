import { useState } from 'react';
import { useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getData } from '../Functions/getData';

import './ServerEtat.css';

// ===== Constantes =====
const link_network = 'https://mcapi.us/server/status?ip=spinelle-network.minesr.com';
const link_serv = 'https://mcapi.us/server/status?ip=mbu-tetrago.minesr.com';

// Default Skin
const MHF = ["MHF_Steve", "MHF_Alex"];

// Skin Render Type
const SRT = ["default", "crouching", "crossed", "criss_cross", "cheering", "relaxing", "trudging", "cowering", "pointing", "lunging", "archer", "kicking", "ultimate"];

let SRTsize = SRT.length

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export default function ServerEtat() {
    const [Playerlist, setPlayerlist] = useState(false);
    const [NetworkData, setNetworkData] = useState(null);
    const [ServerData, setServerData] = useState(null);

    useEffect(() => {
        setPlayerlist(false);
    }, []);

    useEffect(() => {
        fetch(link_network)
            .then((response) => response.json())
            .then((data) => {
                setNetworkData(data);
            })
            .catch((error) => {
                console.error('Error fetching network data:', error);
            });
    }, []);

    useEffect(() => {
        fetch(link_serv)
            .then((response) => response.json())
            .then((data) => {
                setServerData(data);
            })
            .catch((error) => {
                console.error('Error fetching server data:', error);
            }
            );
    }, []);

    const reloadComponent = () => {
        // Rafraîchir les données du réseau
        fetch(link_network)
            .then((response) => response.json())
            .then((data) => {
                setNetworkData(data);
            })
            .catch((error) => {
                console.error('Error fetching network data:', error);
            });

        // Rafraîchir les données du serveur
        fetch(link_serv)
            .then((response) => response.json())
            .then((data) => {
                setServerData(data);
            })
            .catch((error) => {
                console.error('Error fetching server data:', error);
            });
    };

    // console.log(NetworkData)
    // console.log(ServerData)

    const HTML_logo = (
        <a href='/' className="btn btn-ghost text-xl">
            <img src="/galaxie.png" alt="logo" width={24} height={24} />
            <span className="hidden sm:flex">Tetrago</span>
        </a>
    );

    if (!ServerData || !NetworkData) {
        return (
            <div className='fixed top-0 left-0 w-full z-990'>
                <div className='flex flex-row justify-between gap-2' style={{ padding: "0.5rem", backgroundImage: 'linear-gradient(to top, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.2))' }}>
                    <div className='flex gap-2'>
                        <div className='flex gap-2 items-center bg-base-200 shadow-xl' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }}>
                            <strong className='flex gap-1'><span className='hidden sm:flex'>Loading</span></strong>
                        </div>
                        <div className='loading loading-spinner loading-lg'></div>
                    </div>
                    <div>
                        {HTML_logo}
                    </div>
                    <div className='flex gap-2 items-center'>
                        <div className='btn flex gap-2 items-center bg-base-200 btn-ghost shadow-xl' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }} onClick={() => reloadComponent()}>
                            <FontAwesomeIcon icon="fa-solid fa-rotate-right" />
                        </div>
                        <div className='btn flex gap-2 items-center bg-base-200 btn-ghost shadow-xl' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }}>
                            <div className='hidden sm:flex'><FontAwesomeIcon icon="fa-solid fa-people-group" /></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='fixed top-0 left-0 w-full z-990'>
            <div className='flex flex-row justify-between gap-2' style={{ padding: "0.5rem", backgroundImage: 'linear-gradient(to top, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.2))' }}>
                <div className='flex gap-2'>
                    <div className='flex gap-2 items-center bg-base-200 shadow-xl' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }}>
                        <strong className='flex gap-1'><span className='hidden sm:flex'>MC</span><span>{ServerData.server.name}</span></strong>
                    </div>
                    {ServerData.online === true ?
                        <div className='flex gap-2 items-center bg-accent shadow-xl' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }}>
                            <div className='flex text-accent-content'><FontAwesomeIcon icon="fa-regular fa-circle-check" /></div>
                            <span className='hidden sm:flex text-accent-content'>En ligne</span>
                        </div>
                        :
                        <div className='flex gap-2 items-center bg-error shadow-xl' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }}>
                            <div className='flex text-error-content'><FontAwesomeIcon icon="fa-regular fa-circle-xmark" /></div>
                            <span className='hidden sm:flex text-error-content'>Éteint</span>
                        </div>
                    }
                </div>
                <div>
                    {HTML_logo}
                </div>
                <div className='flex gap-2 items-center'>
                    <div className='btn flex gap-2 items-center bg-base-200 btn-ghost shadow-xl' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }} onClick={() => reloadComponent()}>
                        <FontAwesomeIcon icon="fa-solid fa-rotate-right" />
                    </div>
                    <div className='btn flex gap-2 items-center bg-base-200 btn-ghost shadow-xl' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }} onClick={() => setPlayerlist(!Playerlist)}>
                        <div className='hidden sm:flex'><FontAwesomeIcon icon="fa-solid fa-people-group" /></div>
                        <div className='flex gap-1'>
                            <span id="player">{NetworkData.players.now}</span> / <span id="players">{NetworkData.players.max}</span>
                        </div>
                        {/* <span className="etat-info-hidden-mobile">
                            Joueurs
                        </span> */}
                    </div>
                </div>
            </div>
            {Playerlist && <div id='servplayers' className='flex gap-5 items-center flex-col bg-base-200 shadow-xl' style={{ borderRadius: "20px", paddingTop: "1rem", margin: "0.5rem 1rem" }}>
                <FontAwesomeIcon icon="fa-solid fa-people-group" />
                <div id="playerslist" className='flex gap-10 items-center bg-base-200' style={{ padding: "10px 30px" }}>
                    {ServerData.players.now == 0 && <div id="list" className='flex items-center'>Il n'y a personne !</div>}
                    {ServerData.players.sample.map((player, index) => {
                        // console.log(player, index)
                        return (
                            <div key={index} className='flex flex-col gap-2 items-center' style={{ margin: "0 10px" }}>
                                <img src={`https://starlightskins.lunareclipse.studio/render/${SRT[getRandomInt(SRTsize)]}/${player.name}/face/`} alt={`${player.name} head`} className='h-16' />
                                <span>{player.name}</span>
                            </div>
                        )
                    })}
                </div>
            </div>}
        </div>
    )
}