import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function TitleH2({ text, icon = '', classes = 'bg-base-200', style = { width: '100%', fontSize: '1.2rem', padding: '0.5rem 1rem', borderRadius: '0.5rem' }, style_add = {}, fonctions = [] }) {
    const User = JSON.parse(localStorage.getItem('user'));
    return (
        <div className={`flex flex-wrap gap-2 items-center ${fonctions.length === 0 ? 'justify-start' : 'justify-between'} ${classes}`} style={{ ...style, ...style_add }}>
            <div className='flex flex-wrap gap-2 items-center'>
                {icon && <FontAwesomeIcon icon={icon} />}
                <h2>{text}</h2>
            </div>
            <div className='flex flex-row gap-2 items-center' style={{ fontSize: '0.9rem' }}>
                {fonctions.map((func) => (
                    (User || !func.connected) && func.link ? (
                        <a key={func.id} href={func.link} className={`flex flex-wrap gap-2 items-center ${func.class}`} style={{ color: func.color ? func.color : '', backgroundColor: func.background ? func.background : '', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                            {func.icon && <FontAwesomeIcon icon={func.icon} />}
                            {func.title && <span>{func.title}</span>}
                        </a>
                    ) : (
                        (User || !func.connected) && func.function ? (
                            <button key={func.id} onClick={func.function} className={`flex flex-wrap gap-2 items-center ${func.class}`} style={{ color: func.color ? func.color : '', backgroundColor: func.background ? func.background : '', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                {func.icon && <FontAwesomeIcon icon={func.icon} />}
                                {func.title && <span>{func.title}</span>}
                            </button>
                        ) : (
                            (User || !func.connected) && (
                                <div key={func.id} className={`flex flex-wrap gap-2 items-center ${func.class}`} style={{ color: func.color ? func.color : '', backgroundColor: func.background ? func.background : '', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                    {func.icon && <FontAwesomeIcon icon={func.icon} />}
                                    {func.title && <span>{func.title}</span>}
                                </div>
                            )
                        )
                    )
                ))}
            </div>
        </div>
    );
}