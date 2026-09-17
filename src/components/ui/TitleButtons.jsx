import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Boutons d'action d'un titre. Sur mobile, le libellé est masqué : aria-label et title gardent le bouton compréhensible.
export default function TitleButtons({ classes = 'flex flex-row gap-2 items-center', style = { fontSize: '0.9rem' }, fonctions = [] }) {
    const User = JSON.parse(localStorage.getItem('user'));
    return (
        <div className={`${fonctions.length === 0 || (User && fonctions.some(func => func.authorisation)) ? 'flex' : 'hidden'} ${classes}`} style={{ ...style }}>
            {fonctions.map((func) => {
                if (!((User && func.authorisation) || !func.connected)) return null;

                const label = func.title || func.tooltip?.text || undefined;
                const props = {
                    className: `flex flex-nowrap gap-2 items-center h-full ${func.class} rounded-2xl ${func.tooltip ? `tooltip tooltip-${func.tooltip.position}` : ''}`,
                    'data-tip': func.tooltip ? func.tooltip.text : '',
                    'aria-label': label,
                    title: func.tooltip ? undefined : label,
                    style: { color: func.color ? func.color : '', backgroundColor: func.background ? func.background : '', padding: '0.5rem', cursor: func.link || func.function ? 'pointer' : undefined },
                };
                const content = (
                    <>
                        {func.icon && <FontAwesomeIcon icon={func.icon} />}
                        {func.title && <span className='hidden sm:flex'>{func.title}</span>}
                    </>
                );

                if (func.link) return <a key={func.id} href={func.link} {...props}>{content}</a>;
                if (func.function) return <button key={func.id} type="button" onClick={func.function} {...props}>{content}</button>;
                return <div key={func.id} {...props}>{content}</div>;
            })}
        </div>
    );
}
