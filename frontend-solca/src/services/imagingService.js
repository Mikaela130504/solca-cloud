import { API_CONFIG, createApiClient } from "./api.js";

const api = createApiClient(API_CONFIG.imagingUrl);

export async function createImagingStudy(study) {
  const formData = new FormData();
  Object.entries(study).forEach(([key, value]) => {
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
