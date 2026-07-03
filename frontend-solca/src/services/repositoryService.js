import { API_CONFIG, createApiClient } from "./api.js";

const api = createApiClient(API_CONFIG.repositoryUrl);

export async function getClinicalRepository(idPacienteRegional) {
  const path = idPacienteRegional ? `/repositorio-clinico/${idPacienteRegional}` : "/repositorio-clinico";
  const { data } = await api.get(path);
  return data;
}
