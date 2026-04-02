const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', err.message);
  const isDiagnosticRequest = req.path.startsWith('/api/diagnostics/');

  if (isDiagnosticRequest) {
    return res.status(err.status || 500).json({
      error: err.message,
      code: err.code || null,
      name: err.name || null,
      number: err.number || null,
      state: err.state || null,
    });
  }

  if (err.status) {
    return res.status(err.status).json({
      error: err.message,
      status: err.status,
    });
  }

  // Database errors
  if (err.number && err.originalError) {
    return res.status(500).json({
      error: 'Database error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : '',
    });
  }

  // Default error
  return res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : '',
  });
};

module.exports = errorHandler;
