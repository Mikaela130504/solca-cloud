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
    tipoEstudio: study.tipoEstudio,
    formato: study.formato,
    url: study.url,
    regionAnatomica: study.regionAnatomica,
    resultado: study.resultado,
    observaciones: study.observaciones,
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
