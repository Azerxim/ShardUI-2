// Formes de cartographie (Shard-API /cartographie) : coordonnées stockées au format Leaflet, en JSON,
// un point [-z, x] (marqueur) ou une liste de sommets [[-z, x], …] (polygone, rectangle).

const sommets = (forme) => {
    try {
        const coords = JSON.parse(forme.coordinates);
        return Array.isArray(coords[0]) ? coords : [coords];
    } catch {
        return null;
    }
};

// Centre (moyenne des sommets) et zoom d'aperçu d'une forme : plus elle est étendue, plus on dézoome
export function emplacement(forme) {
    const points = sommets(forme);
    if (!points?.length) return null;
    const moyenne = (index) => Math.round(points.reduce((total, point) => total + point[index], 0) / points.length);
    const etendue = Math.max(...[0, 1].map((index) => Math.max(...points.map((p) => p[index])) - Math.min(...points.map((p) => p[index]))));
    const zoom = etendue <= 64 ? 1 : etendue <= 160 ? 0 : -1;
    return { x: moyenne(1), z: -moyenne(0), zoom };
}

// Une position du jeu (x, z) est-elle dans le polygone d'une forme ? (lancer de rayon, même calcul que la carte)
export function dansLaZone(forme, x, z) {
    const points = sommets(forme);
    if (!points || points.length < 3 || x == null || z == null) return false;
    const point = [-z, x];
    let dedans = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [yi, xi] = points[i];
        const [yj, xj] = points[j];
        if (yi > point[0] !== yj > point[0] && point[1] < ((xj - xi) * (point[0] - yi)) / (yj - yi) + xi) dedans = !dedans;
    }
    return dedans;
}
