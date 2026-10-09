import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/* eslint-disable no-unused-vars -- `node` must be destructured out so it isn't spread onto the DOM element */
const markdownComponents = {
    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-4 mb-2" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-3 mb-2" {...props} />,
    h4: ({ node, ...props }) => <h4 className="text-base font-semibold mt-2 mb-1" {...props} />,
    h5: ({ node, ...props }) => <h5 className="text-base font-semibold mt-2 mb-1" {...props} />,
    h6: ({ node, ...props }) => <h6 className="text-base font-semibold mt-2 mb-1" {...props} />,
    p: ({ node, ...props }) => <p className="mb-3 leading-relaxed last:mb-0" {...props} />,
    // className de remark-gfm (contains-task-list, task-list-item) ajoutée aux nôtres, sans les remplacer
    ul: ({ node, className, ...props }) => <ul className={`list-disc list-inside mb-3 flex flex-col gap-1 ${className || ''}`} {...props} />,
    ol: ({ node, className, ...props }) => <ol className={`list-decimal list-inside mb-3 flex flex-col gap-1 ${className || ''}`} {...props} />,
    li: ({ node, className, ...props }) => <li className={`leading-relaxed ${className === 'task-list-item' ? 'list-none' : ''}`} {...props} />,
    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/50 pl-4 italic text-base-content/80 my-3" {...props} />,
    a: ({ node, ...props }) => <a className="link link-primary" target="_blank" rel="noopener noreferrer" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
    em: ({ node, ...props }) => <em className="italic" {...props} />,
    hr: ({ node, ...props }) => <hr className="my-4 border-base-300" {...props} />,
    pre: ({ node, ...props }) => <pre className="bg-base-300 rounded-3xl p-4 overflow-x-auto my-3 text-sm" {...props} />,
    code: ({ node, className, ...props }) => {
        const isInline = node?.position ? node.position.start.line === node.position.end.line : true;
        return isInline
            ? <code className="bg-base-300 rounded-3xl px-1.5 py-0.5 text-sm font-mono" {...props} />
            : <code className={`font-mono ${className || ''}`} {...props} />;
    },
    table: ({ node, ...props }) => <div className="overflow-x-auto my-3"><table className="table table-sm" {...props} /></div>,
    input: ({ node, ...props }) => <input className="checkbox checkbox-xs align-middle mr-1" disabled {...props} />,
};
/* eslint-enable no-unused-vars */

function MarkdownContent({ text, className = '', style = {} }) {
    return (
        <div className={className} style={style}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {text}
            </ReactMarkdown>
        </div>
    );
}

// label : texte affiché à la place d'une icône (titres) ; groupes séparés par un trait vertical
const TOOLBAR_GROUPS = [
    [
        { id: 'bold', icon: 'fas fa-bold', tip: 'Gras (Ctrl+B)' },
        { id: 'italic', icon: 'fas fa-italic', tip: 'Italique (Ctrl+I)' },
        { id: 'strike', icon: 'fas fa-strikethrough', tip: 'Barré' },
    ],
    [
        { id: 'h1', label: 'H1', tip: 'Titre' },
        { id: 'h2', label: 'H2', tip: 'Sous-titre' },
        { id: 'h3', label: 'H3', tip: 'Intertitre' },
    ],
    [
        { id: 'quote', icon: 'fas fa-quote-left', tip: 'Citation' },
        { id: 'ul', icon: 'fas fa-list-ul', tip: 'Liste à puces' },
        { id: 'ol', icon: 'fas fa-list-ol', tip: 'Liste numérotée' },
        { id: 'task', icon: 'fas fa-square-check', tip: 'Liste de tâches' },
    ],
    [
        { id: 'link', icon: 'fas fa-link', tip: 'Lien (Ctrl+K)' },
        { id: 'image', icon: 'fas fa-image', tip: 'Image (adresse)' },
        { id: 'table', icon: 'fas fa-table', tip: 'Tableau' },
    ],
    [
        { id: 'code', icon: 'fas fa-code', tip: 'Code' },
        { id: 'codeblock', icon: 'fas fa-file-code', tip: 'Bloc de code' },
        { id: 'hr', icon: 'fas fa-minus', tip: 'Séparateur' },
    ],
];

const TABLE_TEMPLATE = '\n| Colonne 1 | Colonne 2 |\n| --- | --- |\n| Texte | Texte |\n';

// Modes d'édition ; « côte à côte » seulement sur grand écran
const MODES = [
    { id: 'ecrire', icon: 'fas fa-pen', label: 'Écrire' },
    { id: 'apercu', icon: 'fas fa-eye', label: 'Aperçu' },
    { id: 'cote', icon: 'fas fa-table-columns', label: 'Côte à côte', className: 'hidden lg:inline-flex' },
];

// onChange(texte) à l'enregistrement : s'il renvoie une promesse, l'éditeur reste ouvert (brouillon gardé) tant qu'elle
// n'est pas tenue, et s'il y a un échec. defaultMode : mode d'édition à l'ouverture.
export default function MarkdownTextEditor({ value = '', onChange = () => { }, placeholder = 'Cliquez pour ajouter du contenu...', connected = true, authorisation = false, classes = '', defaultMode = 'ecrire' }) {
    const User = JSON.parse(localStorage.getItem('user'));
    const editable = connected ? (!!User && authorisation) : true;

    const [editing, setEditing] = useState(false);
    const [mode, setMode] = useState(defaultMode);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState(value);
    const preview = mode === 'apercu';
    const textareaRef = useRef(null);

    const fitToContent = () => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    };

    const growIfNeeded = () => {
        const el = textareaRef.current;
        if (el && el.scrollHeight > el.clientHeight) {
            el.style.height = `${el.scrollHeight}px`;
        }
    };

    const focusResize = () => {
        requestAnimationFrame(() => {
            textareaRef.current?.focus();
            fitToContent();
        });
    };

    const startEditing = () => {
        if (!editable) return;
        setDraft(value);
        setMode(defaultMode === 'apercu' ? 'ecrire' : defaultMode);
        setEditing(true);
        focusResize();
    };

    const close = () => {
        setEditing(false);
        setMode(defaultMode);
    };

    const save = () => {
        if (saving) return;
        if (draft === value) {
            close();
            return;
        }
        const result = onChange(draft);
        if (result && typeof result.then === 'function') {
            setSaving(true);
            result.then(close, () => { }).finally(() => setSaving(false));
        } else {
            close();
        }
    };

    const cancel = () => {
        setDraft(value);
        close();
    };

    const handleKeyDown = (e) => {
        const mod = e.ctrlKey || e.metaKey;
        if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
        } else if (e.key === 'Enter' && mod) {
            e.preventDefault();
            save();
        } else if (mod && ['b', 'i', 'k'].includes(e.key.toLowerCase())) {
            e.preventDefault();
            handleToolbarAction({ b: 'bold', i: 'italic', k: 'link' }[e.key.toLowerCase()]);
        }
    };

    const wrapSelection = (before, after = before, placeholderText = '') => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const selected = draft.slice(start, end) || placeholderText;
        const newText = draft.slice(0, start) + before + selected + after + draft.slice(end);
        setDraft(newText);
        requestAnimationFrame(() => {
            el.focus();
            const selStart = start + before.length;
            const selEnd = selStart + selected.length;
            el.setSelectionRange(selStart, selEnd);
            fitToContent();
        });
    };

    const prefixLine = (prefix) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const lineStart = draft.lastIndexOf('\n', start - 1) + 1;
        const newText = draft.slice(0, lineStart) + prefix + draft.slice(lineStart);
        setDraft(newText);
        requestAnimationFrame(() => {
            el.focus();
            const pos = start + prefix.length;
            el.setSelectionRange(pos, pos);
            fitToContent();
        });
    };

    const insertAtCursor = (text) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newText = draft.slice(0, start) + text + draft.slice(end);
        setDraft(newText);
        requestAnimationFrame(() => {
            el.focus();
            const pos = start + text.length;
            el.setSelectionRange(pos, pos);
            fitToContent();
        });
    };

    const insertLink = () => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const label = draft.slice(start, end) || 'texte du lien';
        const url = 'https://';
        const insert = `[${label}](${url})`;
        const newText = draft.slice(0, start) + insert + draft.slice(end);
        setDraft(newText);
        requestAnimationFrame(() => {
            el.focus();
            const urlStart = start + label.length + 3;
            el.setSelectionRange(urlStart, urlStart + url.length);
            fitToContent();
        });
    };

    const insertCodeBlock = () => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const selected = draft.slice(start, end) || 'code';
        const insert = `\n\`\`\`\n${selected}\n\`\`\`\n`;
        const newText = draft.slice(0, start) + insert + draft.slice(end);
        setDraft(newText);
        requestAnimationFrame(() => {
            el.focus();
            const codeStart = start + 5;
            el.setSelectionRange(codeStart, codeStart + selected.length);
            fitToContent();
        });
    };

    const handleToolbarAction = (id) => {
        switch (id) {
            case 'bold': return wrapSelection('**', '**', 'texte en gras');
            case 'italic': return wrapSelection('*', '*', 'texte en italique');
            case 'strike': return wrapSelection('~~', '~~', 'texte barré');
            case 'h1': return prefixLine('# ');
            case 'h2': return prefixLine('## ');
            case 'h3': return prefixLine('### ');
            case 'quote': return prefixLine('> ');
            case 'ul': return prefixLine('- ');
            case 'ol': return prefixLine('1. ');
            case 'task': return prefixLine('- [ ] ');
            case 'link': return insertLink();
            case 'image': return wrapSelection('![', '](https://)', 'description de l\'image');
            case 'table': return insertAtCursor(TABLE_TEMPLATE);
            case 'code': return wrapSelection('`', '`', 'code');
            case 'codeblock': return insertCodeBlock();
            case 'hr': return insertAtCursor('\n---\n');
            default: return;
        }
    };

    if (editing) {
        const textarea = (
            <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => { setDraft(e.target.value); growIfNeeded(); }}
                onKeyDown={handleKeyDown}
                className="textarea textarea-ghost bg-base-100 brightness-98 w-full resize-y leading-relaxed font-mono text-sm"
                style={{ overflowY: 'auto', minHeight: mode === 'cote' ? '16rem' : '4rem' }}
                placeholder={placeholder}
                aria-label="Texte en Markdown"
            />
        );
        const apercu = <MarkdownContent text={draft || '*Rien à prévisualiser*'} className="w-full min-w-0 rounded-3xl bg-base-100 brightness-98 overflow-x-auto" style={{ padding: '0.5rem 1rem' }} />;

        return (
            <div className={`flex flex-col gap-2 w-full ${classes}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 bg-base-200 rounded-3xl p-1">
                    <div className="flex flex-wrap items-center gap-1">
                        {TOOLBAR_GROUPS.map((group, index) => (
                            <div key={index} className={`flex flex-wrap items-center gap-1 ${index > 0 ? 'border-l border-base-300 pl-1' : ''}`}>
                                {group.map((action) => (
                                    <div key={action.id} className="tooltip" data-tip={action.tip}>
                                        <button
                                            type="button"
                                            className="btn btn-md btn-ghost rounded-3xl px-3"
                                            disabled={preview}
                                            aria-label={action.tip}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => handleToolbarAction(action.id)}
                                        >
                                            {action.label ? <span className="font-bold text-sm">{action.label}</span> : <FontAwesomeIcon icon={action.icon} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-1">
                        {MODES.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`btn btn-md ${mode === item.id ? 'btn-primary' : 'btn-ghost'} rounded-3xl ${item.className || ''}`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setMode(item.id); if (item.id !== 'apercu') focusResize(); }}
                            >
                                <FontAwesomeIcon icon={item.icon} /> {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {mode === 'cote' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-start">
                        {textarea}
                        {apercu}
                    </div>
                ) : preview ? apercu : textarea}

                <div className="flex flex-row-reverse items-center gap-2">
                    <div className="tooltip tooltip-primary" data-tip="Sauvegarder (Ctrl+Entrée)">
                        <button type="button" className="btn btn-md btn-primary rounded-3xl" disabled={saving} aria-label="Sauvegarder" onMouseDown={(e) => e.preventDefault()} onClick={save}>
                            {saving ? <span className="loading loading-spinner loading-sm"></span> : <FontAwesomeIcon icon="fas fa-check" />}
                        </button>
                    </div>
                    <div className="tooltip" data-tip="Annuler (Échap)">
                        <button type="button" className="btn btn-md rounded-3xl" disabled={saving} aria-label="Annuler" onMouseDown={(e) => e.preventDefault()} onClick={cancel}>
                            <FontAwesomeIcon icon="fas fa-xmark" />
                        </button>
                    </div>
                    <span className="text-xs opacity-60 mr-auto px-2">Markdown : **gras**, *italique*, # titre, - liste, [lien](https://…)</span>
                </div>
            </div>
        );
    }

    if (!value) {
        return (
            <div
                className={`w-full rounded-3xl ${editable ? 'cursor-text hover:bg-base-300/40 transition-colors' : ''} text-base-content/50 italic ${classes}`}
                style={{ padding: '0.5rem 1rem', minHeight: '2.5rem' }}
                onClick={startEditing}
            >
                {placeholder}
            </div>
        );
    }

    return (
        <div
            className={`w-full rounded-3xl ${editable ? 'cursor-text hover:bg-base-300/40 transition-colors' : ''} ${classes}`}
            style={{ padding: '0.5rem 1rem' }}
            onClick={startEditing}
        >
            <MarkdownContent text={value} />
        </div>
    );
}
