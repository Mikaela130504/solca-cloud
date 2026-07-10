export const formatDate = (date = new Date()) =>
  new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

export const formatTime = (date = new Date()) =>
  new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

export const toLocalDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const classNames = (...classes) => classes.filter(Boolean).join(" ");

export const calculateImc = (weight, heightCm) => {
  const parsedWeight = Number(weight);
  const parsedHeight = Number(heightCm) / 100;
  if (!parsedWeight || !parsedHeight) return "";
  return (parsedWeight / (parsedHeight * parsedHeight)).toFixed(2);
};
