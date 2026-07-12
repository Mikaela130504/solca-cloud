import axios from "axios";
import { API_CONFIG } from "./api.js";

export const MICROSERVICES = [
  { key: "auth", name: "Autenticación", url: API_CONFIG.authUrl },
  { key: "patient", name: "Paciente Maestro", url: API_CONFIG.patientUrl },
  { key: "consultation", name: "Consulta Clínica", url: API_CONFIG.consultationUrl },
  { key: "laboratory", name: "Laboratorio", url: API_CONFIG.laboratoryUrl },
  { key: "imaging", name: "Imagenología", url: API_CONFIG.imagingUrl },
  { key: "repository", name: "Repositorio Clínico", url: API_CONFIG.repositoryUrl },
];

export async function checkMicroservice(service) {
  const started = performance.now();
  try {
    await axios.get(`${service.url}/actuator/health`, { timeout: 3500 });
    return {
      ...service,
      status: "DISPONIBLE",
      responseTime: Math.round(performance.now() - started),
      lastResponse: new Date().toLocaleString("es-EC"),
      message: "Respuesta correcta",
    };
  } catch (error) {
    return {
      ...service,
      status: "NO DISPONIBLE",
      responseTime: null,
      lastResponse: new Date().toLocaleString("es-EC"),
      message: error?.code === "ECONNABORTED" ? "Tiempo de espera agotado" : "Sin respuesta del servicio",
    };
  }
}

export async function checkAllMicroservices() {
  return Promise.all(MICROSERVICES.map(checkMicroservice));
}

export function statusMap(statuses) {
  return statuses.reduce((acc, item) => ({ ...acc, [item.key]: item }), {});
}
