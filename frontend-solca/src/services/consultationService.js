import { API_CONFIG, createApiClient } from "./api.js";

const api = createApiClient(API_CONFIG.consultationUrl);

export async function createClinicalHistory(history) {
  const payload = {
    ...history,
    medico: history.firmaMedico,
    diagnostico: history.diagnosticoPrincipal,
    tratamiento: history.tratamiento || history.planTerapeutico,
    motivo: history.motivoConsulta,
    evolucion: history.evolucion || history.enfermedadActual,
  };
  const { data } = await api.post("/consultas", payload);
  return data;
}

export async function createConsultation(consultation) {
  const { data } = await api.post("/consultas", consultation);
  return data;
}

export async function listConsultationsByPatient(idPacienteRegional) {
  const { data } = await api.get(`/consultas/paciente/${idPacienteRegional}`);
  return data;
}
