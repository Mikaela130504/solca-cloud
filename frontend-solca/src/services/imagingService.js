import { API_CONFIG, createApiClient } from "./api.js";

const api = createApiClient(API_CONFIG.imagingUrl);

export async function createImagingStudy(study) {
  const formData = new FormData();
  const payload = {
    cedula: study.cedula,
    idPacienteRegional: study.idPacienteRegional,
    fecha: study.fecha,
    sede: study.sede,
    medico: study.medico,
    especialidad: study.especialidad,
    tipoConsulta: study.tipoConsulta,
    consultaId: study.consultaId,
    diagnostico: study.diagnostico,
    tipoEstudio: study.tipoEstudio,
    formato: study.formato,
    prioridad: study.prioridad,
    url: study.url,
    regionAnatomica: study.regionAnatomica,
    resultado: study.resultado,
    observaciones: study.observaciones,
    observacionesImagenologo: study.observacionesImagenologo,
    estado: study.estado,
    tecnicoResponsable: study.tecnicoResponsable,
    hora: study.hora,
    archivo: study.archivo,
  };
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  const { data } = await api.post("/imagenologia", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listImagingStudies(idPacienteRegional) {
  const path = idPacienteRegional ? `/imagenologia/paciente/${idPacienteRegional}` : "/imagenologia";
  const { data } = await api.get(path);
  return data;
}

export async function listAllImagingStudies(filters = {}) {
  const { data } = await api.get("/imagenologia", { params: filters });
  return data;
}

export async function updateImagingState(id, estado) {
  const { data } = await api.put(`/imagenologia/${id}/estado/${estado}`);
  return data;
}

export async function saveImagingResult(id, study) {
  const formData = new FormData();
  const payload = {
    formato: study.formato,
    resultado: study.conclusion || study.resultado,
    observacionesImagenologo: study.observaciones,
    hallazgos: study.hallazgos,
    recomendaciones: study.recomendaciones,
    tecnicoResponsable: study.tecnicoResponsable,
    hora: study.hora,
    archivo: study.archivo,
  };
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  const { data } = await api.put(`/imagenologia/${id}/resultado`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export function getImagingDownloadUrl(id) {
  return `${API_CONFIG.imagingUrl}/imagenologia/${id}/archivo`;
}

export async function downloadImagingStudy(id) {
  const { data } = await api.get(`/imagenologia/${id}/archivo`, { responseType: "blob" });
  return data;
}
