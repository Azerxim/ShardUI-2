import { GLOSSAIRE } from '@/config/glossaire';

// Glossaire du Codex : cible des liens « ? » de l'aide contextuelle (/codex#glossaire-<terme>)
export default function Glossaire() {
    return (
        <dl id="glossaire" className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full scroll-mt-24">
            {Object.entries(GLOSSAIRE).map(([id, { terme, definition }]) => (
                <div key={id} id={`glossaire-${id}`} className="bg-base-200 rounded-2xl p-4 scroll-mt-24 target:ring-2 target:ring-primary">
                    <dt className="font-semibold">{terme}</dt>
                    <dd className="text-sm opacity-80 mt-1">{definition}</dd>
                </div>
            ))}
        </dl>
    );
}
