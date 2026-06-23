from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, Field

from solca_common.audit import audit_action
from solca_common.db import fetch_one, get_connection
from solca_common.json import normalize_record
from solca_common.security import require_roles


app = FastAPI(title="SOLCA Patient Master Service", version="1.0.0")


class LocalHistory(BaseModel):
    sede: str
    historia_clinica: str = Field(alias="historia")


class PatientCreate(BaseModel):
    cedula: str
    nombres: str
    apellidos: str
    fecha_nacimiento: str = Field(alias="fechaNacimiento")
    sexo: str
    telefono: str | None = None
    direccion: str | None = None
    historias_locales: list[LocalHistory] = Field(default_factory=list, alias="historiasLocales")


def build_patient(row):
    patient = normalize_record(row)
    if not patient:
        return None
    histories = fetch_one(
        """
        SELECT COALESCE(json_agg(json_build_object('sede', sede, 'historia', historia_clinica)), '[]'::json) AS historias
        FROM paciente.historias_locales
        WHERE id_paciente_regional = %s
        """,
        (patient["id_paciente_regional"],),
    )
    patient["historiasLocales"] = histories["historias"]
    return patient


@app.get("/health")
def health():
    return {"status": "ok", "service": "patient-service"}


@app.post("/pacientes", status_code=201)
def create_patient(payload: PatientCreate, user=Depends(require_roles("ADMIN"))):
    existing = fetch_one("SELECT * FROM paciente.pacientes WHERE cedula = %s", (payload.cedula,))
    if existing:
        audit_action(user, "REUTILIZA_PACIENTE_EXISTENTE", existing["id_paciente_regional"])
        return build_patient(existing)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COALESCE(MAX(SUBSTRING(id_paciente_regional FROM 5)::INT), 0) + 1 AS next_id FROM paciente.pacientes")
            next_id = cur.fetchone()["next_id"]
            patient_id = f"PAC-{next_id:05d}"
            cur.execute(
                """
                INSERT INTO paciente.pacientes (
                    id_paciente_regional, cedula, nombres, apellidos, fecha_nacimiento, sexo, telefono, direccion
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    patient_id,
                    payload.cedula,
                    payload.nombres,
                    payload.apellidos,
                    payload.fecha_nacimiento,
                    payload.sexo,
                    payload.telefono,
                    payload.direccion,
                ),
            )
            row = cur.fetchone()
            for history in payload.historias_locales:
                cur.execute(
                    """
                    INSERT INTO paciente.historias_locales (id_paciente_regional, sede, historia_clinica)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (sede, historia_clinica) DO NOTHING
                    """,
                    (patient_id, history.sede, history.historia_clinica),
                )
    audit_action(user, "CREA_PACIENTE", patient_id)
    return build_patient(row)


@app.get("/pacientes/cedula/{cedula}")
def get_patient_by_id_number(cedula: str, user=Depends(require_roles("ADMIN", "MEDICO", "LABORATORIO"))):
    row = fetch_one("SELECT * FROM paciente.pacientes WHERE cedula = %s", (cedula,))
    if not row:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    audit_action(user, "CONSULTA_PACIENTE_CEDULA", row["id_paciente_regional"])
    return build_patient(row)


@app.get("/pacientes/{patient_id}")
def get_patient(patient_id: str, user=Depends(require_roles("ADMIN", "MEDICO", "LABORATORIO"))):
    row = fetch_one("SELECT * FROM paciente.pacientes WHERE id_paciente_regional = %s", (patient_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    audit_action(user, "CONSULTA_PACIENTE", patient_id)
    return build_patient(row)
