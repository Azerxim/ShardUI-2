import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import CopyBtn from './CopyBtn';

export default function Hero() {
    return (
        <div
            className="hero min-h-screen"
            style={{
                backgroundImage: "url(https://mbu.spinelle.eu/assets/images/serveur/mbu/baniere.png)",
            }}>
            <div className="hero-overlay"></div>
            <div className="hero-content text-neutral-content text-center">
                <div className="max-w-md">
                    <h1 className="mb-5 text-5xl font-bold">Nous rejoindre</h1>
                    {/* <p className="mb-5">
                        Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem
                        quasi. In deleniti eaque aut repudiandae et a id nisi.
                    </p> */}
                    <CopyBtn text="mbu.spinelle.eu" icon={<FontAwesomeIcon icon="fa-solid fa-network-wired" style={{ height: "16px" }} />} />
                </div>
            </div>
        </div>
    );
}