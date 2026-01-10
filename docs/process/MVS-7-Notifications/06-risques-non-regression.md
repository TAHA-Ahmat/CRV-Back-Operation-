# MVS-7-Notifications - RISQUES ET NON-REGRESSION

## Date d'audit : 2026-01-10

---

## 1. POINTS CRITIQUES

### 1.1 Verification proprietaire

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Check destinataire | notification.controller.js | HAUTE |

**Risque** : Acces non autorise aux notifications d'autres utilisateurs

**Regle** : Une notification ne peut etre lue/modifiee/supprimee que par son destinataire

**Modifications INTERDITES** :
- Suppression de la verification proprietaire
- Bypass de la verification pour les non-admins

---

### 1.2 Configuration SMTP

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Variables env SMTP | notification.service.js | HAUTE |

**Risque** : Echec envoi emails si mauvaise configuration

**Variables requises** :
- SMTP_HOST, SMTP_PORT, SMTP_SECURE
- SMTP_USER, SMTP_PASS, SMTP_FROM

---

### 1.3 Expiration notifications

| Element | Localisation | Criticite |
|---------|--------------|-----------|
| Champ expiration | Notification.js | MOYENNE |
| Nettoyage auto | notification.service.js | MOYENNE |

**Risque** : Accumulation de notifications obsoletes si nettoyage non execute

---

## 2. COUPLAGES FORTS

| Entite | Dependance | Type |
|--------|------------|------|
| Notification | User | N:1 obligatoire |
| envoyerEmail | nodemailer | Externe |
| envoyerEmail | Config SMTP | Environnement |

---

## 3. CHAMPS SENSIBLES

| Champ | Modele | Sensibilite |
|-------|--------|-------------|
| destinataire | Notification | Cle proprietaire |
| type | Notification | Enum contrainte |
| priorite | Notification | Enum contrainte |
| canaux | Notification | Enum array contrainte |
| source.type | Notification | Enum contrainte |

---

## 4. MODIFICATIONS INTERDITES

| Element | Raison |
|---------|--------|
| Verification proprietaire | Securite donnees |
| Enum type | Classification notifications |
| Enum priorite | Tri et affichage |
| Enum canaux | Routage notifications |
| Limite maxlength titre/message | Protection BD |

---

## 5. CHECKLIST NON-REGRESSION

- [ ] Verification proprietaire active sur modification/suppression
- [ ] Notifications non lues comptees correctement
- [ ] Configuration SMTP valide pour envoi emails
- [ ] Expiration notifications fonctionne
- [ ] Pagination correcte sur liste notifications
- [ ] Tri par date DESC maintenu
- [ ] Creation notification par ADMIN/MANAGER uniquement

---

## 6. TESTS CRITIQUES

| Test | Priorite |
|------|----------|
| Lecture notification autre utilisateur -> 403 | P0 |
| Suppression notification autre utilisateur -> 403 | P0 |
| Creation notification par AGENT -> 403 | P1 |
| Marquer comme lue MAJ dateLecture | P1 |
| Marquer toutes comme lues fonctionne | P1 |
| Envoi email avec config valide | P1 |
| Nettoyage notifications expirees | P2 |

---

## 7. DEPENDANCES EXTERNES

### Nodemailer

| Element | Detail |
|---------|--------|
| Package | nodemailer |
| Usage | Envoi emails |
| Configuration | Variables environnement SMTP |

**Risque** : Si serveur SMTP indisponible, emails non envoyes

**Mitigation** : Logs erreurs + retry optionnel

---

## 8. EXTENSION 7 : NOTIFICATIONS IN-APP

### Constat
Cette extension ajoute la gestion des notifications in-app au systeme.

### Impact
- Nouvelle collection MongoDB
- Nouveaux endpoints API
- Integration possible avec WebSocket pour temps reel (non implemente)

### Points d'attention
- Accumulation potentielle de notifications
- Performance des queries si volume important
- Nettoyage regulier necessaire

