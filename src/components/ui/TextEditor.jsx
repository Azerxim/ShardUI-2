import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function TextEditor({ value = '', onChange = () => { }, placeholder = 'Cliquez pour ajouter du contenu...', connected = true, classes = '' }) {
    const User = JSON.parse(localStorage.getItem('user'));
    const editable = connected ? !!User : true;

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
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

    useEffect(() => {
        if (editing) {
            fitToContent();
            textareaRef.current?.focus();
        }
    }, [editing]);

    const startEditing = () => {
        if (!editable) return;
        setDraft(value);
        setEditing(true);
    };

    const save = () => {
        setEditing(false);
        if (draft !== value) {
            onChange(draft);
        }
    };

    const cancel = () => {
        setDraft(value);
        setEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            save();
        }
    };

    if (editing) {
        return (
            <div className={`flex flex-col gap-2 w-full ${classes}`}>
                <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(e) => { setDraft(e.target.value); growIfNeeded(); }}
                    onKeyDown={handleKeyDown}
                    onBlur={save}
                    className="textarea textarea-ghost bg-base-100 brightness-98 w-full resize-y leading-relaxed"
                    style={{ overflowY: 'auto', minHeight: '4rem' }}
                    placeholder={placeholder}
                />
                <div className="flex flex-row-reverse gap-2">
                    <div className="tooltip tooltip-primary" data-tip="Sauvegarder">
                        <button type="button" className="btn btn-md btn-primary rounded-3xl" onMouseDown={(e) => e.preventDefault()} onClick={save}>
                            <FontAwesomeIcon icon="fas fa-check" />
                        </button>
                    </div>
                    <div className="tooltip" data-tip="Annuler">
                        <button type="button" className="btn btn-md rounded-3xl" onMouseDown={(e) => e.preventDefault()} onClick={cancel}>
                            <FontAwesomeIcon icon="fas fa-xmark" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`w-full whitespace-pre-wrap leading-relaxed rounded-3xl ${editable ? 'cursor-text hover:bg-base-300/40 transition-colors' : ''} ${!value ? 'text-base-content/50 italic' : ''} ${classes}`}
            style={{ padding: '0.5rem 1rem', minHeight: '2.5rem' }}
            onClick={startEditing}
        >
            {value || placeholder}
        </div>
    );
}
