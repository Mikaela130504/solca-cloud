export const LAB_PARAMETER_CATALOG = {
  "Hemograma completo": [
    { name: "Hemoglobina", unit: "g/dL", min: 12, max: 16 },
    { name: "Hematocrito", unit: "%", min: 36, max: 46 },
    { name: "Leucocitos", unit: "10^3/uL", min: 4, max: 11 },
    { name: "Plaquetas", unit: "10^3/uL", min: 150, max: 450 },
    { name: "Eritrocitos", unit: "10^6/uL", min: 4, max: 5.5 },
  ],
  "Perfil hepático": [
    { name: "AST/TGO", unit: "U/L", min: 0, max: 40 },
    { name: "ALT/TGP", unit: "U/L", min: 0, max: 41 },
    { name: "Bilirrubina total", unit: "mg/dL", min: 0.1, max: 1.2 },
    { name: "Fosfatasa alcalina", unit: "U/L", min: 44, max: 147 },
  ],
  "Perfil renal": [
    { name: "Urea", unit: "mg/dL", min: 15, max: 45 },
    { name: "Creatinina", unit: "mg/dL", min: 0.6, max: 1.3 },
    { name: "Ácido úrico", unit: "mg/dL", min: 3.5, max: 7.2 },
  ],
  "Química sanguínea": [
    { name: "Glucosa", unit: "mg/dL", min: 70, max: 110 },
    { name: "Colesterol total", unit: "mg/dL", min: 0, max: 200 },
    { name: "Triglicéridos", unit: "mg/dL", min: 0, max: 150 },
  ],
  "Marcadores tumorales": [
    { name: "CEA", unit: "ng/mL", min: 0, max: 5 },
    { name: "CA 125", unit: "U/mL", min: 0, max: 35 },
    { name: "PSA total", unit: "ng/mL", min: 0, max: 4 },
  ],
  "Coagulación": [
    { name: "TP", unit: "seg", min: 11, max: 13.5 },
    { name: "TTPa", unit: "seg", min: 25, max: 35 },
    { name: "INR", unit: "", min: 0.8, max: 1.2 },
  ],
  Glucosa: [
    { name: "Glucosa", unit: "mg/dL", min: 70, max: 110 },
  ],
  Creatinina: [
    { name: "Creatinina", unit: "mg/dL", min: 0.6, max: 1.3 },
  ],
};

export function getParametersForExam(exam) {
  return LAB_PARAMETER_CATALOG[exam] || [];
}

export function calculateIndicator(value, parameter) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "";
  if (numeric < parameter.min) return "BAJO";
  if (numeric > parameter.max) return "ALTO";
  return "NORMAL";
}
