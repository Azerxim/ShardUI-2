import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TitleButtons from '@/components/ui/TitleButtons';
import Aide from '@/components/aide/Aide';

// aide : clé du glossaire (config/glossaire.js) expliquée par un « ? » à côté du titre

export default function TitleH2({ text, icon = '', classes = 'bg-base-200', style = { width: '100%', fontSize: '1.2rem', padding: '0.5rem 1rem' }, style_box = {}, fonctions = [], aide = null }) {
    const User = JSON.parse(localStorage.getItem('user'));
    return (
        <div className='flex flex-row gap-2 w-full' style={{ ...style_box }}>
            <div className={`flex flex-wrap gap-2 items-center h-full ${fonctions.length === 0 ? 'justify-start' : 'justify-between'} ${classes} rounded-2xl`} style={{ ...style }}>
                <div className='flex flex-wrap gap-2 items-center'>
                    {icon && <FontAwesomeIcon icon={icon} />}
                    {/* data-sommaire : entrée du sommaire des fiches (SommaireFiche) */}
                    <h2 data-sommaire="">{text}</h2>
                    {aide && <Aide terme={aide} />}
                </div>
            </div>
            <TitleButtons fonctions={fonctions} />
        </div>
    );
}