# JUSTIFICATIF GLOBAL - SYSTÈME CRV OPÉRATIONNEL
## PROCESS MÉTIER & CHOIX TECHNIQUES

---

**Projet** : Système de gestion de Comptes Rendus de Vol (CRV)
**Version** : 1.0 - 8 extensions validées
**Date** : Janvier 2026
**Périmètre** : Exploitation aérienne professionnelle (handling & opérations)

---

## 1️⃣ INTRODUCTION GÉNÉRALE

### Qu'est-ce qu'un CRV dans la réalité opérationnelle ?

Un **Compte Rendu de Vol (CRV)** n'est pas un simple document administratif produit après un vol. C'est un **outil de pilotage opérationnel en temps réel** qui accompagne le vol de sa planification jusqu'à son archivage officiel.

**Dans les faits, un CRV :**
- Commence comme un **brouillon vivant** dès qu'un vol est identifié
- **Évolue en continu** pendant toute la phase opérationnelle (check-in, embarquement, chargement, départ)
- **Capture les ajustements** de dernière minute (passagers no-show, fret supplémentaire, incidents mineurs)
- **Devient officiel** après validation par les superviseurs
- **Sert de preuve** pour les audits, les assurances, les autorités aéronautiques

### Les trois états fondamentaux d'un CRV

#### CRV BROUILLON
- **Fonction** : Préparation, anticipation, ajustements libres
- **Réalité terrain** : L'agent opération saisit ce qu'il sait au fur et à mesure
- **Caractéristique** : Modifiable sans restriction
- **Exemple** : "Vol AF123 prévu demain, 150 passagers estimés, pas encore de détails fret"

#### CRV EN COURS / TERMINÉ
- **Fonction** : Suivi opérationnel actif, enregistrement des événements réels
- **Réalité terrain** : Les données sont mises à jour en temps réel par les équipes au sol
- **Caractéristique** : Modifiable avec traçabilité des changements
- **Exemple** : "Embarquement débuté, 147 passagers effectifs, incident mineur bagages (résolu)"

#### CRV VALIDÉ / VERROUILLÉ
- **Fonction** : Document officiel, archivage, conformité
- **Réalité terrain** : Le superviseur confirme que tout est cohérent et conforme
- **Caractéristique** : Immuable, horodaté, traçable
- **Exemple** : "Vol AF123 clôturé, 147 PAX, 2500kg fret, aucun incident majeur, validé par J. Dupont le 05/01/2026 14:32"

### Principe clé : Traçabilité dès la création

**Tout CRV est traçable dès sa création**, même s'il n'est pas encore validé.

**Pourquoi ?**
- Un vol peut être annulé avant même d'avoir démarré → il faut savoir qu'il était prévu
- Un incident peut survenir pendant la préparation → il faut pouvoir le documenter
- Les décisions opérationnelles doivent être justifiables → même en brouillon, on trace qui a fait quoi et quand

**Conséquence technique** : Chaque création, modification, suppression est enregistrée dans un journal d'audit (UserActivityLog), indépendamment du statut du CRV.

---

## 2️⃣ PROCESS MÉTIER RÉEL – VUE D'ENSEMBLE

### Le cycle complet d'un vol, de la planification à l'archivage

#### ÉTAPE 1 : PRÉVISION & PLANIFICATION (Extension 1)

**Contexte opérationnel :**
Une compagnie aérienne planifie ses vols plusieurs mois à l'avance (programme hiver, programme été).

**Besoin métier :**
Anticiper les ressources humaines, matérielles, logistiques.

**Réalisation système :**
Création d'un **Programme Vol Saisonnier** (ex: "Programme Hiver 2025-2026") contenant des vols récurrents (AF123 tous les lundis et jeudis).

**Bénéfice :**
- Visibilité à long terme
- Allocation budgétaire
- Planification des équipes

---

#### ÉTAPE 2 : VOL PLANIFIÉ OU HORS PROGRAMME (Extension 2)

**Contexte opérationnel :**
Certains vols sont prévus dans le programme saisonnier, d'autres sont exceptionnels (charters, vols médicaux, vols techniques).

**Besoin métier :**
Distinguer les vols réguliers des vols exceptionnels pour :
- Gérer différemment les ressources
- Facturer différemment
- Prioriser différemment en cas de conflit

**Réalisation système :**
Chaque vol peut être :
- **Lié à un programme** : Vol régulier, prévisible
- **Marqué hors programme** : Vol exceptionnel, avec raison (CHARTER, MEDICAL, TECHNIQUE, etc.)

**Bénéfice :**
- Statistiques fiables (taux de ponctualité sur vols réguliers vs. charters)
- Gestion des priorités opérationnelles
- Reporting différencié

---

#### ÉTAPE 3 : CRÉATION DU CRV – BROUILLON VIVANT (Fonctionnalité de base)

**Contexte opérationnel :**
2 jours avant le vol, l'agent opération crée le CRV pour commencer à préparer l'opération.

**Besoin métier :**
Pouvoir travailler sur le CRV **avant** que toutes les informations soient disponibles.

**Réalisation système :**
- CRV créé avec statut **BROUILLON**
- Informations minimales : numéro de vol, date, compagnie
- Informations complémentaires ajoutées progressivement : avion assigné, équipage, horaires prévisionnels

**Bénéfice :**
- Pas de blocage opérationnel ("je ne peux pas créer le CRV car je n'ai pas encore toutes les infos")
- Souplesse terrain
- Réalisme du processus

---

#### ÉTAPE 4 : SUIVI OPÉRATIONNEL TERRAIN – PHASES, PASSAGERS, FRET, INCIDENTS

**Contexte opérationnel :**
Le jour J, l'équipe au sol exécute les opérations : check-in, embarquement, chargement fret, préparation avion.

**Besoin métier :**
Enregistrer en temps réel ce qui se passe, pour :
- Savoir où en est l'opération
- Identifier les blocages
- Documenter les incidents

**Réalisation système :**

##### a) Phases opérationnelles (Fonctionnalité de base + SLA Extension 8)
- Chaque opération (check-in, embarquement, chargement, etc.) est une **Phase**
- Chaque phase a un statut : EN_ATTENTE → EN_COURS → TERMINEE
- Chaque phase a des horaires réels : heure de début, heure de fin
- **Alertes SLA** si une phase prend trop de temps (ex: embarquement dépasse 2h)

##### b) Passagers détaillés (Extension 4)
- Nombre de passagers par catégorie : bébés, enfants, adultes, seniors
- Classes : première, affaires, économique
- Besoins médicaux : oxygène à bord, brancardier, accompagnement médical
- Passagers à mobilité réduite (PMR), mineurs non accompagnés (MINA)

**Pourquoi ce niveau de détail ?**
- Conformité réglementaire (déclaration obligatoire des PMR, MINA)
- Facturation différenciée par classe
- Gestion des ressources (ex: brancardier requis)
- Sécurité (ex: trop de bébés = problème oxygène d'urgence)

##### c) Fret détaillé (Extension 5)
- Catégories : postal, courrier express, marchandise générale, denrées périssables, animaux vivants, véhicules
- **Marchandises dangereuses (DGR)** : explosifs, liquides inflammables, gaz comprimés
  - Code ONU (ex: UN1203 pour essence)
  - Classe ONU (1 à 9)
  - Quantité, unité, groupe d'emballage
  - Validation de conformité

**Pourquoi ce niveau de détail ?**
- **Sécurité aérienne** : les marchandises dangereuses peuvent causer des accidents
- **Conformité IATA/OACI** : réglementation internationale stricte
- **Responsabilité juridique** : en cas d'incident, la compagnie doit prouver qu'elle a respecté les procédures
- **Facturation** : le transport de DGR est facturé différemment

##### d) Incidents et événements (Fonctionnalité de base)
- Tout incident est enregistré : retard technique, bagages perdus, passager perturbateur
- Gravité : MINEURE, MODEREE, MAJEURE, CRITIQUE
- Actions correctives prises

**Pourquoi ?**
- Traçabilité pour les assurances
- Amélioration continue (analyse des incidents récurrents)
- Notification automatique des managers en cas d'incident critique (Extension 7)

---

#### ÉTAPE 5 : AJUSTEMENTS ET DÉCISIONS OPÉRATIONNELLES

**Contexte opérationnel :**
Pendant la préparation du vol, des imprévus surviennent :
- Un passager ne se présente pas (no-show)
- Du fret supplémentaire arrive à la dernière minute
- Un incident technique retarde l'embarquement
- L'avion assigné change (panne, réaffectation)

**Besoin métier :**
Pouvoir **modifier le CRV** en temps réel tout en gardant une trace de ce qui a changé.

**Réalisation système :**
- Le CRV reste modifiable tant qu'il n'est pas VALIDÉ
- **Chaque modification est tracée** (qui, quand, quoi) dans le journal d'audit
- Les données antérieures ne sont pas écrasées, elles sont historisées

**Exemple concret :**
- CRV créé : 150 passagers prévus
- Mise à jour J-1 : 147 passagers (3 annulations)
- Mise à jour J (2h avant départ) : 149 passagers (2 passagers standby embarqués)
- **L'historique complet est conservé**

**Bénéfice :**
- Réactivité opérationnelle
- Justification des décisions ("pourquoi avez-vous embarqué 2 passagers en plus ?")
- Analyse post-vol fiable

---

#### ÉTAPE 6 : VALIDATION FINALE (Workflow de validation)

**Contexte opérationnel :**
Le vol est parti, toutes les opérations sont terminées. Le superviseur vérifie que le CRV est complet et cohérent.

**Besoin métier :**
Transformer le CRV vivant en **document officiel** :
- Qui ne pourra plus être modifié
- Qui servira de référence pour les audits
- Qui sera archivé officiellement

**Réalisation système :**
- Le superviseur change le statut du CRV : TERMINE → **VALIDE**
- Le système vérifie automatiquement :
  - La complétude (toutes les phases sont terminées ?)
  - La cohérence (le nombre de passagers correspond aux charges enregistrées ?)
  - La conformité (les délais SLA sont-ils respectés ou justifiés ?)
- Si OK : le CRV passe en statut **VERROUILLE**
- Si KO : le CRV est rejeté avec commentaires (à corriger avant nouvelle soumission)

**Bénéfice :**
- Qualité garantie des CRV validés
- Pas de CRV incomplet archivé
- Responsabilité claire (qui a validé quoi et quand)

---

#### ÉTAPE 7 : ANNULATION EXCEPTIONNELLE (Extension 6)

**Contexte opérationnel :**
Un vol est annulé (météo, panne technique, grève, etc.) alors que le CRV était déjà créé, voire en cours de préparation.

**Besoin métier :**
Conserver la trace de ce vol annulé :
- Pour justifier les coûts engagés (équipes mobilisées, avion réservé)
- Pour analyser les causes d'annulation
- Pour rembourser les passagers
- Pour facturer les clients (fret déjà traité)

**Réalisation système :**
- Un CRV peut passer en statut **ANNULE**
- La raison d'annulation est obligatoire (météo, technique, commercial, autre)
- Un commentaire libre peut être ajouté
- **L'ancien statut est sauvegardé** (ex: le CRV était EN_COURS avant annulation)
- Le CRV annulé peut être **réactivé** si nécessaire (ex: vol reprogrammé)

**Bénéfice :**
- Traçabilité totale (rien n'est perdu)
- Statistiques fiables (taux d'annulation par cause)
- Justification financière (coûts non récupérables)

---

#### ÉTAPE 8 : ARCHIVAGE ET EXPLOITATION POST-VOL

**Contexte opérationnel :**
Le CRV validé doit être archivé pour :
- Conservation légale (7 ans minimum selon réglementation aéronautique)
- Audits qualité / sécurité
- Litiges clients / assurances
- Analyses statistiques

**Réalisation système :**
- Le CRV validé est exporté en PDF
- Le PDF est archivé sur Google Drive (ou autre système de stockage sécurisé)
- Le lien vers le PDF est conservé dans le CRV
- Le CRV reste consultable dans le système mais n'est plus modifiable

**Bénéfice :**
- Conformité légale
- Preuve en cas de litige
- Facilité d'accès pour les audits

---

## 3️⃣ USER STORIES MÉTIER

### Pourquoi cette section est critique

Les **User Stories** démontrent que chaque fonctionnalité technique répond à un **besoin terrain réel**, exprimé par les utilisateurs métier.

Format : **"En tant que [RÔLE], je veux [ACTION] afin de [BÉNÉFICE]"**

---

### 📌 PLANIFICATION & ANTICIPATION

#### US-01 : Planification saisonnière
**En tant que chef d'opérations,**
**Je veux** créer un programme de vols saisonnier (hiver, été) avec des vols récurrents,
**Afin de** anticiper les ressources humaines (agents, superviseurs) et matérielles (avions, matériel au sol) sur plusieurs mois.

**Extension concernée** : Extension 1 (Programme vol saisonnier)
**Fonctionnalité** : POST /api/programmes-vol
**Moment du process** : 3 à 6 mois avant la saison

---

#### US-02 : Visibilité des vols programmés
**En tant que manager,**
**Je veux** consulter tous les vols liés au programme hiver 2025-2026,
**Afin de** allouer le budget et valider les contrats avec les partenaires (handling, catering).

**Extension concernée** : Extension 1
**Fonctionnalité** : GET /api/programmes-vol/:id/vols
**Moment du process** : Planification budgétaire

---

#### US-03 : Gestion des vols exceptionnels
**En tant qu'agent opération,**
**Je veux** créer un vol hors programme (charter médical urgent) tout en précisant la raison,
**Afin de** le prioriser par rapport aux vols réguliers et justifier l'allocation de ressources exceptionnelles.

**Extension concernée** : Extension 2 (Vol hors programme)
**Fonctionnalité** : POST /api/vols/:id/marquer-hors-programme
**Moment du process** : J-1 ou le jour même (urgence)

---

### 📌 CRÉATION & PRÉPARATION DU CRV

#### US-04 : Création anticipée du CRV
**En tant qu'agent opération,**
**Je veux** créer un CRV brouillon 2 jours avant le vol, même si je n'ai pas encore toutes les informations (avion assigné, nombre exact de passagers),
**Afin de** commencer à préparer l'opération sans attendre la dernière minute.

**Extension concernée** : Fonctionnalité de base (CRV)
**Fonctionnalité** : POST /api/crv
**Moment du process** : J-2 à J-1

---

#### US-05 : Assignation de l'avion
**En tant que coordinateur flotte,**
**Je veux** assigner un avion spécifique (immatriculation F-HBCA) au vol AF123 et enregistrer sa configuration (180 sièges économique, 20 sièges affaires),
**Afin de** vérifier que la capacité correspond à la réservation et éviter le surbooking.

**Extension concernée** : Extension 3 (Version et configuration avion)
**Fonctionnalité** : PUT /api/avions/:id/configuration
**Moment du process** : J-1

---

### 📌 SUIVI OPÉRATIONNEL TERRAIN

#### US-06 : Enregistrement des passagers détaillés
**En tant qu'agent check-in,**
**Je veux** enregistrer le nombre exact de passagers par catégorie (12 bébés, 30 enfants, 100 adultes, 5 PMR, 2 mineurs non accompagnés),
**Afin de** respecter la réglementation (déclaration obligatoire PMR/MINA) et préparer les ressources nécessaires (brancardier, personnel d'assistance).

**Extension concernée** : Extension 4 (Passagers détaillés)
**Fonctionnalité** : PUT /api/charges/:id/categories-detaillees
**Moment du process** : Pendant le check-in (H-2 à H-1)

---

#### US-07 : Déclaration de fret dangereux
**En tant qu'agent fret,**
**Je veux** déclarer une marchandise dangereuse (UN1203 Essence, Classe 3, 500 litres) avec validation de conformité,
**Afin de** respecter la réglementation IATA et garantir la sécurité du vol (séparation des produits incompatibles, notification au commandant de bord).

**Extension concernée** : Extension 5 (Fret détaillé - DGR)
**Fonctionnalité** : POST /api/charges/:id/marchandises-dangereuses
**Moment du process** : Pendant le chargement fret (H-3 à H-1)

---

#### US-08 : Suivi des phases opérationnelles
**En tant que coordinateur sol,**
**Je veux** suivre en temps réel l'avancement des phases (check-in terminé à 10h45, embarquement en cours depuis 11h10),
**Afin de** savoir si on est en avance, dans les temps, ou en retard, et ajuster les ressources si nécessaire.

**Extension concernée** : Fonctionnalité de base (Phases)
**Fonctionnalité** : POST /api/phases, PUT /api/phases/:id
**Moment du process** : En continu le jour J

---

#### US-09 : Enregistrement d'un incident
**En tant qu'agent opération,**
**Je veux** enregistrer un incident mineur (bagage égaré, passager perturbateur, retard technique de 15 minutes) avec la gravité et les actions correctives,
**Afin de** tracer l'événement pour le débriefing post-vol et l'assurance qualité.

**Extension concernée** : Fonctionnalité de base (Événements)
**Fonctionnalité** : POST /api/crv/:id/evenements
**Moment du process** : Dès que l'incident survient

---

### 📌 AJUSTEMENTS & DÉCISIONS

#### US-10 : Modification de dernière minute
**En tant qu'agent opération,**
**Je veux** mettre à jour le nombre de passagers effectifs (147 au lieu de 150 prévus) à H-1,
**Afin de** refléter la réalité terrain et ajuster le centrage de l'avion.

**Extension concernée** : Fonctionnalité de base (CRV modifiable)
**Fonctionnalité** : PATCH /api/crv/:id
**Moment du process** : H-1 à H-0

---

#### US-11 : Changement d'avion
**En tant que coordinateur flotte,**
**Je veux** changer l'avion assigné au vol (de F-HBCA à F-HBCD) suite à une panne technique,
**Afin de** éviter l'annulation du vol et garder une trace de ce changement exceptionnel.

**Extension concernée** : Extension 3 (Configuration avion) + Traçabilité
**Fonctionnalité** : PATCH /api/crv/:id (changement avion) + UserActivityLog
**Moment du process** : H-4 à H-2 (urgence)

---

### 📌 VALIDATION & CONTRÔLE QUALITÉ

#### US-12 : Validation du CRV
**En tant que superviseur,**
**Je veux** valider le CRV après le départ du vol, en vérifiant que toutes les phases sont terminées et que les données sont cohérentes,
**Afin de** transformer le CRV vivant en document officiel archivable et auditable.

**Extension concernée** : Workflow de validation (base)
**Fonctionnalité** : POST /api/validation/valider/:id
**Moment du process** : H+1 à H+4 après le départ

---

#### US-13 : Rejet du CRV incomplet
**En tant que superviseur,**
**Je veux** rejeter un CRV incomplet (phase embarquement non terminée, nombre de passagers incohérent) avec commentaires explicatifs,
**Afin de** obliger l'agent opération à corriger les erreurs avant archivage officiel.

**Extension concernée** : Workflow de validation
**Fonctionnalité** : POST /api/validation/rejeter/:id
**Moment du process** : Après tentative de validation

---

### 📌 ANNULATION & TRAÇABILITÉ

#### US-14 : Annulation de vol avec justification
**En tant que chef d'opérations,**
**Je veux** annuler un CRV (vol annulé pour météo défavorable) tout en conservant toutes les données déjà saisies,
**Afin de** justifier les coûts engagés et analyser les causes d'annulation pour améliorer la planification.

**Extension concernée** : Extension 6 (Statut ANNULE)
**Fonctionnalité** : POST /api/crv/:id/annuler
**Moment du process** : Quand la décision d'annulation est prise

---

#### US-15 : Réactivation d'un vol annulé
**En tant que chef d'opérations,**
**Je veux** réactiver un CRV annulé (vol reprogrammé pour le lendemain),
**Afin de** récupérer toutes les données déjà saisies sans devoir tout ressaisir.

**Extension concernée** : Extension 6
**Fonctionnalité** : POST /api/crv/:id/reactiver
**Moment du process** : Décision de reprogrammation

---

#### US-16 : Consultation de l'historique complet
**En tant que responsable qualité,**
**Je veux** consulter l'historique complet d'un CRV (qui a créé, qui a modifié, quand, quelles données ont changé),
**Afin de** auditer les processus et identifier les sources d'erreur récurrentes.

**Extension concernée** : Traçabilité (UserActivityLog)
**Fonctionnalité** : Consultation du journal d'audit
**Moment du process** : Post-vol, audits qualité

---

### 📌 NOTIFICATIONS & ALERTES

#### US-17 : Notification d'incident critique
**En tant que manager,**
**Je veux** être notifié immédiatement (notification in-app + email) quand un incident critique survient sur un vol,
**Afin de** prendre des décisions rapides (réaffectation de ressources, communication client).

**Extension concernée** : Extension 7 (Notifications)
**Fonctionnalité** : Notification automatique (service notification.service.js)
**Moment du process** : Dès l'enregistrement de l'incident critique

---

#### US-18 : Badge de notifications non lues
**En tant qu'agent opération,**
**Je veux** voir un badge sur mon interface indiquant le nombre de notifications non lues,
**Afin de** ne pas manquer d'information importante (alerte SLA, validation refusée, incident sur un autre vol).

**Extension concernée** : Extension 7
**Fonctionnalité** : GET /api/notifications/count-non-lues
**Moment du process** : En continu

---

### 📌 SLA & PILOTAGE PROACTIF

#### US-19 : Alerte SLA avant dépassement
**En tant que manager,**
**Je veux** être alerté quand un CRV approche du dépassement de SLA (75% du délai écoulé),
**Afin de** intervenir avant qu'il ne soit trop tard (relancer l'agent, réaffecter la tâche).

**Extension concernée** : Extension 8 (Alertes SLA)
**Fonctionnalité** : POST /api/sla/surveiller/crv
**Moment du process** : Surveillance automatique (CRON job)

---

#### US-20 : Rapport SLA global
**En tant que direction,**
**Je veux** consulter un rapport global des SLA (combien de CRV en alerte, combien dépassés, par statut),
**Afin de** identifier les goulets d'étranglement et améliorer les processus.

**Extension concernée** : Extension 8
**Fonctionnalité** : GET /api/sla/rapport
**Moment du process** : Revue hebdomadaire/mensuelle

---

#### US-21 : Configuration des SLA personnalisés
**En tant qu'administrateur,**
**Je veux** configurer les SLA selon les besoins de mon organisation (48h au lieu de 72h pour validation),
**Afin de** adapter le système aux contraintes réelles de mon exploitation.

**Extension concernée** : Extension 8
**Fonctionnalité** : PUT /api/sla/configuration
**Moment du process** : Configuration initiale / ajustement

---

### 📌 ANALYSE & AMÉLIORATION CONTINUE

#### US-22 : Statistiques passagers
**En tant que responsable commercial,**
**Je veux** obtenir des statistiques détaillées sur les passagers (répartition par classe, taux de PMR, taux de MINA),
**Afin de** adapter l'offre commerciale et améliorer la qualité de service.

**Extension concernée** : Extension 4
**Fonctionnalité** : GET /api/charges/statistiques/passagers
**Moment du process** : Analyses mensuelles/trimestrielles

---

#### US-23 : Statistiques fret et marchandises dangereuses
**En tant que responsable sûreté,**
**Je veux** obtenir des statistiques sur les marchandises dangereuses transportées (types, quantités, incidents),
**Afin de** évaluer les risques et former les équipes.

**Extension concernée** : Extension 5
**Fonctionnalité** : GET /api/charges/statistiques/fret
**Moment du process** : Analyses de sûreté (trimestrielles)

---

#### US-24 : Statistiques des annulations
**En tant que direction,**
**Je veux** connaître le taux d'annulation par cause (météo, technique, commercial),
**Afin de** identifier les axes d'amélioration (maintenance préventive, meilleurs contrats météo).

**Extension concernée** : Extension 6
**Fonctionnalité** : GET /api/crv/statistiques/annulations
**Moment du process** : Revues stratégiques

---

### 📌 CONFORMITÉ & AUDIT

#### US-25 : Export PDF pour archivage
**En tant que responsable qualité,**
**Je veux** exporter un CRV validé en PDF et l'archiver automatiquement sur Google Drive,
**Afin de** respecter les obligations légales de conservation (7 ans) et faciliter les audits.

**Extension concernée** : Archivage Google Drive (base)
**Fonctionnalité** : POST /api/crv/:id/archive
**Moment du process** : Après validation

---

#### US-26 : Consultation des CRV annulés
**En tant qu'auditeur externe,**
**Je veux** consulter tous les CRV annulés sur une période donnée avec les raisons,
**Afin de** vérifier la conformité des processus et l'absence de fraude.

**Extension concernée** : Extension 6
**Fonctionnalité** : GET /api/crv/annules?dateDebut=2025-01-01&dateFin=2025-12-31
**Moment du process** : Audit annuel

---

## 4️⃣ ARCHITECTURE FONCTIONNELLE – JUSTIFICATION DES CHOIX

### Principe directeur : La technique sert le process, pas l'inverse

Chaque choix technique a été guidé par une **contrainte métier réelle**.

---

### Choix 1 : CRV modifiable jusqu'à validation

**Contrainte métier :**
Un vol est une opération vivante. Les imprévus sont la norme, pas l'exception.

**Choix technique :**
Le CRV reste en statut BROUILLON / EN_COURS / TERMINE tant qu'il n'est pas VALIDÉ.

**Alternative écartée :**
Créer un CRV figé dès le départ → **irréaliste**, obligerait à créer plusieurs versions ou à tricher sur les données.

**Bénéfice :**
- Réalisme terrain
- Flexibilité opérationnelle
- Pas de contournement du système

---

### Choix 2 : Traçabilité systématique (UserActivityLog)

**Contrainte métier :**
En cas de litige (assurance, client, autorité), il faut prouver qui a fait quoi et quand.

**Choix technique :**
Chaque création, modification, suppression génère une entrée dans le journal d'audit (UserActivityLog).

**Alternative écartée :**
Tracer uniquement les CRV validés → **insuffisant**, les incidents peuvent survenir avant validation.

**Bénéfice :**
- Preuve en cas de litige
- Analyse des erreurs récurrentes
- Responsabilisation des équipes

---

### Choix 3 : Séparation passagers basiques / passagers détaillés

**Contrainte métier :**
Certains vols nécessitent un niveau de détail (réglementation PMR, vols internationaux), d'autres non (vols domestiques simples).

**Choix technique :**
- Champs basiques : `nombrePassagers` (toujours renseigné)
- Champs détaillés : `categoriesPassagersDetaillees` (optionnel, activé via flag `utiliseCategoriesDetaillees`)

**Alternative écartée :**
Rendre tous les champs détaillés obligatoires → **surcharge** pour les vols simples.

**Bénéfice :**
- Flexibilité (simple ou détaillé selon le besoin)
- Pas de régression (les CRV existants continuent de fonctionner)
- Conformité réglementaire garantie quand nécessaire

---

### Choix 4 : Marchandises dangereuses en sous-structure

**Contrainte métier :**
Les marchandises dangereuses (DGR) sont une exception, pas la norme. Mais quand elles sont présentes, elles doivent être tracées précisément (code ONU, classe, quantité).

**Choix technique :**
- Champ simple : `typeFret` (STANDARD, DANGEREUX, PERISSABLE, etc.)
- Sous-structure optionnelle : `fretDetaille.marchandisesDangereuses.details[]` avec validation

**Alternative écartée :**
Créer une table séparée "MarchandisesDangereuses" → **complexité** inutile pour une exception.

**Bénéfice :**
- Simplicité pour les vols sans DGR
- Rigueur pour les vols avec DGR
- Validation de conformité (code ONU, classe, quantité)

---

### Choix 5 : Statut ANNULE au lieu de suppression

**Contrainte métier :**
Un vol annulé génère des coûts (équipes mobilisées, avion réservé). Il faut garder la trace.

**Choix technique :**
Ajout d'un statut **ANNULE** avec raison, commentaire, ancien statut.

**Alternative écartée :**
Supprimer le CRV → **perte de traçabilité**, impossible de justifier les coûts.

**Bénéfice :**
- Traçabilité totale
- Justification des coûts non récupérables
- Statistiques fiables (taux d'annulation par cause)

---

### Choix 6 : Notifications in-app + email (canaux multiples)

**Contrainte métier :**
Les utilisateurs ne sont pas toujours devant l'écran. Il faut pouvoir les alerter par plusieurs canaux.

**Choix technique :**
- Modèle Notification avec champs `canaux.email`, `canaux.sms`, `canaux.push`, `canaux.inApp`
- Fonctions email existantes préservées (pas de régression)
- Nouvelles fonctions in-app ajoutées

**Alternative écartée :**
Uniquement email ou uniquement in-app → **inefficace**, certains utilisateurs ne consultent pas leurs emails en temps réel.

**Bénéfice :**
- Garantie de réception (multi-canal)
- Flexibilité selon le contexte (urgence = email + SMS, info = in-app)
- Historique consultable (notifications archivées)

---

### Choix 7 : Alertes SLA préventives (75%, 90%, 100%)

**Contrainte métier :**
Attendre le dépassement de SLA pour réagir est trop tard. Il faut anticiper.

**Choix technique :**
- Seuil WARNING à 75% (alerte précoce)
- Seuil CRITICAL à 90% (alerte urgente)
- Seuil EXCEEDED à 100% (dépassement constaté)

**Alternative écartée :**
Alerter uniquement à 100% → **réactif** au lieu de **proactif**, inefficace.

**Bénéfice :**
- Temps de réaction
- Priorisation des actions
- Réduction du taux de dépassement

---

### Choix 8 : Configuration SLA personnalisable

**Contrainte métier :**
Chaque exploitation a ses propres contraintes (taille de l'aéroport, nombre d'agents, types de vols).

**Choix technique :**
SLA configurables via API (PUT /api/sla/configuration).

**Alternative écartée :**
SLA fixes en dur dans le code → **rigidité**, inadapté aux contextes différents.

**Bénéfice :**
- Adaptation au contexte
- Évolutivité (ajuster les SLA selon les retours terrain)
- Réalisme (pas de SLA théoriques irréalisables)

---

## 5️⃣ TRAÇABILITÉ & AUDIT – GARANTIE DE TRANSPARENCE

### Principe : Rien n'est perdu, tout est traçable

**Objectif métier :**
En cas de litige, d'audit, ou d'analyse, pouvoir répondre aux questions :
- Qui a créé ce CRV ?
- Qui l'a modifié et quand ?
- Quelles données ont changé ?
- Pourquoi ce vol a été annulé ?
- Qui a validé ce CRV ?

---

### Mécanisme 1 : Journal d'audit (UserActivityLog)

**Fonctionnement :**
Chaque action significative génère une entrée dans le journal d'audit :
- Création de CRV
- Modification de CRV
- Ajout de charge opérationnelle
- Ajout d'événement
- Validation
- Rejet
- Annulation
- Changement de configuration avion
- Ajout de marchandise dangereuse

**Données enregistrées :**
- Qui (utilisateur)
- Quand (timestamp)
- Quoi (action : CREATE, UPDATE, DELETE, etc.)
- Sur quoi (type de modèle : CRV, Vol, Phase, etc. + ID)
- Détails (données avant/après)

**Bénéfice :**
- Réponse aux questions "qui a fait quoi"
- Analyse des erreurs récurrentes
- Preuve en cas de litige

---

### Mécanisme 2 : Horodatage automatique

**Fonctionnement :**
Chaque document a des champs `createdAt` et `updatedAt` gérés automatiquement par Mongoose (base de données).

**Bénéfice :**
- Pas d'oubli (automatique)
- Cohérence (même format partout)
- Fiabilité (timestamp serveur, pas client)

---

### Mécanisme 3 : Soft delete (statut ANNULE au lieu de suppression)

**Fonctionnement :**
Les CRV annulés ne sont pas supprimés de la base de données, ils passent en statut ANNULE.

**Bénéfice :**
- Récupération possible (réactivation)
- Statistiques fiables (combien de vols annulés par mois ?)
- Justification des coûts

---

### Mécanisme 4 : Historique des versions (avions)

**Fonctionnement :**
Quand la configuration d'un avion change (ex: passage de 180 à 190 sièges), l'ancienne configuration est sauvegardée dans `historiqueVersions[]`.

**Bénéfice :**
- Savoir quelle configuration était active à une date donnée
- Analyser l'impact des changements de configuration
- Rollback possible

---

## 6️⃣ WORKFLOW DE VALIDATION – QUALITÉ GARANTIE

### Principe : Un CRV validé est un CRV de qualité

**Objectif métier :**
Éviter que des CRV incomplets, incohérents ou non conformes soient archivés et considérés comme officiels.

---

### Étape 1 : Complétude (validation automatique)

**Vérifications système :**
- Toutes les phases obligatoires sont-elles terminées ?
- Le nombre de passagers est-il renseigné ?
- Le fret est-il déclaré ?
- Les marchandises dangereuses sont-elles validées ?

**Si OK → passage à l'étape 2**
**Si KO → rejet automatique avec message d'erreur explicite**

---

### Étape 2 : Cohérence (validation manuelle superviseur)

**Vérifications superviseur :**
- Le nombre de passagers correspond-il aux charges enregistrées ?
- Les horaires de phases sont-ils cohérents (pas de chevauchement) ?
- Les incidents majeurs sont-ils documentés ?

**Si OK → validation**
**Si KO → rejet avec commentaires**

---

### Étape 3 : Validation finale

**Action superviseur :**
Le superviseur clique sur "Valider".

**Effet système :**
- Statut passe de TERMINE à **VALIDE**
- Le CRV devient **VERROUILLE** (non modifiable)
- Notification envoyée au créateur du CRV
- Le CRV est prêt pour archivage

**Traçabilité :**
- Qui a validé (ID superviseur)
- Quand (timestamp)

---

### Étape 4 : Rejet (si non conforme)

**Action superviseur :**
Le superviseur clique sur "Rejeter" et ajoute un commentaire explicatif.

**Effet système :**
- Statut reste TERMINE
- Notification envoyée au créateur du CRV avec les commentaires
- Le créateur corrige les erreurs
- Le créateur remet le CRV en validation

**Bénéfice :**
- Pas de CRV incomplet archivé
- Amélioration continue (les erreurs récurrentes sont identifiées)
- Responsabilisation (le créateur doit corriger)

---

## 7️⃣ SLA, ALERTES & PILOTAGE – PROACTIVITÉ OPÉRATIONNELLE

### Principe : Anticiper au lieu de subir

**Objectif métier :**
L'objectif principal d'une opération aérienne est **le respect de l'heure de départ** (OTP - On-Time Performance).

Tout retard a un coût :
- Pénalités clients
- Compensation passagers (réglementation UE261)
- Effet domino (retard sur les vols suivants)
- Image de marque

**Solution système :**
Alerter **avant** que le retard ne soit irréversible.

---

### Pourquoi les alertes sont préventives, pas prescriptives

**Principe :**
Les alertes SLA **informent**, elles ne **décident** pas.

**Exemple concret :**
- Alerte WARNING : "Le CRV AF123 est en préparation depuis 40h (SLA: 48h). Il reste 8h pour terminer."
- **L'alerte ne dit PAS** : "Vous devez valider maintenant."
- **L'alerte dit** : "Faites attention, le délai approche."

**Pourquoi ?**
Parce que les décisions opérationnelles dépendent du contexte :
- Le CRV peut être bloqué en attente d'une information externe (fret retardé, douanes)
- Le superviseur peut être absent (congé, urgence)
- Le vol peut être exceptionnel (charter avec délai négocié différent)

**Bénéfice :**
- Autonomie décisionnelle préservée
- Pas de pression artificielle ("le système me force à valider")
- Aide à la priorisation ("je traite d'abord les CRV en alerte CRITICAL")

---

### Comment les alertes aident à tenir l'objectif : l'heure de départ

**Cascade SLA :**

1. **Phase check-in** : SLA 2h → Alerte si dépassement → Risque : retard embarquement
2. **Phase embarquement** : SLA 1h → Alerte si dépassement → Risque : retard départ
3. **Validation CRV** : SLA 72h après atterrissage → Alerte si dépassement → Risque : CRV non archivé dans les délais légaux

**Bénéfice global :**
- Les alertes **remontent les problèmes** avant qu'ils n'impactent le départ
- Les managers peuvent **réaffecter les ressources** (ex: ajouter un agent check-in si la phase prend trop de temps)
- Les statistiques SLA permettent d'**identifier les goulets d'étranglement** (ex: la phase chargement fret dépasse systématiquement son SLA → besoin de plus de manutentionnaires)

---

### Configuration adaptable

**Principe :**
Les SLA par défaut sont des **propositions**, pas des obligations.

**Fonctionnalité :**
PUT /api/sla/configuration permet de modifier les SLA selon le contexte de l'exploitation.

**Exemples d'ajustement :**
- Aéroport de petite taille : réduire les SLA (opérations plus rapides)
- Aéroport international : augmenter les SLA (formalités douanières longues)
- Période de crise (grève, météo) : assouplir temporairement les SLA

**Bénéfice :**
- Réalisme (pas de SLA théoriques inatteignables)
- Évolutivité (ajuster selon les retours terrain)

---

## 8️⃣ GARANTIE DE NON-RÉGRESSION – SÉCURITÉ LONG TERME

### Discipline suivie : Aucune modification destructive

**Principe :**
Toutes les extensions ont été implémentées **sans modifier les fonctionnalités existantes**.

**Comment ?**
- **Ajout uniquement** : Nouveaux champs, nouveaux modèles, nouveaux services, nouvelles routes
- **Optionnalité** : Tous les nouveaux champs ont une valeur par défaut (null, 0, false, [])
- **Isolation** : Chaque extension est dans des fichiers séparés (pas de modification des fichiers existants, sauf ajout de lignes)

**Bénéfice :**
- **Les CRV existants continuent de fonctionner** sans migration
- **Les utilisateurs ne sont pas perturbés** (pas de changement de workflow)
- **Rollback simple** (supprimer les fichiers des extensions, restaurer les fichiers modifiés)

---

### Rollback possible pour chaque extension

**Procédure :**
Pour chaque extension, un document de justification NON-RÉGRESSION détaille :
- Les fichiers modifiés
- Les fichiers nouveaux
- La procédure de rollback étape par étape

**Exemple (Extension 6 - Statut ANNULE) :**
1. Supprimer les fichiers nouveaux : `annulation.service.js`, `annulation.controller.js`
2. Retirer l'import dans `crv.routes.js`
3. Retirer les routes annulation dans `crv.routes.js`
4. Retirer 'ANNULE' de l'enum statut dans `CRV.js`
5. Retirer le bloc annulation dans `CRV.js`
6. Redémarrer l'application

**Impact :**
- Les CRV existants (non annulés) continuent de fonctionner
- Les CRV annulés deviennent invalides (statut non reconnu) → il faut les changer manuellement avant rollback

**Bénéfice :**
- Sécurité (en cas de problème, on peut revenir en arrière)
- Confiance (le client sait qu'il peut tester sans risque)

---

### Tests de non-régression recommandés

**Principe :**
Avant de déployer une extension, vérifier que les fonctionnalités existantes fonctionnent toujours.

**Exemples de tests :**
- Créer un CRV basique (sans utiliser les extensions)
- Valider un CRV basique
- Consulter un CRV archivé
- Créer un vol sans programme saisonnier (Extension 1)
- Créer une charge passagers sans catégories détaillées (Extension 4)

**Si tous les tests passent → l'extension n'a pas cassé l'existant**

---

## 9️⃣ CONCLUSION – VALEUR CLIENT

### Robustesse : Un système qui résiste aux imprévus

**Réalisme terrain :**
Le système a été conçu pour la **réalité opérationnelle**, pas pour un monde idéal.

**Exemples :**
- Un CRV peut être créé **incomplet** (brouillon)
- Un CRV peut être **modifié** jusqu'à validation
- Un vol peut être **annulé** après préparation
- Un avion peut être **changé** à la dernière minute
- Des **incidents** peuvent survenir (et doivent être documentés)

**Conséquence :**
Le système ne bloque jamais les utilisateurs. Il accompagne, trace, alerte, mais **ne contraint pas artificiellement**.

---

### Réalisme terrain : La technique sert le process

**Principe :**
Chaque fonctionnalité répond à un **besoin métier documenté** (User Stories).

**Exemples :**
- Extensions 4 & 5 (passagers/fret détaillés) → Conformité réglementaire (PMR, DGR)
- Extension 6 (statut ANNULE) → Traçabilité des coûts non récupérables
- Extension 7 (notifications) → Réactivité opérationnelle
- Extension 8 (alertes SLA) → Proactivité, respect des délais

**Conséquence :**
Pas de fonctionnalités "gadget". Tout a une raison d'être.

---

### Auditabilité : Transparence totale

**Principe :**
Le système conserve la trace de **tout** : qui a fait quoi, quand, pourquoi.

**Bénéfice :**
- Audits qualité réussis (conformité ISO 9001, etc.)
- Litiges clients résolus (preuve des actions entreprises)
- Audits réglementaires facilités (autorités aéronautiques)
- Amélioration continue (analyse des erreurs récurrentes)

**Exemple concret :**
Un passager se plaint d'avoir été refusé à l'embarquement.
→ Le CRV montre qu'il s'est présenté 10 minutes avant départ (trop tard selon règlement).
→ Le journal d'audit montre qui a pris la décision et quand.
→ Litige résolu en faveur de la compagnie.

---

### Évolutivité : Un système qui grandit avec l'entreprise

**Architecture modulaire :**
Les 8 extensions ont été ajoutées **sans casser l'existant**.

**Conséquence :**
D'autres extensions peuvent être ajoutées dans le futur :
- Intégration avec système de billetterie
- Intégration avec système de gestion de flotte
- Intégration avec système météo
- Intégration avec système de gestion d'équipage

**Bénéfice :**
- Pas de refonte totale nécessaire
- Investissement protégé (le système évolue, il ne devient pas obsolète)
- ROI amélioré (les fonctionnalités ajoutées servent immédiatement)

---

### Sécurité : Données protégées, processus maîtrisés

**Authentification & Autorisation :**
- Toutes les routes nécessitent une authentification JWT
- Les actions sensibles (validation, annulation, configuration SLA) nécessitent des rôles spécifiques (MANAGER, ADMIN)

**Traçabilité :**
- Impossible de modifier un CRV sans laisser de trace
- Impossible de valider un CRV incomplet
- Impossible de supprimer un CRV annulé (soft delete)

**Conformité :**
- RGPD : les données personnelles sont limitées au strict nécessaire (pas de données sensibles comme religion, santé, sauf besoins médicaux justifiés)
- Réglementation aéronautique : les marchandises dangereuses sont validées selon les normes IATA/OACI

---

### Valeur business : ROI mesurable

**Gains opérationnels :**
- **Réduction des retards** : Alertes SLA préventives → actions correctives anticipées
- **Réduction des erreurs** : Validation automatique de complétude → moins de CRV incomplets archivés
- **Réduction des litiges** : Traçabilité complète → preuves en cas de conflit
- **Amélioration continue** : Statistiques détaillées → identification des goulets d'étranglement

**Gains financiers :**
- **Moins de pénalités clients** (respect des délais)
- **Moins de compensations passagers** (respect réglementation UE261)
- **Moins de coûts cachés** (temps perdu à chercher l'information, à refaire des CRV incomplets)

**Gains stratégiques :**
- **Image de marque** : Ponctualité, fiabilité
- **Conformité réglementaire** : Audits réussis, pas d'amendes
- **Compétitivité** : Processus optimisés = prix compétitifs

---

## CONCLUSION FINALE

Le système CRV Opérationnel n'est pas un simple logiciel de gestion documentaire.

**C'est un outil de pilotage opérationnel en temps réel** qui :
- **Accompagne** les équipes terrain sans les contraindre
- **Trace** toutes les actions pour garantir la transparence
- **Alerte** de manière proactive pour éviter les retards
- **Garantit** la qualité des données archivées
- **Sécurise** les processus par l'authentification et l'autorisation

**Les 8 extensions validées couvrent l'ensemble du cycle opérationnel** :
1. Planification (programmes saisonniers)
2. Distinction vols réguliers/exceptionnels
3. Gestion de la flotte (configuration avions)
4. Conformité passagers (catégories détaillées, PMR, MINA)
5. Conformité fret (marchandises dangereuses DGR)
6. Traçabilité des annulations
7. Notifications en temps réel
8. Pilotage proactif par les SLA

**Chaque extension a été justifiée par des User Stories métier**, démontrant que la technique sert le process, pas l'inverse.

**La discipline de non-régression a été respectée intégralement**, garantissant que le système reste stable, évolutif et auditable.

**Le système est maintenant prêt pour les tests, la formation des utilisateurs, et le déploiement en production.**

---

**Document rédigé par** : Assistant IA (Claude Opus 4.5)
**Date** : Janvier 2026
**Statut** : Document technique final
**Usage** : Justification client, audit qualité, documentation projet

---
