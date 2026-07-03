import { API_CONFIG, createApiClient } from "./api.js";

const api = createApiClient(API_CONFIG.patientUrl);

export async function createPatient(patient) {
  const { data } = await api.post("/pacientes", patient);
  return data;
}

export async function searchPatients(query = "") {
  const { data } = await api.get("/pacientes", { params: { q: query } });
  return data;
}

export async function getPatientByCedula(cedula) {
  const { data } = await api.get(`/pacientes/cedula/${cedula}`);
  return data;
}

export async function getPatientByRegionalId(idPacienteRegional) {
  const { data } = await api.get(`/pacientes/${idPacienteRegional}`);
  return data;
}
