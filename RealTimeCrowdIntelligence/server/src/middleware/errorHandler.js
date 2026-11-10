export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed.',
      details: Object.values(error.errors).map((entry) => entry.message)
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: 'A record with this value already exists.' });
  }

  res.status(error.status || 500).json({
    message: error.message || 'Unexpected server error.'
  });
}
