// Retourne blanc ou noir selon la luminosité perçue de la couleur de fond (formule YIQ)
export function getContrastTextColor(bgColor) {
    if (!bgColor) return '#ffffff';
    let r, g, b;
    if (bgColor.startsWith('#')) {
        let hex = bgColor.slice(1);
        if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
        // Couleur avec transparence (#rrggbbaa) : on ignore l'alpha
        const bigint = parseInt(hex.slice(0, 6), 16);
        r = (bigint >> 16) & 255;
        g = (bigint >> 8) & 255;
        b = bigint & 255;
    } else {
        const match = bgColor.match(/\d+/g);
        if (!match || match.length < 3) return '#ffffff';
        [r, g, b] = match.map(Number);
    }
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
}
