import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function TitleButtons({ classes = 'flex flex-row gap-2 items-center', style = { fontSize: '0.9rem' }, authorisation = false, fonctions = [] }) {
    const User = JSON.parse(localStorage.getItem('user'));
    return (
        <div className={`${fonctions.length === 0 || (User && !fonctions.some(func => func.authorisation)) ? 'hidden' : 'flex'} ${classes}`} style={{ ...style }}>
            {fonctions.map((func) => (
                ((User && func.authorisation) || !func.connected) && func.link ? (
                    <a key={func.id} href={func.link} className={`flex flex-nowrap gap-2 items-center h-full ${func.class} rounded-2xl ${func.tooltip ? `tooltip tooltip-${func.tooltip.position}` : ''}`} data-tip={func.tooltip ? func.tooltip.text : ''} style={{ color: func.color ? func.color : '', backgroundColor: func.background ? func.background : '', padding: '0.5rem', cursor: 'pointer' }}>
                        {func.icon && <FontAwesomeIcon icon={func.icon} />}
                        {func.title && <span className='hidden sm:flex'>{func.title}</span>}
                    </a>
                ) : (
                    ((User && func.authorisation) || !func.connected) && func.function ? (
                        <button key={func.id} onClick={func.function} className={`flex flex-nowrap gap-2 items-center h-full ${func.class} rounded-2xl ${func.tooltip ? `tooltip tooltip-${func.tooltip.position}` : ''}`} data-tip={func.tooltip ? func.tooltip.text : ''} style={{ color: func.color ? func.color : '', backgroundColor: func.background ? func.background : '', padding: '0.5rem', cursor: 'pointer' }}>
                            {func.icon && <FontAwesomeIcon icon={func.icon} />}
                            {func.title && <span className='hidden sm:flex'>{func.title}</span>}
                        </button>
                    ) : (
                        ((User && func.authorisation) || !func.connected) && (
                            <div key={func.id} className={`flex flex-nowrap gap-2 items-center h-full ${func.class} rounded-2xl ${func.tooltip ? `tooltip tooltip-${func.tooltip.position}` : ''}`} data-tip={func.tooltip ? func.tooltip.text : ''} style={{ color: func.color ? func.color : '', backgroundColor: func.background ? func.background : '', padding: '0.5rem' }}>
                                {func.icon && <FontAwesomeIcon icon={func.icon} />}
                                {func.title && <span className='hidden sm:flex'>{func.title}</span>}
                            </div>
                        )
                    )
                )
            ))}
        </div>
    );
}