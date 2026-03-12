export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error:', err);

  if (err.name === 'CastError') {
    const message = 'Ressource non trouvée';
    error = { message, statusCode: 404 };
  }

  if (err.code === 11000) {
    const message = 'Valeur dupliquée détectée';
    error = { message, statusCode: 400 };
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // FIX BUG-3 CERTIFICATION: les services utilisent err.status (pas err.statusCode)
  // Le spread { ...err } sur un Error ne copie pas les propriétés custom (.status)
  // → il faut lire depuis l'objet original `err`, pas depuis la copie `error`
  const statusCode = err.status || err.statusCode || error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée - ${req.originalUrl}`
  });
};
