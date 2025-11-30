import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function TitleH1({ text, btn = { text: '', link: '' }, classes = 'bg-base-200', style = { width: '100%', fontSize: '1.6rem', fontWeight: 'bold', padding: '0.5rem 1rem', borderRadius: '0.5rem' } }) {
    return (
        <div className={`flex gap-2 items-center flex-wrap ${classes}`} style={style}>
            {btn.text && btn.link && (
                <a href={btn.link} className={`btn btn-sm flex-wrap gap-2 items-center ${btn.class}`}>
                    {btn.icon && <FontAwesomeIcon icon={btn.icon} />}
                    {btn.text && <span>{btn.text}</span>}
                </a>
            )}
            <h1>{text}</h1>
        </div>
    );
}

