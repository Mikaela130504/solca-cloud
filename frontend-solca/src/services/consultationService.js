import { API_CONFIG, createApiClient } from "./api.js";

const api = createApiClient(API_CONFIG.consultationUrl);

export async function createClinicalHistory(history) {
  const payload = {
    cedula: history.cedula,
    idPacienteRegional: history.idPacienteRegional,
    fecha: history.fecha,
    sede: history.sede,
    medico: history.firmaMedico,
    especialidad: history.especialidad,
    tipoConsulta: "Historia clínica",
    diagnostico: history.diagnosticoPrincipal,
    tratamiento: history.tratamiento || history.planTerapeutico,
    motivo: history.motivoConsulta,
    evolucion: history.evolucion || history.enfermedadActual,
    observaciones: history.observaciones,
    antecedentesFamiliares: history.antecedentesFamiliares,
    antecedentesPersonales: history.antecedentesPersonales,
    cirugias: history.cirugiasDetalle,
    ginecoObstetricos: history.ginecoObstetricos,
    medicamentosActuales: history.medicamentosActuales,
    alergias: history.alergiasDetalle,
    examenFisico: history.examenFisico,
    signosVitales: history.signosVitales,
  };
  const { data } = await api.post("/consultas", payload);
  return data;
}

export async function createConsultation(consultation) {
  const payload = {
    cedula: consultation.cedula,
    idPacienteRegional: consultation.idPacienteRegional,
    fecha: consultation.fecha,
    sede: consultation.sede,
    medico: consultation.medico,
    especialidad: consultation.especialidad,
    tipoConsulta: consultation.tipoConsulta,
    diagnostico: consultation.diagnostico,
    tratamiento: consultation.tratamiento || consultation.plan,
    motivo: consultation.motivo,
    evolucion: consultation.evolucion,
    observaciones: consultation.observaciones,
    signosVitales: consultation.signosVitales,
    medicacion: consultation.medicacion,
    proximoControl: consultation.proximoControl,
  };
  const { data } = await api.post("/consultas", payload);
  return data;
}

export async function listConsultationsByPatient(idPacienteRegional) {
  const { data } = await api.get(`/consultas/paciente/${idPacienteRegional}`);
  return data;
}

export async function listConsultations() {
  const { data } = await api.get("/consultas");
  return data;
}
