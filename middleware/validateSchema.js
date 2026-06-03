// middleware/validateSchema.js
const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false, // true = stops at first error; false = lists ALL missing/wrong items
      stripUnknown: true // Automatically removes fields sent by the client that aren't in your schema
    });

    if (error) {
      // Map through all errors to give a clean array of messages
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        errors: errorMessages
      });
    }

    // Crucial: Replace req.body with the sanitized, type-casted 'value'
    req.body = value;
    next();
  };
};

module.exports = validateSchema;