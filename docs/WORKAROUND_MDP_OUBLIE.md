# 🔐 WORKAROUND — Mot de passe oublié (P0-2)

**Version**: 1.0.0
**Date**: 2026-01-05
**Statut**: TEMPORAIRE — En attente implémentation automatisée
**Classification**: P0-2 (CRITIQUE — BLOQUANT UTILISATEUR)

---

## ⚠️ CONTEXTE

Le système CRV Operation ne dispose PAS encore d'un workflow automatisé de réinitialisation de mot de passe.

**Impact**:
- ❌ Aucun endpoint `/mot-de-passe-oublie`
- ❌ Aucun système d'envoi d'email automatique
- ❌ Utilisateur bloqué en cas d'oubli de mot de passe

**Solution temporaire**: Procédure manuelle par ADMIN via MongoDB.

---

## 📋 PROCÉDURE WORKAROUND

### Conditions d'application

✅ **Applicable quand**:
1. L'utilisateur a oublié son mot de passe
2. L'utilisateur a fourni une preuve d'identité valide
3. La demande est validée par un responsable hiérarchique (CHEF/SUPERVISEUR/MANAGER)

❌ **NON applicable**:
- Sans validation hiérarchique
- Sans preuve d'identité
- Pour compte suspendu ou désactivé

---

## 🛠️ ÉTAPES TECHNIQUES (ADMIN uniquement)

### Prérequis

- Accès MongoDB (mongosh ou Compass)
- Droits ADMIN sur la base de données CRV
- Validation formelle de la demande reçue

### Étape 1: Vérifier l'utilisateur

```bash
mongosh

use CRV

# Rechercher l'utilisateur par email ou nom
db.personnes.findOne({ email: "utilisateur@example.com" })
```

**Vérifications obligatoires**:
- ✅ Compte existe
- ✅ Compte actif (`actif: true`)
- ✅ Email correspond à la demande
- ✅ Fonction/rôle cohérent avec la validation reçue

### Étape 2: Générer un mot de passe temporaire

**Format du mot de passe temporaire**:
```
Temp{Initiales}{YYYYMMDD}{Rand}
```

Exemple: `TempAH20260105X7K9`

**Règles**:
- Minimum 12 caractères
- Majuscules + minuscules + chiffres
- Unique et non réutilisable

### Étape 3: Hasher le nouveau mot de passe

**Utiliser bcrypt avec salt rounds = 10** (même config que le système):

```javascript
// Dans Node.js (sur serveur backend)
const bcrypt = require('bcryptjs');
const motDePasseTemporaire = 'TempAH20260105X7K9';
const hash = await bcrypt.hash(motDePasseTemporaire, 10);
console.log(hash);
```

Exemple de hash généré:
```
$2a$10$N9qo8uLOickgx2ZMRZoMye1J5VhXZOz8rQzXmGLB4FhZlxC3eQV2i
```

### Étape 4: Mettre à jour le mot de passe dans MongoDB

```javascript
// Dans mongosh
db.personnes.updateOne(
  { email: "utilisateur@example.com" },
  {
    $set: {
      motDePasse: "$2a$10$N9qo8uLOickgx2ZMRZoMye1J5VhXZOz8rQzXmGLB4FhZlxC3eQV2i",
      // IMPORTANT: Forcer le changement au prochain login
      doitChangerMotDePasse: true,
      // Traçabilité
      dernierChangementMDP: new Date(),
      modifiePar: "ADMIN_SUPPORT",
      raisonModification: "Réinitialisation MDP oublié - Ticket #XXX"
    }
  }
)
```

**⚠️ SÉCURITÉ CRITIQUE**:
- Ne JAMAIS stocker le mot de passe en clair
- Ne JAMAIS envoyer le hash par email
- Seul le mot de passe temporaire en clair est communiqué (canal sécurisé uniquement)

### Étape 5: Communiquer le mot de passe temporaire

**Canal de communication sécurisé uniquement**:
- ✅ Remise en main propre
- ✅ Appel téléphonique direct (avec vérification identité)
- ✅ SMS sur numéro professionnel enregistré
- ❌ JAMAIS par email
- ❌ JAMAIS par messagerie instantanée non chiffrée

**Message type**:
```
Votre mot de passe a été réinitialisé.
Mot de passe temporaire: TempAH20260105X7K9

IMPORTANT:
- Connectez-vous immédiatement
- Le système vous forcera à changer ce mot de passe
- Ne partagez ce mot de passe avec personne
- Ce mot de passe expire dans 24h

Support: support@crv.com
```

### Étape 6: Vérification post-réinitialisation

**Dans les 24h**:
```javascript
// Vérifier que l'utilisateur s'est connecté et a changé son MDP
db.personnes.findOne(
  { email: "utilisateur@example.com" },
  { doitChangerMotDePasse: 1, dernierChangementMDP: 1, derniereConnexion: 1 }
)
```

**Résultat attendu**:
- `doitChangerMotDePasse: false` (utilisateur a changé son MDP)
- `derniereConnexion` récente
- `dernierChangementMDP` postérieur à la réinitialisation

---

## 📝 TRAÇABILITÉ OBLIGATOIRE

### Registre des réinitialisations

**Créer un document de suivi** dans MongoDB:

```javascript
db.mdp_reinitialisations.insertOne({
  ticketSupport: "TICKET-2026-0105-001",
  utilisateurEmail: "utilisateur@example.com",
  utilisateurNom: "Nom Prénom",
  fonction: "AGENT_ESCALE",

  // Validation
  demandeLe: new Date("2026-01-05T10:30:00Z"),
  validePar: "CHEF_Jean_Dupont",
  valideLe: new Date("2026-01-05T10:45:00Z"),
  preuveIdentite: "Badge professionnel + pièce d'identité",

  // Exécution
  resetEffectuePar: "ADMIN_Support",
  resetEffectueLe: new Date("2026-01-05T11:00:00Z"),
  canalCommunication: "Remise en main propre",

  // Vérification
  utilisateurConnecteLe: new Date("2026-01-05T11:15:00Z"),
  mdpChangeLe: new Date("2026-01-05T11:16:00Z"),
  statut: "TERMINE",

  // Audit
  remarques: "Procédure workaround P0-2 appliquée. Utilisateur a changé son MDP avec succès."
})
```

### Champs obligatoires

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| `ticketSupport` | ✅ | Référence ticket support |
| `utilisateurEmail` | ✅ | Email de l'utilisateur |
| `validePar` | ✅ | Nom du valideur hiérarchique |
| `preuveIdentite` | ✅ | Type de preuve fournie |
| `resetEffectuePar` | ✅ | ADMIN ayant effectué le reset |
| `canalCommunication` | ✅ | Canal utilisé pour communiquer le MDP temp |
| `statut` | ✅ | TERMINE / EN_ATTENTE / EXPIRE |

---

## 🔒 SÉCURITÉ & CONFORMITÉ

### Règles de sécurité

1. **Validation obligatoire**: 2 niveaux (identité + hiérarchie)
2. **Mot de passe temporaire**: Fort, unique, expire 24h
3. **Changement forcé**: `doitChangerMotDePasse: true`
4. **Traçabilité complète**: Chaque opération enregistrée
5. **Canal sécurisé**: Jamais d'email pour MDP temporaire
6. **Audit trail**: Conservation 3 ans minimum

### Conformité RGPD

- ✅ Traitement minimal de données personnelles
- ✅ Finalité légitime (support utilisateur)
- ✅ Durée de conservation définie
- ✅ Traçabilité des accès

---

## 📊 MONITORING & REPORTING

### Indicateurs à suivre

```javascript
// Nombre de réinitialisations par mois
db.mdp_reinitialisations.aggregate([
  {
    $match: {
      resetEffectueLe: {
        $gte: new Date("2026-01-01"),
        $lt: new Date("2026-02-01")
      }
    }
  },
  { $count: "total" }
])

// Réinitialisations non terminées (utilisateur n'a pas changé MDP)
db.mdp_reinitialisations.find({
  statut: { $ne: "TERMINE" },
  resetEffectueLe: { $lt: new Date(Date.now() - 24*60*60*1000) }
})
```

### Alertes

⚠️ **Déclencher une alerte si**:
- Plus de 5 réinitialisations/jour
- Utilisateur demande 2+ réinitialisations en 7 jours
- MDP temporaire non changé après 24h

---

## 🚀 MIGRATION VERS SOLUTION AUTOMATISÉE

### Quand implémenter la solution définitive

**Critères de prioritisation**:
1. ✅ Dès que 10+ demandes/mois
2. ✅ Dès que ADMIN submergé
3. ✅ Avant mise en production étendue

### Solution cible recommandée

**Fonctionnalités minimales**:
- Endpoint `POST /api/auth/mot-de-passe-oublie`
- Email de réinitialisation avec token JWT (exp: 1h)
- Endpoint `POST /api/auth/reinitialiser-mot-de-passe`
- Traçabilité automatique
- Rate limiting (3 tentatives/heure/email)

**Librairies suggérées**:
- `nodemailer` pour envoi email
- `jsonwebtoken` pour tokens de réinitialisation
- `express-rate-limit` pour protection anti-abus

---

## 📞 SUPPORT & ESCALADE

### Contact support

**Email**: support-crv@example.com
**Téléphone**: +XXX XXX XXX XXX
**Heures**: Lun-Ven 8h-18h

### Escalade

| Niveau | Délai | Contact |
|--------|-------|---------|
| Support Niveau 1 | Réponse sous 2h | support-crv@example.com |
| ADMIN Système | Réponse sous 4h | admin-crv@example.com |
| Responsable IT | Urgence uniquement | responsable.it@example.com |

---

## ✅ CHECKLIST INTERVENTION

Avant chaque réinitialisation, vérifier:

- [ ] Ticket support créé avec numéro unique
- [ ] Identité utilisateur vérifiée (2 preuves minimum)
- [ ] Validation hiérarchique reçue et documentée
- [ ] Compte actif dans MongoDB
- [ ] Mot de passe temporaire généré (format conforme)
- [ ] Hash bcrypt créé (salt rounds = 10)
- [ ] Mise à jour MongoDB effectuée
- [ ] Flag `doitChangerMotDePasse: true` appliqué
- [ ] MDP temporaire communiqué par canal sécurisé
- [ ] Document de traçabilité créé dans `mdp_reinitialisations`
- [ ] Vérification post-reset programmée (J+1)
- [ ] Ticket support fermé avec statut final

---

## 📚 ANNEXES

### Annexe A: Script MongoDB complet

```javascript
// Script de réinitialisation de mot de passe
// À exécuter dans mongosh

use CRV;

// Paramètres (À ADAPTER)
const emailUtilisateur = "utilisateur@example.com";
const motDePasseTemporaireHash = "$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // Hash bcrypt
const ticketSupport = "TICKET-2026-XXXX-XXX";
const validePar = "CHEF_Nom_Prenom";
const adminExecutant = "ADMIN_Nom";

// 1. Vérifier l'utilisateur
const utilisateur = db.personnes.findOne({ email: emailUtilisateur });
if (!utilisateur) {
  print("❌ ERREUR: Utilisateur non trouvé");
  quit(1);
}
if (!utilisateur.actif) {
  print("❌ ERREUR: Compte inactif");
  quit(1);
}
print("✅ Utilisateur trouvé:", utilisateur.nom, utilisateur.prenom);

// 2. Mettre à jour le mot de passe
const resultUpdate = db.personnes.updateOne(
  { email: emailUtilisateur },
  {
    $set: {
      motDePasse: motDePasseTemporaireHash,
      doitChangerMotDePasse: true,
      dernierChangementMDP: new Date(),
      modifiePar: adminExecutant,
      raisonModification: `Réinitialisation MDP oublié - ${ticketSupport}`
    }
  }
);

if (resultUpdate.modifiedCount === 1) {
  print("✅ Mot de passe réinitialisé avec succès");
} else {
  print("❌ ERREUR: Échec de la mise à jour");
  quit(1);
}

// 3. Créer le document de traçabilité
db.mdp_reinitialisations.insertOne({
  ticketSupport: ticketSupport,
  utilisateurEmail: emailUtilisateur,
  utilisateurNom: `${utilisateur.nom} ${utilisateur.prenom}`,
  fonction: utilisateur.fonction,

  demandeLe: new Date(),
  validePar: validePar,
  valideLe: new Date(),
  preuveIdentite: "À documenter",

  resetEffectuePar: adminExecutant,
  resetEffectueLe: new Date(),
  canalCommunication: "À documenter",

  statut: "EN_ATTENTE",
  remarques: "Procédure workaround P0-2. En attente connexion utilisateur."
});

print("✅ Document de traçabilité créé");
print("📋 Prochaines étapes:");
print("   1. Communiquer le MDP temporaire par canal sécurisé");
print("   2. Vérifier la connexion de l'utilisateur sous 24h");
print("   3. Mettre à jour le statut du document de traçabilité");
```

### Annexe B: Template email de confirmation (pour valideur)

```
Objet: Confirmation de réinitialisation de mot de passe - [Nom Utilisateur]

Bonjour [Nom Valideur],

La réinitialisation de mot de passe que vous avez validée a été effectuée avec succès.

Détails:
- Utilisateur: [Nom Prénom]
- Email: [email@example.com]
- Fonction: [AGENT_ESCALE]
- Ticket: [TICKET-2026-XXXX-XXX]
- Date/Heure: [2026-01-05 11:00:00]
- Exécuté par: [ADMIN_Nom]

Le mot de passe temporaire a été communiqué à l'utilisateur par [canal sécurisé].
L'utilisateur devra changer son mot de passe à la prochaine connexion.

Cordialement,
Support CRV Operation
```

---

**Document contrôlé** — Version 1.0.0 — 2026-01-05
**Validité**: Jusqu'à implémentation de la solution automatisée
**Révision**: Trimestrielle ou dès 50 interventions
