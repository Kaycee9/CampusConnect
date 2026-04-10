/**
 * Zod validation middleware factory
 * Usage: validate(schema) — validates req.body
 * Usage: validate(schema, 'query') — validates req.query
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    req[source] = result.data; // Replace with validated + transformed data
    next();
  };
};

export default validate;
