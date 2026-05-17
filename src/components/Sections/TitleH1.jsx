import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function TitleH1({ text, btn = { text: '', link: '', icon: '', class: '', style: {} }, classes = 'bg-base-200', style = { width: '100%', fontWeight: 'bold', fontSize: '1.6rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', minHeight: '5rem' }, style_box = {} }) {
    const User = JSON.parse(localStorage.getItem('user'));
    return (
        <div className='flex flex-row gap-2 w-full' style={{ ...style_box }}>
            {btn.text && btn.link && (
                <div className='flex flex-row gap-2 items-center' style={{ fontSize: '0.9rem' }}>
                    <a href={btn.link} className={`flex flex-row flex-nowrap gap-5 items-center h-full ${btn.class}`} style={{ ...btn.style, padding: '1rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                        {btn.icon && <FontAwesomeIcon icon={btn.icon} />}
                        {btn.text && <span>{btn.text}</span>}
                    </a>
                </div>
            )}
            <div className={`flex flex-wrap gap-2 items-center h-full justify-start ${classes}`} style={{ ...style }}>
                <div className='flex flex-wrap gap-2 items-center'>
                    <h1>{text}</h1>
                </div>
            </div>
        </div>
    );
}