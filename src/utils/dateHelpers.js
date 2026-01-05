export const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

export const calculerDuree = (dateDebut, dateFin) => {
  if (!dateDebut || !dateFin) return null;

  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);

  if (fin < debut) return null;

  const dureeMs = fin - debut;
  return Math.round(dureeMs / 60000);
};

export const ajouterMinutes = (date, minutes) => {
  const newDate = new Date(date);
  newDate.setMinutes(newDate.getMinutes() + minutes);
  return newDate;
};

export const estDansIntervalle = (date, dateDebut, dateFin) => {
  const d = new Date(date);
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);

  return d >= debut && d <= fin;
};

export const formatDuree = (minutes) => {
  if (!minutes) return '0min';

  const heures = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (heures === 0) return `${mins}min`;
  if (mins === 0) return `${heures}h`;

  return `${heures}h${mins}min`;
};
