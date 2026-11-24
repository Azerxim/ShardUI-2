import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ANCRES, discordVersMarkdown } from "@/utils/discordMarkdown";
import remarkSautsDeLigne from "@/utils/remarkSautsDeLigne";

// Spoiler Discord : texte masqué, révélé au clic (ou au clavier)
function Spoiler({ children }) {
    const [visible, setVisible] = useState(false);
    return (
        <span
            role="button"
            tabIndex={visible ? -1 : 0}
            aria-label={visible ? undefined : "Spoiler : cliquer pour révéler"}
            title={visible ? undefined : "Cliquer pour révéler"}
            className={`rounded px-0.5 transition-colors ${visible ? "bg-base-300" : "bg-base-content text-transparent cursor-pointer select-none"}`}
            onClick={() => setVisible(true)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setVisible(true);
                }
            }}
        >
            {children}
        </span>
    );
}

/* eslint-disable no-unused-vars -- `node` est retiré pour ne pas finir en attribut du DOM */
// Tailles resserrées : un message de journal se lit comme une conversation, pas comme une page
const composants = {
    h1: ({ node, ...props }) => <h3 className="text-xl font-bold mt-2 mb-1" {...props} />,
    h2: ({ node, ...props }) => <h4 className="text-lg font-bold mt-2 mb-1" {...props} />,
    h3: ({ node, ...props }) => <h5 className="text-base font-bold mt-2 mb-1" {...props} />,
    p: ({ node, ...props }) => <p className="leading-relaxed mb-2 last:mb-0" {...props} />,
    ul: ({ node, className, ...props }) => <ul className={`list-disc pl-5 mb-2 flex flex-col gap-0.5 ${className || ""}`} {...props} />,
    ol: ({ node, className, ...props }) => <ol className={`list-decimal pl-5 mb-2 flex flex-col gap-0.5 ${className || ""}`} {...props} />,
    li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-base-300 pl-3 my-1 text-base-content/90" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
    em: ({ node, ...props }) => <em className="italic" {...props} />,
    del: ({ node, ...props }) => <del className="opacity-80" {...props} />,
    hr: ({ node, ...props }) => <hr className="my-2 border-base-300" {...props} />,
    pre: ({ node, ...props }) => <pre className="bg-base-200 rounded-2xl p-3 overflow-x-auto my-2 text-sm whitespace-pre" {...props} />,
    code: ({ node, className, ...props }) => {
        const enLigne = node?.position ? node.position.start.line === node.position.end.line : true;
        return enLigne && !className
            ? <code className="bg-base-200 rounded px-1 py-0.5 text-[0.9em] font-mono" {...props} />
            : <code className={`font-mono ${className || ""}`} {...props} />;
    },
    table: ({ node, ...props }) => <div className="overflow-x-auto my-2"><table className="table table-sm" {...props} /></div>,
    img: ({ node, title, alt, ...props }) => (title === "emoji"
        ? <img alt={alt} title={alt} className="inline-block h-[1.375em] w-auto align-text-bottom" loading="lazy" {...props} />
        : <img alt={alt} title={title} className="max-w-full rounded-xl my-1" loading="lazy" {...props} />),
    // Ancres réservées : syntaxes propres à Discord (voir utils/discordMarkdown)
    a: ({ node, href, children, ...props }) => {
        if (href === ANCRES.spoiler) return <Spoiler>{children}</Spoiler>;
        if (href === ANCRES.souligne) return <u>{children}</u>;
        if (href === ANCRES.sousTexte) return <small className="block text-xs opacity-60">{children}</small>;
        if (href === ANCRES.mention) return <span className="bg-primary/15 text-primary rounded px-1 font-medium">{children}</span>;
        return <a href={href} className="link link-primary break-words" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
    },
};
/* eslint-enable no-unused-vars */

// Retours à la ligne déjà convertis par discordVersMarkdown : seule la balise <br> est ajoutée
const remarkPlugins = [remarkGfm, remarkSautsDeLigne];

// Message de journal (contenu Discord) affiché en Markdown ; le HTML brut éventuel est ignoré, sauf <br>
export default function DiscordMarkdown({ texte, className = "" }) {
    if (!texte) return null;
    return (
        <div className={`break-words ${className}`}>
            <ReactMarkdown remarkPlugins={remarkPlugins} components={composants}>
                {discordVersMarkdown(texte)}
            </ReactMarkdown>
        </div>
    );
}
