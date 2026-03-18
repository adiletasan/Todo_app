const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

exports.isValidEmail = (email) => emailRegex.test(email);
exports.isValidPassword = (password) => passwordRegex.test(password);
exports.isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
