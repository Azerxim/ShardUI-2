import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Traits de l'arborescence (couleur commune)
const LINE = "before:content-[''] before:absolute before:left-0 before:border-l-2 before:border-primary/50";

// Élément en tête (dirigeant), puis ses éléments rattachés en arborescence : la ligne verticale
// part de la carte parente et s'arrête au trait horizontal du dernier élément.
// label : { icon, text } ; items : [{ key, node }]
export default function ListCardTree({ parent, label, items }) {
    return (
        <div className="flex flex-col w-full min-w-0">
            {parent}
            <div className="ml-5 sm:ml-9 flex flex-col gap-3">
                <span className={`relative flex flex-row items-center gap-2 pl-5 sm:pl-8 pt-3 text-sm opacity-70 ${LINE} before:top-0 before:bottom-0`}>
                    <FontAwesomeIcon icon={label.icon} />
                    <span>{label.text}</span>
                </span>
                {items.map(({ key, node }, index) => (
                    <div
                        key={key}
                        className={`relative min-w-0 pl-5 sm:pl-8 ${LINE} before:-top-3 ${index === items.length - 1 ? "before:h-[calc(50%+0.75rem)]" : "before:bottom-0"} after:content-[''] after:absolute after:left-0 after:top-1/2 after:w-5 sm:after:w-8 after:border-t-2 after:border-primary/50`}
                    >
                        {node}
                    </div>
                ))}
            </div>
        </div>
    );
}
