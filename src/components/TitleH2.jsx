import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function TitleH2({ text, icon = '', classes = 'bg-base-200', style = {width: '100%', fontSize: '1.2rem', padding: '0.5rem 1rem', borderRadius: '0.5rem'}, fonctions = [] }) {
    const User = JSON.parse(localStorage.getItem('user'));
    return (
        <div className={`flex gap-2 ${fonctions.length === 0 ? 'justify-start' : 'justify-between'} ${classes}`} style={style}>
            <div className='flex gap-2 items-center'>
                {icon && <FontAwesomeIcon icon={icon} />}
                <h2>{text}</h2>
            </div>
            {User ? (
            <div style={{ fontSize: '0.9rem' }}>
                {fonctions.map((func) => (
                    func.link ? (
                        <a key={func.id} href={func.link} className='flex gap-2 items-center' style={{color: func.color ? func.color : 'inherit', backgroundColor: func.background ? func.background : 'inherit', padding: '0.2rem', borderRadius: '0.5rem', cursor: 'pointer'}}>
                            <FontAwesomeIcon icon={func.icon} />
                            <span>{func.title}</span>
                        </a>
                    ) : (
                        func.function ? (
                            <button key={func.id} onClick={func.function} className='flex gap-2 items-center' style={{color: func.color ? func.color : 'inherit', backgroundColor: func.background ? func.background : 'inherit', padding: '0.2rem', borderRadius: '0.5rem', cursor: 'pointer'}}>
                                <FontAwesomeIcon icon={func.icon} />
                                <span>{func.title}</span>
                            </button>
                        ) : (
                            <div key={func.id} className='flex gap-2 items-center' style={{color: func.color ? func.color : 'inherit', backgroundColor: func.background ? func.background : 'inherit', padding: '0.2rem', borderRadius: '0.5rem'}}>
                                <FontAwesomeIcon icon={func.icon} />
                                <span>{func.title}</span>
                            </div>
                        )
                    )
                ))}
            </div>
            ) : null}
        </div>
    );
}