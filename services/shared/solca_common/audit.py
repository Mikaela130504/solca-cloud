from solca_common.db import get_connection


def audit_action(user: dict, action: str, patient_id: str | None = None) -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO auditoria.auditoria (usuario, rol, accion, paciente_consultado)
                VALUES (%s, %s, %s, %s)
                """,
                (user["username"], user["role"], action, patient_id),
            )

