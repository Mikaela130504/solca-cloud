from fastapi import Depends, FastAPI

from solca_common.db import fetch_all
from solca_common.json import normalize_records
from solca_common.security import require_roles


app = FastAPI(title="SOLCA Audit Service", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "audit-service"}


@app.get("/auditoria")
def list_audit(user=Depends(require_roles("ADMIN"))):
    rows = fetch_all(
        """
        SELECT *
        FROM auditoria.auditoria
        ORDER BY fecha_hora DESC
        LIMIT 100
        """
    )
    return normalize_records(rows)


@app.get("/auditoria/paciente/{patient_id}")
def list_patient_audit(patient_id: str, user=Depends(require_roles("ADMIN"))):
    rows = fetch_all(
        """
        SELECT *
        FROM auditoria.auditoria
        WHERE paciente_consultado = %s
        ORDER BY fecha_hora DESC
        """,
        (patient_id,),
    )
    return normalize_records(rows)

