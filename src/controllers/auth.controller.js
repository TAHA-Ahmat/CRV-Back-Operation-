import jwt from 'jsonwebtoken';
import Personne from '../models/Personne.js';
import { config } from '../config/env.js';

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
    const { email, password } = req.body;

    if (!email || !password) {
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

    const isPasswordMatch = await personne.comparePassword(password);

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
    const { nom, prenom, matricule, email, password, fonction, specialites } = req.body;

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
      password,
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
