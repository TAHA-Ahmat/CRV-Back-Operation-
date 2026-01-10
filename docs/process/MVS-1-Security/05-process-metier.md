# MVS-1-Security - PROCESS METIER

## Date d'audit : 2026-01-10

---

## PROCESS 1 : AUTHENTIFICATION UTILISATEUR

### Objectif metier
Permettre a un utilisateur de s'authentifier et d'obtenir un token JWT pour acceder aux ressources protegees.

### Sequence exacte

```
[Client] POST /api/auth/login
    |
    v
[Route] auth.routes.js
    |-- Middleware: validate (email, password)
    |
    v
[Controller] auth.controller.js::login
    |
    |-- 1. Extraction email + password depuis req.body
    |-- 2. Validation presence des champs
    |       |-- Si manquant: return 400
    |
    v
[Model] Personne.findOne({ email }).select('+password')
    |
    |-- Si non trouve: return 401
    |
    v
[Model] personne.comparePassword(password)
    |
    |-- 3. Verification bcrypt
    |-- Si incorrect: return 401
    |
    v
[Controller] Verification statut
    |
    |-- Si statut !== 'ACTIF': return 403
    |
    v
[Controller] generateToken(personne)
    |
    |-- 4. Creation JWT avec payload {id, nom, email, role}
    |-- Expiration: 3h
    |
    v
[Response] 200 + { token, user }
```

### Etats modifies
- Aucun etat en base modifie

### Donnees creees/modifiees
- Aucune

### Conditions de succes
1. Email existe en base
2. Password correspond au hash
3. Compte statut = 'ACTIF'

### Conditions d'echec
| Condition | Code HTTP | Message |
|-----------|-----------|---------|
| Champs manquants | 400 | "Email et mot de passe requis" |
| Email inconnu | 401 | "Identifiants invalides" |
| Password incorrect | 401 | "Identifiants invalides" |
| Compte inactif | 403 | "Compte inactif" |

---

## PROCESS 2 : INSCRIPTION UTILISATEUR

### Objectif metier
Permettre la creation d'un nouveau compte utilisateur avec attribution d'un role.

### Sequence exacte

```
[Client] POST /api/auth/register
    |
    v
[Route] auth.routes.js
    |-- Middleware: validate (nom, prenom, matricule, email, password, fonction)
    |
    v
[Controller] auth.controller.js::register
    |
    |-- 1. Extraction des champs depuis req.body
    |
    v
[Model] Personne.findOne({ $or: [{ email }, { matricule }] })
    |
    |-- 2. Verification unicite
    |-- Si existe: return 400
    |
    v
[Model] Personne.create({...})
    |
    |-- 3. Creation en base
    |-- Hook pre-save: hashage password bcrypt
    |
    v
[Controller] generateToken(personne)
    |
    |-- 4. Generation token JWT
    |
    v
[Response] 201 + { token, user }
```

### Etats modifies
- Collection Personne: +1 document

### Donnees creees
| Champ | Valeur |
|-------|--------|
| nom, prenom, matricule, email | Fournis |
| password | Hashe bcrypt |
| fonction | Fourni (enum valide) |
| statut | 'ACTIF' (defaut) |
| createdAt | Automatique |

### Conditions de succes
1. Tous les champs requis fournis
2. Email unique
3. Matricule unique
4. Fonction dans enum autorise
5. Password >= 6 caracteres

### Conditions d'echec
| Condition | Code HTTP | Message |
|-----------|-----------|---------|
| Validation echouee | 400 | Messages validation |
| Email/matricule existe | 400 | "Email ou matricule deja utilise" |

---

## PROCESS 3 : CHANGEMENT MOT DE PASSE

### Objectif metier
Permettre a un utilisateur connecte de modifier son mot de passe.

### Sequence exacte

```
[Client] POST /api/auth/changer-mot-de-passe
    |-- Header: Authorization: Bearer <token>
    |
    v
[Middleware] protect
    |-- Verification JWT
    |-- Injection req.user
    |
    v
[Route] auth.routes.js
    |-- Middleware: validate (ancienMotDePasse, nouveauMotDePasse)
    |
    v
[Controller] auth.controller.js::changerMotDePasse
    |
    |-- 1. Extraction des champs
    |-- 2. Validation longueur nouveau (>= 6)
    |
    v
[Model] Personne.findById(req.user._id).select('+password')
    |
    |-- Si non trouve: return 404
    |
    v
[Model] personne.comparePassword(ancienMotDePasse)
    |
    |-- 3. Verification ancien password
    |-- Si incorrect: return 401
    |
    v
[Model] personne.password = nouveauMotDePasse
[Model] personne.save()
    |
    |-- 4. Hook pre-save: hashage nouveau password
    |
    v
[Console] Log changement MDP
    |
    v
[Response] 200 + { message: "Mot de passe modifie avec succes" }
```

### Etats modifies
- Personne.password: Nouveau hash

### Conditions de succes
1. Token valide
2. Ancien mot de passe correct
3. Nouveau mot de passe >= 6 caracteres

### Conditions d'echec
| Condition | Code HTTP | Message |
|-----------|-----------|---------|
| Token invalide | 401 | Middleware protect |
| Champs manquants | 400 | "Ancien et nouveau mot de passe requis" |
| Nouveau trop court | 400 | "Le nouveau mot de passe doit faire au moins 6 caracteres" |
| Ancien incorrect | 401 | "Ancien mot de passe incorrect" |
| Utilisateur non trouve | 404 | "Utilisateur non trouve" |

---

## PROCESS 4 : CREATION UTILISATEUR PAR ADMIN

### Objectif metier
Permettre a un administrateur de creer un compte utilisateur avec n'importe quel role.

### Sequence exacte

```
[Client] POST /api/personnes
    |-- Header: Authorization: Bearer <token>
    |
    v
[Middleware] protect
    |-- Verification JWT
    |
    v
[Middleware] authorize('ADMIN')
    |-- Verification role ADMIN
    |-- Si non ADMIN: return 403
    |
    v
[Route] personne.routes.js
    |-- Middleware: validate
    |-- Middleware: validatePassword
    |
    v
[Controller] personne.controller.js::createPersonne
    |
    |-- 1. Si matricule absent: generation automatique
    |       Format: {PREFIX}{0001..9999}
    |       PREFIX = fonction.substring(0,3).toUpperCase()
    |
    v
[Model] Personne.findOne({ matricule })
    |-- 2. Verification unicite matricule genere
    |-- Si existe: increment suffix
    |
    v
[Model] Personne.findOne({ $or: [{ email }, { matricule }] })
    |-- 3. Verification finale unicite
    |-- Si existe: return 400
    |
    v
[Model] Personne.create({...})
    |-- 4. Creation avec tous les champs
    |
    v
[Model] Personne.findById(id).select('-password')
    |-- 5. Rechargement sans password
    |
    v
[Response] 201 + { data: personneWithId }
```

### Etats modifies
- Collection Personne: +1 document

### Donnees creees
| Champ | Source |
|-------|--------|
| matricule | Fourni ou auto-genere |
| password | Hashe bcrypt |
| fonction | Peut etre ADMIN |
| Autres | Fournis dans body |

### Conditions de succes
1. Appelant est ADMIN
2. Email unique
3. Matricule unique (ou auto-genere)
4. Password fourni

---

## PROCESS 5 : SUPPRESSION UTILISATEUR

### Objectif metier
Permettre a un administrateur de supprimer definitivement un compte utilisateur.

### Sequence exacte

```
[Client] DELETE /api/personnes/:id
    |-- Header: Authorization: Bearer <token>
    |
    v
[Middleware] protect + authorize('ADMIN')
    |
    v
[Controller] personne.controller.js::deletePersonne
    |
    |-- 1. Recherche Personne par ID
    |-- Si non trouve: return 404
    |
    v
[Controller] Verification auto-suppression
    |
    |-- 2. req.user._id === req.params.id ?
    |-- Si oui: return 400 "Vous ne pouvez pas supprimer votre propre compte"
    |
    v
[Model] personne.deleteOne()
    |
    |-- 3. Suppression definitive
    |
    v
[Response] 200 + { message: "Utilisateur supprime avec succes" }
```

### Etats modifies
- Collection Personne: -1 document

### Conditions de succes
1. Appelant est ADMIN
2. Utilisateur cible existe
3. Pas d'auto-suppression

### Points d'attention
- **AUCUNE verification de dependances** : Un utilisateur peut etre supprime meme s'il est reference ailleurs (CRV.creePar, etc.)
- Risque d'integrite referentielle

---

## SYNTHESE PROCESS MVS-1-Security

| Process | Routes | Type | Criticite |
|---------|--------|------|-----------|
| Authentification | POST /login | METIER | CRITIQUE |
| Inscription | POST /register | METIER | HAUTE |
| Changement MDP | POST /changer-mot-de-passe | METIER | HAUTE |
| Creation user (ADMIN) | POST /personnes | CRUD | MOYENNE |
| Suppression user | DELETE /personnes/:id | CRUD | HAUTE |

### Dependances inter-process
- Tous les process (sauf login/register) dependent du token JWT genere par le process d'authentification
