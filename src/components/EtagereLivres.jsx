import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './EtagereLivres.css';

export default function EtagereLivres({ books, text = 'livre(s)', height = 12, width = 4, orientation = 'vertical' }) {
    return (
        <>
            {/* Etagere avec des livres cliquable */}
            <div className='flex w-full m-2 gap-2 flex-wrap'>
                {books.map((book) => (
                    <div
                        key={book.id}
                        className="book-container relative group"
                    >
                        <a
                            href={book.link}
                            className={`rounded cursor-pointer shadow-md transition-all duration-300 group-hover:scale-110 group-hover:z-10 flex border-2 border-white ${orientation === 'vertical' ? 'flex-col' : 'flex-row items-center gap-2'}`}
                            style={{ backgroundColor: book.cover_color, width: `${width}rem`, height: `${height}rem` }}
                        >
                            {orientation === 'vertical' ? (
                                <>
                                    <div className="flex-1 flex items-center p-2 text-white font-bold text-sm text-center overflow-hidden writing-mode-vertical-upward">
                                        <span className="line-clamp-1 truncate">{book.title}</span>
                                    </div>
                                    <div className="pb-2 pt-1 flex justify-center">
                                        <FontAwesomeIcon icon={book.cover_icon} className="text-white text-lg" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="pl-2 flex items-center">
                                        <FontAwesomeIcon icon={book.cover_icon} className="text-white text-lg" />
                                    </div>
                                    <div className="flex-1 flex items-center p-2 text-white font-bold text-sm text-center overflow-hidden">
                                        <span className="line-clamp-1 truncate">{book.title}</span>
                                    </div>
                                </>
                            )}
                        </a>
                        <div className="absolute bottom-full mb-3.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap bg-gray-800 text-white px-2 py-1 rounded text-xs">
                            {book.title}
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ width: '100%'}}>
                {books.length > 0 && (
                    <i>{books.length} {text} disponible(s).</i>
                )}
            </div>
        </>
    );
}