import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './EtagereLivres.css';
import { getContrastTextColor } from '../Functions/contrastColor';

export default function EtagereLivres({ books, height = 12, width = 4, orientation = 'vertical' }) {
    return (
        <>
            {/* Etagere avec des livres cliquable */}
            <div className='flex w-full my-2 gap-3 flex-wrap items-end'>
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
                            {/* Infobulle au survol : absente sur écran tactile, largeur limitée pour ne pas sortir de l'écran */}
                            <div className="hidden sm:block absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none w-max max-w-[min(20rem,90vw)] text-center bg-gray-800 text-white px-3 py-1 rounded-2xl text-xs">
                                {book.description || 'Pas de description disponible.'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
