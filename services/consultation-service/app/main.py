from fastapi import Depends, FastAPI
from pydantic import BaseModel

from solca_common.audit import audit_action
from solca_common.db import fetch_all, get_connection
from solca_common.json import normalize_record, normalize_records
from solca_common.security import require_roles


app = FastAPI(title="SOLCA Consultation Service", version="1.0.0")


class ConsultationCreate(BaseModel):
    id_paciente_regional: str
    medico: str
    especialidad: str
    diagnostico: str
    tratamiento: str | None = None
    sede: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "consultation-service"}


@app.post("/consultas", status_code=201)
def create_consultation(payload: ConsultationCreate, user=Depends(require_roles("MEDICO", "ADMIN"))):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO consulta.consultas (
                    id_paciente_regional, medico, especialidad, diagnostico, tratamiento, sede
                ) VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    payload.id_paciente_regional,
                    payload.medico,
                    payload.especialidad,
                    payload.diagnostico,
                    payload.tratamiento,
                    payload.sede,
                ),
            )
            row = cur.fetchone()
    audit_action(user, "CREA_CONSULTA", payload.id_paciente_regional)
    return normalize_record(row)


@app.get("/consultas/paciente/{patient_id}")
def get_consultations(patient_id: str, user=Depends(require_roles("MEDICO", "ADMIN"))):
    rows = fetch_all(
        "SELECT * FROM consulta.consultas WHERE id_paciente_regional = %s ORDER BY fecha_consulta DESC",
        (patient_id,),
    )
    audit_action(user, "LISTA_CONSULTAS", patient_id)
    return normalize_records(rows)

