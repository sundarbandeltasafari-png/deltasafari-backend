// middleware/errorMiddleware.js
const errorHandler = (err, req, res, next) => {
  // Determine the status code: use the existing response status or default to 500 (Internal Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.log(err)
  res.status(statusCode).json({
    message: err.message || 'An unexpected error occurred',
    // Only show stack trace in development mode for security
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler 