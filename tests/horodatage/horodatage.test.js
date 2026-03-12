import { describe, it, expect, vi } from 'vitest';
import {
  calculerEcartSaisie,
  detecterSource,
  estSaisieTardive,
  creerHorodatageTempsReel,
  creerHorodatageDeclaration,
  SOURCES_HORODATAGE,
  SEUILS
} from '../../src/utils/horodatage.js';

describe('Mission 008 — Double Horodatage', () => {

  // ═══════════════════════════════════════════════════════
  // 1. calculerEcartSaisie
  // ═══════════════════════════════════════════════════════
  describe('calculerEcartSaisie', () => {
    it('retourne 0 pour deux dates identiques', () => {
      const now = new Date();
      expect(calculerEcartSaisie(now, now)).toBe(0);
    });

    it('retourne l écart en minutes (valeur absolue)', () => {
      const systeme = new Date('2026-03-05T14:00:00Z');
      const declaree = new Date('2026-03-05T14:10:00Z');
      expect(calculerEcartSaisie(declaree, systeme)).toBe(10);
    });

    it('retourne l écart même si déclarée est antérieure au système', () => {
      const systeme = new Date('2026-03-05T14:30:00Z');
      const declaree = new Date('2026-03-05T14:00:00Z');
      expect(calculerEcartSaisie(declaree, systeme)).toBe(30);
    });

    it('retourne null si dateDeclaree est null', () => {
      expect(calculerEcartSaisie(null, new Date())).toBeNull();
    });

    it('retourne null si dateSysteme est null', () => {
      expect(calculerEcartSaisie(new Date(), null)).toBeNull();
    });

    it('retourne null pour dates invalides', () => {
      expect(calculerEcartSaisie('invalid', new Date())).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════
  // 2. detecterSource
  // ═══════════════════════════════════════════════════════
  describe('detecterSource', () => {
    it('retourne TEMPS_REEL si écart <= 5 min', () => {
      expect(detecterSource(0)).toBe('TEMPS_REEL');
      expect(detecterSource(3)).toBe('TEMPS_REEL');
      expect(detecterSource(5)).toBe('TEMPS_REEL');
    });

    it('retourne DECLARATION si écart > 5 min', () => {
      expect(detecterSource(6)).toBe('DECLARATION');
      expect(detecterSource(30)).toBe('DECLARATION');
      expect(detecterSource(120)).toBe('DECLARATION');
    });

    it('retourne TEMPS_REEL si écart est null', () => {
      expect(detecterSource(null)).toBe('TEMPS_REEL');
    });

    it('respecte la source explicite si fournie', () => {
      expect(detecterSource(0, 'CORRECTION')).toBe('CORRECTION');
      expect(detecterSource(100, 'IMPORT')).toBe('IMPORT');
    });

    it('ignore les sources explicites invalides', () => {
      expect(detecterSource(0, 'INVALID_SOURCE')).toBe('TEMPS_REEL');
      expect(detecterSource(30, 'INVALID_SOURCE')).toBe('DECLARATION');
    });
  });

  // ═══════════════════════════════════════════════════════
  // 3. estSaisieTardive
  // ═══════════════════════════════════════════════════════
  describe('estSaisieTardive', () => {
    it('retourne false si écart <= 60 min', () => {
      expect(estSaisieTardive(0)).toBe(false);
      expect(estSaisieTardive(30)).toBe(false);
      expect(estSaisieTardive(60)).toBe(false);
    });

    it('retourne true si écart > 60 min', () => {
      expect(estSaisieTardive(61)).toBe(true);
      expect(estSaisieTardive(120)).toBe(true);
    });

    it('retourne false si écart est null', () => {
      expect(estSaisieTardive(null)).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════
  // 4. creerHorodatageTempsReel
  // ═══════════════════════════════════════════════════════
  describe('creerHorodatageTempsReel', () => {
    it('crée un horodatage temps réel complet', () => {
      const userId = 'user-123';
      const h = creerHorodatageTempsReel(userId, 'Africa/Ndjamena');

      expect(h.timestampSysteme).toBeInstanceOf(Date);
      expect(h.heureDeclaree).toBeInstanceOf(Date);
      expect(h.source).toBe('TEMPS_REEL');
      expect(h.ecartSaisieMinutes).toBe(0);
      expect(h.saisieTardive).toBe(false);
      expect(h.agent).toBe(userId);
      expect(h.timezoneAeroport).toBe('Africa/Ndjamena');
    });

    it('timestampSysteme === heureDeclaree en temps réel', () => {
      const h = creerHorodatageTempsReel();
      // En temps réel, les deux doivent être identiques (même instant)
      expect(h.timestampSysteme.getTime()).toBe(h.heureDeclaree.getTime());
    });

    it('utilise UTC par défaut pour timezone', () => {
      const h = creerHorodatageTempsReel();
      expect(h.timezoneAeroport).toBe('UTC');
    });

    it('agent est null si non fourni', () => {
      const h = creerHorodatageTempsReel();
      expect(h.agent).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════
  // 5. creerHorodatageDeclaration
  // ═══════════════════════════════════════════════════════
  describe('creerHorodatageDeclaration', () => {
    it('crée un horodatage avec écart calculé automatiquement', () => {
      // Agent déclare une heure 30 min dans le passé
      const trente_min_avant = new Date(Date.now() - 30 * 60 * 1000);
      const h = creerHorodatageDeclaration(trente_min_avant, 'user-456');

      expect(h.timestampSysteme).toBeInstanceOf(Date);
      expect(h.heureDeclaree).toBeInstanceOf(Date);
      expect(h.source).toBe('DECLARATION'); // écart > 5 min
      expect(h.ecartSaisieMinutes).toBeGreaterThanOrEqual(29);
      expect(h.ecartSaisieMinutes).toBeLessThanOrEqual(31);
      expect(h.saisieTardive).toBe(false); // < 60 min
      expect(h.agent).toBe('user-456');
    });

    it('détecte saisie tardive si écart > 60 min', () => {
      const deux_heures_avant = new Date(Date.now() - 120 * 60 * 1000);
      const h = creerHorodatageDeclaration(deux_heures_avant);

      expect(h.source).toBe('DECLARATION');
      expect(h.saisieTardive).toBe(true);
      expect(h.ecartSaisieMinutes).toBeGreaterThanOrEqual(119);
    });

    it('détecte TEMPS_REEL si écart < 5 min', () => {
      const maintenant = new Date();
      const h = creerHorodatageDeclaration(maintenant);

      expect(h.source).toBe('TEMPS_REEL');
      expect(h.ecartSaisieMinutes).toBeLessThanOrEqual(1);
      expect(h.saisieTardive).toBe(false);
    });

    it('respecte la source explicite CORRECTION', () => {
      const h = creerHorodatageDeclaration(new Date(), 'user-789', 'UTC', 'CORRECTION');
      expect(h.source).toBe('CORRECTION');
    });

    it('utilise now si heureDeclaree est null', () => {
      const h = creerHorodatageDeclaration(null, 'user-000');
      expect(h.heureDeclaree).toBeInstanceOf(Date);
      expect(h.ecartSaisieMinutes).toBeLessThanOrEqual(1);
    });

    it('propage timezone aéroport', () => {
      const h = creerHorodatageDeclaration(new Date(), null, 'Africa/Douala');
      expect(h.timezoneAeroport).toBe('Africa/Douala');
    });
  });

  // ═══════════════════════════════════════════════════════
  // 6. Constantes
  // ═══════════════════════════════════════════════════════
  describe('Constantes', () => {
    it('SOURCES_HORODATAGE contient les 4 sources', () => {
      expect(Object.keys(SOURCES_HORODATAGE)).toHaveLength(4);
      expect(SOURCES_HORODATAGE.TEMPS_REEL).toBe('TEMPS_REEL');
      expect(SOURCES_HORODATAGE.DECLARATION).toBe('DECLARATION');
      expect(SOURCES_HORODATAGE.CORRECTION).toBe('CORRECTION');
      expect(SOURCES_HORODATAGE.IMPORT).toBe('IMPORT');
    });

    it('SEUILS sont correctement définis', () => {
      expect(SEUILS.TEMPS_REEL_MAX).toBe(5);
      expect(SEUILS.SAISIE_TARDIVE).toBe(60);
    });
  });

  // ═══════════════════════════════════════════════════════
  // 7. Scénarios terrain réels
  // ═══════════════════════════════════════════════════════
  describe('Scénarios terrain', () => {
    it('SCENARIO 1 : Agent clique "Démarrer" en temps réel', () => {
      // L'agent est au pied de l'avion, clique le bouton
      const h = creerHorodatageTempsReel('agent-terrain-001', 'Africa/Ndjamena');

      expect(h.source).toBe('TEMPS_REEL');
      expect(h.ecartSaisieMinutes).toBe(0);
      expect(h.saisieTardive).toBe(false);
      expect(h.agent).toBe('agent-terrain-001');
    });

    it('SCENARIO 2 : Agent saisit une heure 15 min après le fait', () => {
      // L'agent était occupé, saisit l'heure manuellement 15 min après
      const quinze_min_avant = new Date(Date.now() - 15 * 60 * 1000);
      const h = creerHorodatageDeclaration(quinze_min_avant, 'agent-terrain-002', 'Africa/Ndjamena');

      expect(h.source).toBe('DECLARATION');
      expect(h.ecartSaisieMinutes).toBeGreaterThanOrEqual(14);
      expect(h.saisieTardive).toBe(false); // 15 min < 60 min
    });

    it('SCENARIO 3 : Agent renseigne un CRV le lendemain', () => {
      // L'agent n'avait pas pu remplir le CRV, le fait 24h après
      const hier = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const h = creerHorodatageDeclaration(hier, 'agent-terrain-003', 'Africa/Ndjamena');

      expect(h.source).toBe('DECLARATION');
      expect(h.saisieTardive).toBe(true);
      expect(h.ecartSaisieMinutes).toBeGreaterThanOrEqual(23 * 60); // ~1440 min
    });

    it('SCENARIO 4 : Superviseur corrige une heure erronée', () => {
      const heureCorrigee = new Date('2026-03-05T14:32:00Z');
      const h = creerHorodatageDeclaration(heureCorrigee, 'superviseur-001', 'Africa/Ndjamena', 'CORRECTION');

      expect(h.source).toBe('CORRECTION');
      expect(h.agent).toBe('superviseur-001');
      // timestampSysteme est le moment de la correction, pas l'heure corrigée
      expect(h.timestampSysteme).not.toEqual(h.heureDeclaree);
    });
  });
});
