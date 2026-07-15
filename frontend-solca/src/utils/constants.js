export const ROUTES = {
  login: "/",
  dashboard: "/dashboard",
  patient: "/paciente-maestro",
  clinicalHistory: "/historia-clinica/nueva",
  consultation: "/consulta/nueva",
  clinicalRecords: "/registros-clinicos",
  laboratory: "/laboratorio/nuevo",
  imaging: "/imagenologia/nuevo",
  repository: "/repositorio-clinico",
  systemStatus: "/estado-microservicios",
  audit: "/auditoria",
};

export const HOSPITAL_BRANCHES = [
  "SOLCA Quito",
  "SOLCA Manabí",
  "SOLCA Cuenca",
];

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const SEXOS = ["Femenino", "Masculino", "Intersexual", "No especifica"];

export const ESTADOS_CIVILES = ["Soltero/a", "Casado/a", "Unión libre", "Divorciado/a", "Viudo/a"];

export const ESPECIALIDADES_MEDICAS = [
  "Oncología clínica",
  "Cirugía oncológica",
  "Ginecología oncológica",
  "Radioterapia",
  "Hematología",
  "Cuidados paliativos",
];

export const TIPOS_CONSULTA = ["Primera vez", "Control", "Emergencia", "Interconsulta", "Seguimiento"];

export const TIPOS_LABORATORIO = [
  "Hemograma completo",
  "Perfil hepático",
  "Perfil renal",
  "Marcadores tumorales",
  "Química sanguínea",
  "Coagulación",
  "Glucosa",
  "Creatinina",
];

export const PRIORIDADES = ["Normal", "Preferente", "Urgente"];

export const TIPOS_ESTUDIO = ["Radiografía", "Ecografía", "Tomografía", "Resonancia", "Mamografía", "PET-CT"];

export const FORMATOS_IMAGEN = ["DICOM", "PNG"];

export const REGIONES_ANATOMICAS = [
  "Cabeza",
  "Cuello",
  "Tórax",
  "Abdomen",
  "Pelvis",
  "Columna",
  "Miembro superior",
  "Miembro inferior",
  "Mama",
  "Cuerpo completo",
];

export const SEGUROS_MEDICOS = ["IESS", "MSP", "ISSFA", "ISSPOL", "Privado", "Sin cobertura"];

export const ECUADOR_PROVINCES = [
  "Azuay",
  "Bolívar",
  "Cañar",
  "Carchi",
  "Chimborazo",
  "Cotopaxi",
  "El Oro",
  "Esmeraldas",
  "Galápagos",
  "Guayas",
  "Imbabura",
  "Loja",
  "Los Ríos",
  "Manabí",
  "Morona Santiago",
  "Napo",
  "Orellana",
  "Pastaza",
  "Pichincha",
  "Santa Elena",
  "Santo Domingo",
  "Sucumbíos",
  "Tungurahua",
  "Zamora Chinchipe",
];

export const CIUDADES_ECUADOR = [
  "Quito",
  "Guayaquil",
  "Cuenca",
  "Portoviejo",
  "Loja",
  "Manta",
  "Machala",
  "Ambato",
  "Riobamba",
  "Santo Domingo",
];

export const CIUDADES_POR_PROVINCIA = {
  Azuay: ["Cuenca", "Gualaceo", "Paute", "Santa Isabel"],
  Bolívar: ["Guaranda", "Chillanes", "San Miguel"],
  Cañar: ["Azogues", "Biblián", "La Troncal"],
  Carchi: ["Tulcán", "Montúfar", "Espejo"],
  Chimborazo: ["Riobamba", "Alausí", "Guano"],
  Cotopaxi: ["Latacunga", "La Maná", "Pujilí", "Salcedo"],
  "El Oro": ["Machala", "Pasaje", "Santa Rosa", "Huaquillas"],
  Esmeraldas: ["Esmeraldas", "Atacames", "Quinindé"],
  Galápagos: ["Puerto Baquerizo Moreno", "Puerto Ayora", "Puerto Villamil"],
  Guayas: ["Guayaquil", "Daule", "Durán", "Milagro", "Samborondón"],
  Imbabura: ["Ibarra", "Otavalo", "Cotacachi", "Antonio Ante"],
  Loja: ["Loja", "Catamayo", "Macará", "Saraguro"],
  "Los Ríos": ["Babahoyo", "Quevedo", "Ventanas", "Vinces"],
  Manabí: ["Portoviejo", "Manta", "Chone", "Jipijapa", "Montecristi"],
  "Morona Santiago": ["Macas", "Gualaquiza", "Sucúa"],
  Napo: ["Tena", "Archidona", "El Chaco"],
  Orellana: ["Francisco de Orellana", "La Joya de los Sachas", "Loreto"],
  Pastaza: ["Puyo", "Mera", "Santa Clara"],
  Pichincha: ["Quito", "Cayambe", "Mejía", "Rumiñahui"],
  "Santa Elena": ["Santa Elena", "La Libertad", "Salinas"],
  "Santo Domingo": ["Santo Domingo", "La Concordia"],
  Sucumbíos: ["Nueva Loja", "Shushufindi", "Cascales"],
  Tungurahua: ["Ambato", "Baños", "Pelileo", "Píllaro"],
  "Zamora Chinchipe": ["Zamora", "Yantzaza", "Nangaritza"],
};
