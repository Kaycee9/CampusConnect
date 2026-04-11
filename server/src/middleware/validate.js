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

    if (source === 'body') {
      req.body = result.data;
    } else if (source === 'query') {
      req.validatedQuery = result.data;
    } else if (source === 'params') {
      req.validatedParams = result.data;
    } else {
      req.validatedData = result.data;
    }

    next();
  };
};

export default validate;
