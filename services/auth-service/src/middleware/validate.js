module.exports = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,   // показать все ошибки сразу, не останавливаться на первой
    stripUnknown: true,  // удалить лишние поля из запроса
  });

  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(400).json({
      message: 'Validation error',
      errors,
    });
  }

  req.body = value; // перезаписать body очищенными данными
  next();
};