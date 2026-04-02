function isSchemaMismatchError(error) {
  return /(Invalid object name|Invalid column name|Ambiguous column name)/i.test(
    error?.message || ''
  );
}

function respondWithFallback(res, logger, scope, error, fallbackValue) {
  if (isSchemaMismatchError(error)) {
    logger.warn(`[${scope}] Schema fallback used: ${error.message}`);
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
