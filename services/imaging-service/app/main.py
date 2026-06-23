from fastapi import Depends, FastAPI
from pydantic import BaseModel

from solca_common.audit import audit_action
from solca_common.db import fetch_all, get_connection
from solca_common.json import normalize_record, normalize_records
from solca_common.security import require_roles


app = FastAPI(title="SOLCA Imaging Service", version="1.0.0")


class ImagingStudyCreate(BaseModel):
    id_paciente_regional: str
    tipo_estudio: str
    formato: str = "DICOM"
    url_archivo: str
    tamano_mb: float | None = None
    sede: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "imaging-service"}


@app.post("/imagenologia", status_code=201)
def create_imaging_study(payload: ImagingStudyCreate, user=Depends(require_roles("MEDICO", "ADMIN"))):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO imagenologia.estudios_imagen (
                    id_paciente_regional, tipo_estudio, formato, url_archivo, tamano_mb, sede
                ) VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    payload.id_paciente_regional,
                    payload.tipo_estudio,
                    payload.formato,
                    payload.url_archivo,
                    payload.tamano_mb,
                    payload.sede,
                ),
            )
            row = cur.fetchone()
    audit_action(user, "CREA_ESTUDIO_IMAGEN", payload.id_paciente_regional)
    return normalize_record(row)


@app.get("/imagenologia/paciente/{patient_id}")
def get_imaging_studies(patient_id: str, user=Depends(require_roles("MEDICO", "ADMIN"))):
    rows = fetch_all(
        """
        SELECT * FROM imagenologia.estudios_imagen
        WHERE id_paciente_regional = %s
        ORDER BY fecha_estudio DESC
        """,
        (patient_id,),
    )
    audit_action(user, "LISTA_ESTUDIOS_IMAGEN", patient_id)
    return normalize_records(rows)

