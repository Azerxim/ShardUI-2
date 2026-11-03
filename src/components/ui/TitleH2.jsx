import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TitleButtons from '@/components/ui/TitleButtons';
import Aide from '@/components/aide/Aide';

// aide : clé du glossaire (config/glossaire.js) expliquée par un « ? » à côté du titre
// Charte « Chancellerie » : titre souligné d'un filet, sans bandeau ; classes et style restent surchargeables.
// Dans le corps d'une fiche (classe .fiche, App.css), l'icône est masquée et les sections plus espacées.

export default function TitleH2({ text, icon = '', classes = 'border-b border-base-300', style = { width: '100%', fontSize: '1.375rem', padding: '0.25rem 0.25rem 0.5rem' }, style_box = {}, fonctions = [], aide = null }) {
    return (
        <div className='titre-section flex flex-row items-end gap-2 w-full mt-4' style={{ ...style_box }}>
            <div className={`flex flex-wrap gap-2 items-center h-full ${fonctions.length === 0 ? 'justify-start' : 'justify-between'} ${classes} rounded-2xl`} style={{ ...style }}>
                <div className='flex flex-wrap gap-2 items-center'>
                    {icon && <FontAwesomeIcon icon={icon} className="titre-icone" />}
                    {/* data-sommaire : entrée du sommaire des fiches (SommaireFiche) */}
                    <h2 data-sommaire="">{text}</h2>
                    {aide && <Aide terme={aide} />}
                </div>
            </div>
            <TitleButtons fonctions={fonctions} />
        </div>
    );
}