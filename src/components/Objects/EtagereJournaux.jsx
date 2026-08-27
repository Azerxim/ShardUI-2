import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './EtagereJournaux.css';

const INK_COLOR = '#2b2620';

export default function EtagereJournaux({ books, text = 'journal(s)', height = 12, width = 6, orientation = 'horizontal' }) {
    return (
        <>
            {/* Etagere avec des journaux cliquables */}
            <div className='flex w-full m-2 gap-3 flex-wrap items-end'>
                {books.map((book) => {
                    return (
                        <div
                            key={book.id}
                            className="journal-container relative group"
                        >
                            <a
                                href={book.link}
                                className={`journal-card cursor-pointer shadow-md transition-shadow duration-300 group-hover:shadow-xl group-hover:z-10 flex border-0 ${orientation === 'vertical' ? 'journal-scroll flex-col items-center justify-center' : 'journal-sheet flex-col'}`}
                                style={{ width: `${width}rem`, height: `${height}rem`, color: INK_COLOR }}
                            >
                                {orientation === 'vertical' ? (
                                    <>
                                        {/* Ruban qui ficelle le rouleau */}
                                        <div className="journal-ribbon w-full flex items-center justify-center gap-1 py-1">
                                            <FontAwesomeIcon icon={book.cover_icon} className="text-xs" style={{ color: '#f4ecd8' }} />
                                        </div>
                                        <div className="flex-1 flex items-center justify-center writing-mode-vertical-upward font-serif font-bold text-sm px-1 overflow-hidden">
                                            <span className="line-clamp-1 truncate">{book.title}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Tampon d'édition dans le coin */}
                                        <div className="journal-stamp absolute top-2 left-2 rounded-full flex items-center justify-center shadow">
                                            <FontAwesomeIcon icon={book.cover_icon} className="text-xs" style={{ color: '#f4ecd8' }} />
                                        </div>
                                        <div className="journal-masthead text-sm text-center font-serif font-black uppercase pt-2 pb-1 px-8 truncate">
                                            {book.title}
                                        </div>
                                        <div className="journal-columns flex-1 flex gap-3 px-3 pb-2 pt-1.5 overflow-hidden">
                                            <div className="flex-1 flex flex-col gap-1">
                                                <div className="journal-line" style={{ width: '90%' }} />
                                                <div className="journal-line" style={{ width: '70%' }} />
                                                <div className="journal-line" style={{ width: '85%' }} />
                                                <div className="journal-line" style={{ width: '50%' }} />
                                                <div className="journal-line" style={{ width: '65%' }} />
                                            </div>
                                            <div className="flex-1 flex flex-col gap-1">
                                                <div className="journal-line" style={{ width: '80%' }} />
                                                <div className="journal-line" style={{ width: '95%' }} />
                                                <div className="journal-line" style={{ width: '60%' }} />
                                            </div>
                                        </div>
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
