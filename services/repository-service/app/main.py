import os

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException

from solca_common.audit import audit_action
from solca_common.security import require_roles


app = FastAPI(title="SOLCA Regional Clinical Repository Service", version="1.0.0")

PATIENT_SERVICE_URL = os.getenv("PATIENT_SERVICE_URL", "http://localhost:8001")
CONSULTATION_SERVICE_URL = os.getenv("CONSULTATION_SERVICE_URL", "http://localhost:8002")
LAB_SERVICE_URL = os.getenv("LAB_SERVICE_URL", "http://localhost:8003")
IMAGING_SERVICE_URL = os.getenv("IMAGING_SERVICE_URL", "http://localhost:8004")


async def get_json(client: httpx.AsyncClient, url: str, token: str):
    response = await client.get(url, headers={"Authorization": token})
    if response.status_code == 404:
        return None
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()


@app.get("/health")
def health():
    return {"status": "ok", "service": "repository-service"}


@app.get("/repositorio/paciente/{patient_id}")
async def get_regional_record(
    patient_id: str,
    authorization: str = Header(...),
    user=Depends(require_roles("MEDICO", "ADMIN")),
):
    async with httpx.AsyncClient(timeout=10.0) as client:
        patient = await get_json(client, f"{PATIENT_SERVICE_URL}/pacientes/{patient_id}", authorization)
        if patient is None:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        consultations = await get_json(client, f"{CONSULTATION_SERVICE_URL}/consultas/paciente/{patient_id}", authorization)
        lab_results = await get_json(client, f"{LAB_SERVICE_URL}/laboratorio/paciente/{patient_id}", authorization)
        imaging_studies = await get_json(client, f"{IMAGING_SERVICE_URL}/imagenologia/paciente/{patient_id}", authorization)

    audit_action(user, "CONSULTA_REPOSITORIO", patient_id)
    return {
        "paciente": patient,
        "consultas": consultations or [],
        "resultados_laboratorio": lab_results or [],
        "estudios_imagen": imaging_studies or [],
    }

