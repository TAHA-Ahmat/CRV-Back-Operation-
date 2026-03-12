export const estEmailValide = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const estNumeroVolValide = (numeroVol) => {
  const regex = /^[A-Z0-9]{2,3}\d{1,4}$/;
  return regex.test(numeroVol);
};

export const estImmatriculationValide = (immatriculation) => {
  const regex = /^[A-Z]-[A-Z]{4}$/;
  return regex.test(immatriculation);
};

export const estCodeIATAValide = (code) => {
  return code && code.length === 2 && /^[A-Z]{2}$/.test(code);
};

export const estCodeAeroportValide = (code) => {
  return code && code.length === 3 && /^[A-Z]{3}$/.test(code);
};

export const validerDuree = (heureDebut, heureFin) => {
  if (!heureDebut || !heureFin) {
    return { valide: false, message: 'Heures manquantes' };
  }

  const debut = new Date(heureDebut);
  const fin = new Date(heureFin);

  if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
    return { valide: false, message: 'Format de date invalide' };
  }

  if (fin < debut) {
    return { valide: false, message: 'Heure de fin antérieure à heure de début' };
  }

  return { valide: true };
};
