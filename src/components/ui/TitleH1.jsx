import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TitleButtons from '@/components/ui/TitleButtons';
import DynamicIcon from '@/components/ui/DynamicIcon';
import FilAriane from '@/components/ui/FilAriane';

// iconFallback : icône affichée si `icon` (qui peut venir des données, ex. religion) est introuvable
// ariane : fil d'Ariane affiché au-dessus du titre, [{ label, href }] jusqu'à la page courante
export default function TitleH1({ text, icon = '', iconFallback, btn = { text: '', link: '', icon: '', class: '', style: {} }, classes = 'bg-base-200', style = { width: '100%', fontWeight: 'bold', fontSize: '1.6rem', padding: '0.5rem 1rem', minHeight: '5rem' }, style_box = {}, fonctions = [], ariane = null }) {
    const titre = (
        <div className='flex flex-row gap-2 w-full' style={{ ...style_box }}>
            {btn.text && btn.link && (
                <div className='flex flex-row gap-2 items-center' style={{ fontSize: '0.9rem' }}>
                    <a href={btn.link} aria-label={btn.text} title={btn.text} className={`flex flex-row flex-nowrap gap-5 items-center h-full ${btn.class} rounded-2xl`} style={{ ...btn.style, padding: '1rem', cursor: 'pointer' }}>
                        {btn.icon && <FontAwesomeIcon icon={btn.icon} />}
                        {btn.text && <span className='hidden sm:flex'>{btn.text}</span>}
                    </a>
                </div>
            )}
            <div className={`flex flex-wrap gap-2 items-center h-full justify-start rounded-2xl ${classes}`} style={{ ...style }}>
                <div className='flex flex-wrap gap-2 items-center'>
                    {icon && <DynamicIcon icon={icon} fallback={iconFallback} />}
                    <h1>{text}</h1>
                </div>
            </div>
            <TitleButtons fonctions={fonctions} />
        </div>
    );
    if (!ariane) return titre;
    return (
        <div className='flex flex-col gap-1 w-full min-w-0'>
            <FilAriane items={ariane} />
            {titre}
        </div>
    );
}
