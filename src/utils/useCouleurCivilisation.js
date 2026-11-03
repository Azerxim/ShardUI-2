import { useEffect, useState } from "react";

import { getZonesOfCivilisation } from "@/services/api";
import { couleurFiche, couleurValide } from "@/utils/couleurFiche";

// Formes qui colorent un territoire : les textes et marqueurs ont la couleur de leur libellé ou de leur épingle
const ZONES = new Set(["Polygon", "Rectangle", "Circle"]);

// Couleur d'une civilisation pour l'en-tête de sa fiche (et de ses villes, de ses guerres) : celle de ses frontières sur
// la carte, sinon un émail dérivé de son identifiant. id null : null (pas de civilisation).
export function useCouleurCivilisation(id) {
  // Couleur lue sur la carte, avec la civilisation à laquelle elle appartient (ignorée quand id change)
  const [carte, setCarte] = useState({ id: null, couleur: null });

  useEffect(() => {
    if (!id) return undefined;
    let annule = false;
    getZonesOfCivilisation(id)
      .then((zones) => {
        if (!annule) setCarte({ id, couleur: (Array.isArray(zones) ? zones : []).filter((zone) => ZONES.has(zone.shape_type)).map((zone) => couleurValide(zone.color)).find(Boolean) ?? null });
      })
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [id]);

  return id ? couleurFiche(carte.id === id ? carte.couleur : null, id) : null;
}
