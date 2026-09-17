const URL_PATTERN = /(https?:\/\/[^\s<>()]+|www\.[^\s<>()]+)/gi;
const TRAILING_PUNCTUATION = /[.,!?;:)'"\]]+$/;

function stripTrailingPunctuation(url) {
    const match = url.match(TRAILING_PUNCTUATION);
    return match ? url.slice(0, -match[0].length) : url;
}

export default function LinkifiedText({ text = '', className = '' }) {
    if (!text) return null;

    const regex = new RegExp(URL_PATTERN);
    const nodes = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const url = stripTrailingPunctuation(match[0]);
        if (!url) {
            regex.lastIndex = match.index + 1;
            continue;
        }

        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        const href = url.startsWith('www.') ? `https://${url}` : url;
        nodes.push(
            <a key={match.index} href={href} target="_blank" rel="noopener noreferrer" className="link link-primary break-all">
                {url}
            </a>
        );

        lastIndex = match.index + url.length;
        regex.lastIndex = lastIndex;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return <span className={className}>{nodes}</span>;
}
