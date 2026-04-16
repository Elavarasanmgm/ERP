function isSchemaMismatchError(error) {
  return /(Invalid object name|Invalid column name|Ambiguous column name|relation .* does not exist|column .* does not exist|operator does not exist)/i.test(
    error?.message || ''
  );
}

function respondWithFallback(res, logger, scope, error, fallbackValue) {
  if (isSchemaMismatchError(error)) {
    logger.warn(`[${scope}] Schema fallback detected: ${error.message}`);
    // Optional: for complete debugging, we might want to throw or return 500
    // But for now, we'll keep returning fallback but LOGGING the error clearly.
    console.error(`DETAILED ERROR [${scope}]:`, error); 
    return res.json(fallbackValue);
  }

  logger.error(`[${scope}] ${error.message}`);
  return res.status(500).json({ error: `Failed to ${scope.toLowerCase()}` });
}

function respondFeatureUnavailable(res, logger, scope, error) {
  if (isSchemaMismatchError(error)) {
    logger.warn(`[${scope}] Feature unavailable with current schema: ${error.message}`);
    return res.status(501).json({
      error: 'This feature is not available with the current database schema yet.',
    });
  }

  logger.error(`[${scope}] ${error.message}`);
  return res.status(500).json({ error: `Failed to ${scope.toLowerCase()}` });
}

module.exports = {
  isSchemaMismatchError,
  respondWithFallback,
  respondFeatureUnavailable,
};
