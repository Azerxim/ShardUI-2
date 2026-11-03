import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TitleButtons from '@/components/ui/TitleButtons';

// Charte « Chancellerie » : sous-titre sans bandeau, sous le filet du TitleH2 ; classes et style restent surchargeables.
export default function TitleH3({ text, icon = '', classes = '', style = { width: '100%', fontSize: '1.125rem', padding: '0.25rem' }, style_box = {}, fonctions = [] }) {
    return (
        <div className='flex flex-col gap-2 w-full' style={{ ...style_box }}>
            <div className={`flex flex-wrap gap-2 items-center h-full ${fonctions.length === 0 ? 'justify-start' : 'justify-between'} ${classes} rounded-2xl`} style={{ ...style }}>
                <div className='flex flex-wrap gap-2 items-center'>
                    {icon && <FontAwesomeIcon icon={icon} />}
                    <h3>{text}</h3>
                </div>
            </div>
            <TitleButtons fonctions={fonctions} />
        </div>
    );
}