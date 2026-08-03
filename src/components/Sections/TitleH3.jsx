import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TitreButtons from './TitleButtons';

export default function TitleH3({ text, icon = '', classes = 'bg-base-200', style = { width: '100%', fontSize: '1.2rem', padding: '0.5rem 1rem' }, style_box = {}, fonctions = [] }) {
    const User = JSON.parse(localStorage.getItem('user'));
    return (
        <div className='flex flex-col gap-2 w-full' style={{ ...style_box }}>
            <div className={`flex flex-wrap gap-2 items-center h-full ${fonctions.length === 0 ? 'justify-start' : 'justify-between'} ${classes} rounded-2xl`} style={{ ...style }}>
                <div className='flex flex-wrap gap-2 items-center'>
                    {icon && <FontAwesomeIcon icon={icon} />}
                    <h3>{text}</h3>
                </div>
            </div>
            <TitreButtons fonctions={fonctions} />
        </div>
    );
}