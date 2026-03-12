import Personne from '../../models/security/Personne.js';

/**
 * Lister tous les utilisateurs
 * GET /api/personnes
 * Query params: page, limit, fonction, statut, search
 */
export const getAllPersonnes = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      fonction,
      statut,
      search
    } = req.query;

    const query = {};

    // Filtres
    if (fonction) query.fonction = fonction;
    if (statut) query.statut = statut;
    if (search) {
      query.$or = [
        { nom: new RegExp(search, 'i') },
        { prenom: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { matricule: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [personnes, total] = await Promise.all([
      Personne.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Personne.countDocuments(query)
    ]);

    // Ajouter un champ id pour compatibilité frontend
    const personnesWithId = personnes.map(p => {
      const obj = p.toObject();
      obj.id = obj._id.toString();
      return obj;
    });

    res.status(200).json({
      success: true,
      data: personnesWithId,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtenir un utilisateur par ID
 * GET /api/personnes/:id
 */
export const getPersonneById = async (req, res, next) => {
  try {
    const personne = await Personne.findById(req.params.id).select('-password');

    if (!personne) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Ajouter un champ id pour compatibilité frontend
    const personneWithId = personne.toObject();
    personneWithId.id = personneWithId._id.toString();

    res.status(200).json({
      success: true,
      data: personneWithId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer un nouvel utilisateur
 * POST /api/personnes
 * Réservé aux ADMIN
 */
export const createPersonne = async (req, res, next) => {
  try {
    let { nom, prenom, matricule, email, password, motDePasse, fonction, specialites, telephone, dateEmbauche } = req.body;
    const pwd = password || motDePasse;

    // Générer automatiquement un matricule si non fourni
    if (!matricule) {
      const count = await Personne.countDocuments();
      const prefix = fonction?.substring(0, 3).toUpperCase() || 'USR';
      matricule = `${prefix}${String(count + 1).padStart(4, '0')}`;

      // Vérifier l'unicité et incrémenter si nécessaire
      let suffix = 0;
      let testMatricule = matricule;
      while (await Personne.findOne({ matricule: testMatricule })) {
        suffix++;
        testMatricule = `${matricule}${suffix}`;
      }
      matricule = testMatricule;
    }

    // Vérifier si l'utilisateur existe déjà
    const existingPersonne = await Personne.findOne({
      $or: [{ email }, { matricule }]
    });

    if (existingPersonne) {
      return res.status(400).json({
        success: false,
        message: 'Email ou matricule déjà utilisé'
      });
    }

    const personne = await Personne.create({
      nom,
      prenom,
      matricule,
      email,
      password: pwd,
      fonction,
      specialites,
      telephone,
      dateEmbauche
    });

    // Retourner sans le mot de passe
    const personneData = await Personne.findById(personne._id).select('-password');

    // Ajouter un champ id pour compatibilité frontend
    const personneWithId = personneData.toObject();
    personneWithId.id = personneWithId._id.toString();

    res.status(201).json({
      success: true,
      data: personneWithId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Modifier un utilisateur
 * PUT /api/personnes/:id
 * Réservé aux ADMIN
 */
export const updatePersonne = async (req, res, next) => {
  try {
    const { nom, prenom, email, fonction, specialites, statut, telephone, dateEmbauche, password, motDePasse } = req.body;

    const personne = await Personne.findById(req.params.id);

    if (!personne) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mise à jour des champs
    if (nom) personne.nom = nom;
    if (prenom) personne.prenom = prenom;
    if (email) personne.email = email;
    if (fonction) personne.fonction = fonction;
    if (specialites) personne.specialites = specialites;
    if (statut) personne.statut = statut;
    if (telephone) personne.telephone = telephone;
    if (dateEmbauche) personne.dateEmbauche = dateEmbauche;

    // Changement de mot de passe si fourni
    const pwd = password || motDePasse;
    if (pwd) {
      personne.password = pwd;
    }

    await personne.save();

    // Retourner sans le mot de passe
    const updatedPersonne = await Personne.findById(personne._id).select('-password');

    // Ajouter un champ id pour compatibilité frontend
    const personneWithId = updatedPersonne.toObject();
    personneWithId.id = personneWithId._id.toString();

    res.status(200).json({
      success: true,
      data: personneWithId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer un utilisateur
 * DELETE /api/personnes/:id
 * Réservé aux ADMIN
 */
export const deletePersonne = async (req, res, next) => {
  try {
    const personne = await Personne.findById(req.params.id);

    if (!personne) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la suppression de son propre compte
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    await personne.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtenir les statistiques des utilisateurs
 * GET /api/personnes/stats/global
 */
export const getPersonnesStats = async (req, res, next) => {
  try {
    const [total, byFonction, byStatut] = await Promise.all([
      Personne.countDocuments(),
      Personne.aggregate([
        { $group: { _id: '$fonction', count: { $sum: 1 } } }
      ]),
      Personne.aggregate([
        { $group: { _id: '$statut', count: { $sum: 1 } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        byFonction: byFonction.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byStatut: byStatut.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};
