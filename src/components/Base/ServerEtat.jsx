import { useState } from 'react';
import { useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getData } from './getData';

// ===== Constantes =====
const link_network = 'https://mcapi.us/server/status?ip=spinelle-network.minesr.com';
const link_serv = 'https://mcapi.us/server/status?ip=mbu-tetrago.minesr.com';

// Default Skin
const MHF = ["MHF_Steve", "MHF_Alex"];

// Skin Render Type
const SRT = ["default", "crouching", "crossed", "criss_cross", "cheering", "relaxing", "trudging", "cowering", "pointing", "lunging", "archer", "kicking", "ultimate"];

let SRTsize = SRT.length

const NetworkDataSrc = await getData(link_network)
const ServerDataSrc = await getData(link_serv)

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export default function ServerEtat() {
    const [Playerlist, setPlayerlist] = useState(false);
    const [NetworkData, setNetworkData] = useState(NetworkDataSrc);
    const [ServerData, setServerData] = useState(ServerDataSrc);

    useEffect(()=>{
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

    // console.log(NetworkData)
    // console.log(ServerData)
    return (
        <div>
            <div className='flex flex-row justify-between gap-2' style={{ margin: "10px 0" }}>
                <div className='flex gap-2'>
                    <div className='flex gap-2 items-center bg-[#f2f2f2]' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }}>
                        <strong>MC {ServerData.server.name}</strong>
                    </div>
                    { ServerData.online === true ?
                        <div className='flex gap-2 items-center bg-green-200' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }}>
                            <span>Serveur en ligne</span>
                        </div>
                        :
                        <div className='flex gap-2 items-center bg-red-200' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }}>
                            <span>Serveur éteint</span>
                        </div>
                    }
                </div>
                <div className='flex gap-2 items-center'>
                    {/* <div className='btn flex gap-2 items-center bg-[#f2f2f2] border-[#f2f2f2]' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }} onClick={() => reloadComponent()}>
                        <FontAwesomeIcon icon="fa-solid fa-rotate-right" />
                    </div> */}
                    <div className='btn flex gap-2 items-center bg-[#f2f2f2] border-[#f2f2f2]' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }} onClick={() => setPlayerlist(!Playerlist)}>
                        <FontAwesomeIcon icon="fa-solid fa-people-group" />
                        <div className='flex gap-1'>
                            <span id="player">{NetworkData.players.now}</span> / <span id="players">{NetworkData.players.max}</span>
                        </div>
                        <span className="etat-info-hidden-mobile">
                            Joueurs en ligne
                        </span>
                    </div>
                </div>
            </div>
            {Playerlist && <div id='servplayers' className='flex gap-5 items-center flex-col bg-[#f2f2f2]' style={{ borderRadius: "20px", width: "100%", paddingTop: "10px", marginBottom: "10px" }}>
                <FontAwesomeIcon icon="fa-solid fa-people-group" />
                <div id="playerslist" className='flex gap-10 items-center bg-[#f2f2f2]' style={{ padding: "10px 30px" }}>
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