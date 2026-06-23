from fastapi import Depends, FastAPI
from pydantic import BaseModel

from solca_common.audit import audit_action
from solca_common.db import fetch_all, get_connection
from solca_common.json import normalize_record, normalize_records
from solca_common.security import require_roles


app = FastAPI(title="SOLCA Laboratory Service", version="1.0.0")


class LabResultCreate(BaseModel):
    id_paciente_regional: str
    examen: str
    resultado: str
    valor_referencia: str | None = None
    sede: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "lab-service"}


@app.post("/laboratorio", status_code=201)
def create_lab_result(payload: LabResultCreate, user=Depends(require_roles("LABORATORIO", "ADMIN"))):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO laboratorio.resultados_laboratorio (
                    id_paciente_regional, examen, resultado, valor_referencia, sede
                ) VALUES (%s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    payload.id_paciente_regional,
                    payload.examen,
                    payload.resultado,
                    payload.valor_referencia,
                    payload.sede,
                ),
            )
            row = cur.fetchone()
    audit_action(user, "CREA_RESULTADO_LABORATORIO", payload.id_paciente_regional)
    return normalize_record(row)


@app.get("/laboratorio/paciente/{patient_id}")
def get_lab_results(patient_id: str, user=Depends(require_roles("MEDICO", "LABORATORIO", "ADMIN"))):
    rows = fetch_all(
        """
        SELECT * FROM laboratorio.resultados_laboratorio
        WHERE id_paciente_regional = %s
        ORDER BY fecha_resultado DESC
        """,
        (patient_id,),
    )
    audit_action(user, "LISTA_RESULTADOS_LABORATORIO", patient_id)
    return normalize_records(rows)

