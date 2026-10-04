import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Fil d'Ariane des pages de détail : où l'on est, et un clic pour remonter d'un ou plusieurs niveaux.
// items : [{ label, href }] ; le dernier élément (la page courante) n'a pas de lien.
export default function FilAriane({ items = [] }) {
    const visibles = items.filter((item) => item?.label);
    if (visibles.length < 2) return null;
    return (
        // flex-wrap et libellés tronqués : un titre long ne doit pas élargir la page sur téléphone
        <nav aria-label="Fil d'Ariane" className="breadcrumbs text-sm px-2 py-0 w-full min-w-0">
            <ul className="flex-wrap">
                <li>
                    <a href="/" aria-label="Accueil" className="opacity-70 hover:opacity-100">
                        <FontAwesomeIcon icon="fa-solid fa-house" />
                    </a>
                </li>
                {visibles.map((item, index) => {
                    const derniere = index === visibles.length - 1;
                    return (
                        <li key={`${item.label}-${index}`}>
                            {item.href && !derniere
                                ? <a href={item.href} className="opacity-70 hover:opacity-100"><span className="inline-block truncate max-w-[12rem] sm:max-w-xs align-bottom">{item.label}</span></a>
                                : <span aria-current={derniere ? 'page' : undefined} className="font-semibold inline-block truncate max-w-[16rem] sm:max-w-md align-bottom">{item.label}</span>}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
