import jwt from 'jsonwebtoken';
import Personne from '../../models/security/Personne.js';
import { config } from '../../config/env.js';

// ✅ ALIGNÉ SUR MAGASIN : Payload enrichi (id, nom, email, role)
const generateToken = (personne) => {
  return jwt.sign(
    {
      id: personne._id,
      nom: personne.nom,
      email: personne.email,
      role: personne.fonction  // CRV utilise 'fonction' au lieu de 'role'
    },
    config.jwtSecret,
    {
      expiresIn: '3h'  // ✅ ALIGNÉ SUR MAGASIN : 3h au lieu de 24h
    }
  );
};

export const login = async (req, res, next) => {
  try {
    // Support des deux formats: password (backend) et motDePasse (frontend)
    const { email, password, motDePasse } = req.body;
    const pwd = password || motDePasse;

    if (!email || !pwd) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const personne = await Personne.findOne({ email }).select('+password');

    if (!personne) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    const isPasswordMatch = await personne.comparePassword(pwd);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    if (personne.statut !== 'ACTIF') {
      return res.status(403).json({
        success: false,
        message: 'Compte inactif'
      });
    }

    // ✅ ALIGNÉ SUR MAGASIN : Générer token avec objet complet
    const token = generateToken(personne);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: personne._id,
        nom: personne.nom,
        prenom: personne.prenom,
        email: personne.email,
        fonction: personne.fonction,
        matricule: personne.matricule
      }
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    // Support des deux formats: password (backend) et motDePasse (frontend)
    const { nom, prenom, matricule, email, password, motDePasse, fonction, specialites } = req.body;
    const pwd = password || motDePasse;

    const existingUser = await Personne.findOne({
      $or: [{ email }, { matricule }]
    });

    if (existingUser) {
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
      specialites
    });

    // ✅ ALIGNÉ SUR MAGASIN : Générer token avec objet complet
    const token = generateToken(personne);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: personne._id,
        nom: personne.nom,
        prenom: personne.prenom,
        email: personne.email,
        fonction: personne.fonction,
        matricule: personne.matricule
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const personne = await Personne.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: personne
    });
  } catch (error) {
    next(error);
  }
};

export const changerMotDePasse = async (req, res, next) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Ancien et nouveau mot de passe requis'
      });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit faire au moins 6 caractères'
      });
    }

    const personne = await Personne.findById(req.user._id).select('+password');

    if (!personne) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const isPasswordMatch = await personne.comparePassword(ancienMotDePasse);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Ancien mot de passe incorrect'
      });
    }

    personne.password = nouveauMotDePasse;
    await personne.save();

    console.log('[CRV][AUTH][CHANGEMENT_MDP]', {
      userId: personne._id,
      email: personne.email,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    next(error);
  }
};
