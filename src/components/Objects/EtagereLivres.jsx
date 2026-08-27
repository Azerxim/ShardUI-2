import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './EtagereLivres.css';

// Retourne blanc ou noir selon la luminosité perçue de la couleur de fond (formule YIQ)
function getContrastTextColor(bgColor) {
    if (!bgColor) return '#ffffff';
    let r, g, b;
    if (bgColor.startsWith('#')) {
        let hex = bgColor.slice(1);
        if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
        const bigint = parseInt(hex, 16);
        r = (bigint >> 16) & 255;
        g = (bigint >> 8) & 255;
        b = bigint & 255;
    } else {
        const match = bgColor.match(/\d+/g);
        if (!match || match.length < 3) return '#ffffff';
        [r, g, b] = match.map(Number);
    }
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
}

export default function EtagereLivres({ books, text = 'livre(s)', height = 12, width = 4, orientation = 'vertical' }) {
    return (
        <>
            {/* Etagere avec des livres cliquable */}
            <div className='flex w-full m-2 gap-3 flex-wrap items-end'>
                {books.map((book) => {
                    const textColor = getContrastTextColor(book.cover_color);
                    return (
                        <div
                            key={book.id}
                            className="book-container relative group"
                        >
                            <a
                                href={book.link}
                                className={`book-spine cursor-pointer shadow-md transition-shadow duration-300 group-hover:shadow-xl group-hover:z-10 flex border-0 ${orientation === 'vertical' ? 'book-spine-vertical rounded-t-sm rounded-b-md flex-col' : 'book-spine-horizontal rounded-l-sm rounded-r-md flex-row items-center gap-2'}`}
                                style={{ backgroundColor: book.cover_color, width: `${width}rem`, height: `${height}rem` }}
                            >
                                {orientation === 'vertical' ? (
                                    <>
                                        <div className="book-pages-top" />
                                        <div className="flex-1 flex items-center p-2 font-bold text-sm text-center overflow-hidden writing-mode-vertical-upward" style={{ color: textColor }}>
                                            <span className="line-clamp-1 truncate">{book.title}</span>
                                        </div>
                                        <div className="pb-2 pt-1 flex justify-center">
                                            <FontAwesomeIcon icon={book.cover_icon} className="text-lg" style={{ color: textColor }} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="pl-2 flex items-center">
                                            <FontAwesomeIcon icon={book.cover_icon} className="text-lg" style={{ color: textColor }} />
                                        </div>
                                        <div className="flex-1 flex items-center p-2 font-bold text-sm text-center overflow-hidden" style={{ color: textColor }}>
                                            <span className="line-clamp-1 truncate">{book.title}</span>
                                        </div>
                                        <div className="book-pages-side" />
                                    </>
                                )}
                            </a>
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap bg-gray-800 text-white px-2 py-1 rounded-3xl text-xs">
                                {book.description || 'Pas de description disponible.'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
