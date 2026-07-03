export const required = (value) => {
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
};

export const onlyLetters = (value) =>
  /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(String(value).trim());

export const isEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());

export const isPhone = (value) => /^\d{10}$/.test(String(value).trim());

export const isValidDate = (value) => {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
};

export const calculateAge = (birthDate) => {
  if (!isValidDate(birthDate)) return null;
  const today = new Date();
  const birth = new Date(`${birthDate}T00:00:00`);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
};

export const isNotFutureDate = (value) => {
  if (!isValidDate(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
};

export const isValidEcuadorianCedula = (cedula) => {
  const value = String(cedula).trim();
  if (!/^\d{10}$/.test(value)) return false;

  const province = Number(value.slice(0, 2));
  const thirdDigit = Number(value[2]);
  if (province < 1 || province > 24 || thirdDigit > 5) return false;

  const digits = value.split("").map(Number);
  const verifier = digits[9];
  const sum = digits.slice(0, 9).reduce((acc, digit, index) => {
    if (index % 2 === 0) {
      const doubled = digit * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }
    return acc + digit;
  }, 0);

  const calculated = sum % 10 === 0 ? 0 : 10 - (sum % 10);
  return calculated === verifier;
};

export const validateFields = (values, rules) => {
  const errors = {};

  Object.entries(rules).forEach(([field, validators]) => {
    const value = values[field];
    const failed = validators.find((rule) => !rule.test(value, values));
    if (failed) errors[field] = failed.message;
  });

  return errors;
};

export const rule = (test, message) => ({ test, message });
