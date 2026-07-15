import sqlite3
from datetime import datetime
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / "database" / "sqlite"
LEGACY = BASE / "legacy-backup"

AUDIT_DATABASES = [
    "Autenticacion.sqlite",
    "Pacientes.sqlite",
    "Consultas.sqlite",
    "Laboratorio.sqlite",
    "Imagenologia.sqlite",
    "RepositorioClinico.sqlite",
]

AUDIT_DEFINITION = [
    ("id", "INTEGER PRIMARY KEY AUTOINCREMENT"),
    ("usuario", "TEXT NOT NULL"),
    ("rol", "TEXT NOT NULL"),
    ("fecha", "TEXT NOT NULL"),
    ("hora", "TEXT NOT NULL"),
    ("direccion_ip", "TEXT"),
    ("modulo", "TEXT NOT NULL"),
    ("paciente", "TEXT"),
    ("accion", "TEXT NOT NULL"),
    ("resultado", "TEXT NOT NULL"),
]


def table_exists(con, table):
    return con.execute(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?", (table,)
    ).fetchone()[0] > 0


def columns(con, table):
    if not table_exists(con, table):
        return []
    return [row[1] for row in con.execute(f"PRAGMA table_info({table})")]


def ensure_audit(con):
    con.execute(
        "CREATE TABLE IF NOT EXISTS auditorias ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, usuario TEXT NOT NULL, rol TEXT NOT NULL, "
        "fecha TEXT NOT NULL, hora TEXT NOT NULL, direccion_ip TEXT, modulo TEXT NOT NULL, "
        "paciente TEXT, accion TEXT NOT NULL, resultado TEXT NOT NULL)"
    )


def rebuild(con, table, definitions, sources):
    temp = f"{table}_nuevo"
    con.execute(f"DROP TABLE IF EXISTS {temp}")
    con.execute(
        f"CREATE TABLE {temp} ({', '.join(f'{name} {kind}' for name, kind in definitions)})"
    )
    destination = [name for name, _ in definitions]
    for source in sources:
        if not table_exists(con, source):
            continue
        source_columns = columns(con, source)
        common = [name for name in destination if name in source_columns]
        if common:
            joined = ", ".join(common)
            con.execute(f"INSERT OR IGNORE INTO {temp} ({joined}) SELECT {joined} FROM {source}")
    if table_exists(con, table):
        con.execute(f"DROP TABLE {table}")
    con.execute(f"ALTER TABLE {temp} RENAME TO {table}")


def normalize_sedes(con):
    for table, in con.execute("SELECT name FROM sqlite_master WHERE type='table'"):
        if "sede" not in columns(con, table):
            continue
        con.execute(f"UPDATE {table} SET sede='SOLCA Manabí' WHERE sede='SOLCA Guayaquil'")
        con.execute(
            f"UPDATE {table} SET sede='SOLCA Quito' "
            "WHERE sede IS NULL OR TRIM(sede) = '' "
            "OR sede NOT IN ('SOLCA Cuenca','SOLCA Quito','SOLCA Manabí')"
        )


def migrate_auth():
    con = sqlite3.connect(BASE / "Autenticacion.sqlite")
    ensure_audit(con)
    con.commit()
    con.close()


def migrate_patients():
    con = sqlite3.connect(BASE / "Pacientes.sqlite")
    normalize_sedes(con)
    ensure_audit(con)
    con.commit()
    con.close()


def migrate_consultas():
    con = sqlite3.connect(BASE / "Consultas.sqlite")
    rebuild(
        con,
        "consultas",
        [
            ("id", "INTEGER PRIMARY KEY AUTOINCREMENT"),
            ("id_paciente_regional", "TEXT"),
            ("cedula", "TEXT NOT NULL"),
            ("fecha", "TEXT NOT NULL"),
            ("sede", "TEXT NOT NULL"),
            ("medico", "TEXT"),
            ("especialidad", "TEXT"),
            ("tipo_consulta", "TEXT"),
            ("diagnostico", "TEXT"),
            ("tratamiento", "TEXT"),
            ("motivo", "TEXT"),
            ("evolucion", "TEXT"),
            ("resultado", "TEXT"),
            ("observaciones", "TEXT"),
        ],
        ["consultas", "registros"],
    )
    normalize_sedes(con)
    ensure_audit(con)
    con.execute("CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas(id_paciente_regional)")
    con.execute("CREATE INDEX IF NOT EXISTS idx_consultas_cedula ON consultas(cedula)")
    con.commit()
    con.close()


def migrate_laboratorio():
    con = sqlite3.connect(BASE / "Laboratorio.sqlite")
    now = datetime.now().isoformat(timespec="seconds")
    rebuild(
        con,
        "resultados_laboratorio",
        [
            ("id", "INTEGER PRIMARY KEY AUTOINCREMENT"),
            ("id_paciente_regional", "TEXT"),
            ("cedula", "TEXT NOT NULL"),
            ("fecha", "TEXT NOT NULL"),
            ("sede", "TEXT NOT NULL"),
            ("medico", "TEXT"),
            ("especialidad", "TEXT"),
            ("tipo_consulta", "TEXT"),
            ("diagnostico", "TEXT"),
            ("tratamiento", "TEXT"),
            ("motivo", "TEXT"),
            ("evolucion", "TEXT"),
            ("tipo_examen", "TEXT"),
            ("resultado", "TEXT"),
            ("observaciones", "TEXT"),
            ("estado", "TEXT DEFAULT 'PENDIENTE'"),
            ("prioridad", "TEXT DEFAULT 'NORMAL'"),
            ("tecnologo_responsable", "TEXT"),
            ("fecha_solicitud", "TEXT"),
            ("fecha_resultado", "TEXT"),
            ("valores", "TEXT"),
            ("unidad", "TEXT"),
            ("valor_referencia", "TEXT"),
            ("interpretacion", "TEXT"),
            ("codigo_muestra", "TEXT"),
            ("tipo_resultado", "TEXT"),
            ("resultado_critico", "INTEGER DEFAULT 0"),
            ("hora_resultado", "TEXT"),
            ("fecha_validacion", "TEXT"),
            ("usuario_valido", "TEXT"),
            ("observaciones_laboratorio", "TEXT"),
            ("consulta_id", "INTEGER"),
        ],
        ["resultados_laboratorio", "registros"],
    )
    normalize_sedes(con)
    con.execute(
        "UPDATE resultados_laboratorio SET estado='FINALIZADO' "
        "WHERE (estado IS NULL OR TRIM(estado)='') AND resultado IS NOT NULL AND TRIM(resultado)<>''"
    )
    con.execute("UPDATE resultados_laboratorio SET estado='PENDIENTE' WHERE estado IS NULL OR TRIM(estado)=''")
    con.execute("UPDATE resultados_laboratorio SET prioridad='NORMAL' WHERE prioridad IS NULL OR TRIM(prioridad)=''")
    con.execute(
        "UPDATE resultados_laboratorio SET fecha_solicitud=? "
        "WHERE fecha_solicitud IS NULL OR TRIM(fecha_solicitud)=''",
        (now,),
    )
    ensure_audit(con)
    con.execute(
        "CREATE INDEX IF NOT EXISTS idx_resultados_laboratorio_paciente "
        "ON resultados_laboratorio(id_paciente_regional)"
    )
    con.execute("CREATE INDEX IF NOT EXISTS idx_resultados_laboratorio_cedula ON resultados_laboratorio(cedula)")
    con.execute("CREATE INDEX IF NOT EXISTS idx_resultados_laboratorio_estado ON resultados_laboratorio(estado)")
    con.commit()
    con.close()


def migrate_imagenologia():
    con = sqlite3.connect(BASE / "Imagenologia.sqlite")
    now = datetime.now().isoformat(timespec="seconds")
    rebuild(
        con,
        "estudios_imagenologia",
        [
            ("id", "INTEGER PRIMARY KEY AUTOINCREMENT"),
            ("id_paciente_regional", "TEXT"),
            ("cedula", "TEXT NOT NULL"),
            ("fecha", "TEXT NOT NULL"),
            ("sede", "TEXT NOT NULL"),
            ("medico", "TEXT"),
            ("especialidad", "TEXT"),
            ("tipo_consulta", "TEXT"),
            ("diagnostico", "TEXT"),
            ("resultado", "TEXT"),
            ("observaciones", "TEXT"),
            ("tipo_estudio", "TEXT"),
            ("formato", "TEXT"),
            ("url", "TEXT"),
            ("region_anatomica", "TEXT"),
            ("estado", "TEXT DEFAULT 'SOLICITADO'"),
            ("prioridad", "TEXT DEFAULT 'NORMAL'"),
            ("tecnico_responsable", "TEXT"),
            ("hora", "TEXT"),
            ("fecha_solicitud", "TEXT"),
            ("fecha_realizacion", "TEXT"),
            ("observaciones_imagenologo", "TEXT"),
            ("hallazgos", "TEXT"),
            ("recomendaciones", "TEXT"),
            ("consulta_id", "INTEGER"),
        ],
        ["estudios_imagenologia", "registros"],
    )
    normalize_sedes(con)
    con.execute("UPDATE estudios_imagenologia SET formato='PNG' WHERE url IS NOT NULL AND LOWER(url) LIKE '%.png'")
    con.execute(
        "UPDATE estudios_imagenologia SET formato='DICOM' "
        "WHERE url IS NOT NULL AND (LOWER(url) LIKE '%.dcm' OR LOWER(url) LIKE '%.dicom')"
    )
    con.execute(
        "UPDATE estudios_imagenologia SET formato='DICOM' "
        "WHERE formato IS NULL OR TRIM(formato)='' OR UPPER(formato) NOT IN ('PNG','DICOM')"
    )
    con.execute(
        "UPDATE estudios_imagenologia SET estado='REALIZADO' "
        "WHERE url IS NOT NULL AND TRIM(url)<>'' "
        "AND (estado IS NULL OR TRIM(estado)='' OR estado='SOLICITADO')"
    )
    con.execute("UPDATE estudios_imagenologia SET estado='SOLICITADO' WHERE estado IS NULL OR TRIM(estado)=''")
    con.execute("UPDATE estudios_imagenologia SET prioridad='NORMAL' WHERE prioridad IS NULL OR TRIM(prioridad)=''")
    con.execute(
        "UPDATE estudios_imagenologia SET fecha_solicitud=? "
        "WHERE fecha_solicitud IS NULL OR TRIM(fecha_solicitud)=''",
        (now,),
    )
    con.execute(
        "UPDATE estudios_imagenologia SET fecha_realizacion=? "
        "WHERE estado IN ('REALIZADO','INFORMADO') "
        "AND (fecha_realizacion IS NULL OR TRIM(fecha_realizacion)='')",
        (now,),
    )
    con.execute(
        "UPDATE estudios_imagenologia SET tecnico_responsable='Imagenologia SOLCA' "
        "WHERE estado IN ('REALIZADO','INFORMADO') "
        "AND (tecnico_responsable IS NULL OR TRIM(tecnico_responsable)='')"
    )
    con.execute(
        "UPDATE estudios_imagenologia SET hallazgos=resultado "
        "WHERE (hallazgos IS NULL OR TRIM(hallazgos)='') "
        "AND resultado IS NOT NULL AND TRIM(resultado)<>''"
    )
    con.execute(
        "UPDATE estudios_imagenologia SET recomendaciones='No registrada' "
        "WHERE estado IN ('REALIZADO','INFORMADO') "
        "AND (recomendaciones IS NULL OR TRIM(recomendaciones)='')"
    )
    ensure_audit(con)
    con.execute(
        "CREATE INDEX IF NOT EXISTS idx_estudios_imagenologia_paciente "
        "ON estudios_imagenologia(id_paciente_regional)"
    )
    con.execute("CREATE INDEX IF NOT EXISTS idx_estudios_imagenologia_cedula ON estudios_imagenologia(cedula)")
    con.execute("CREATE INDEX IF NOT EXISTS idx_estudios_imagenologia_estado ON estudios_imagenologia(estado)")
    con.commit()
    con.close()


def migrate_repositorio():
    con = sqlite3.connect(BASE / "RepositorioClinico.sqlite")
    con.execute(
        "CREATE TABLE IF NOT EXISTS historial_consultas_repositorio ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, paciente TEXT NOT NULL, "
        "id_paciente_regional TEXT, usuario TEXT, fecha_hora TEXT NOT NULL, "
        "resultado TEXT NOT NULL, servicios_no_disponibles TEXT)"
    )
    con.execute(
        "CREATE TABLE IF NOT EXISTS estado_servicios ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, servicio TEXT NOT NULL UNIQUE, "
        "estado TEXT NOT NULL, ultima_revision TEXT NOT NULL, mensaje TEXT)"
    )
    con.execute(
        "CREATE TABLE IF NOT EXISTS logs_integracion ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, servicio TEXT NOT NULL, endpoint TEXT NOT NULL, "
        "fecha_hora TEXT NOT NULL, resultado TEXT NOT NULL, tiempo_respuesta_ms INTEGER, mensaje TEXT)"
    )
    con.execute(
        "CREATE TABLE IF NOT EXISTS cache_clinica ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT NOT NULL UNIQUE, "
        "fecha_hora TEXT NOT NULL, paciente TEXT, cedula TEXT, sede TEXT, diagnostico_principal TEXT, "
        "total_consultas INTEGER DEFAULT 0, total_laboratorios INTEGER DEFAULT 0, "
        "total_imagenologia INTEGER DEFAULT 0, servicios_no_disponibles TEXT, resumen TEXT NOT NULL)"
    )
    for column, definition in {
        "paciente": "TEXT",
        "cedula": "TEXT",
        "sede": "TEXT",
        "diagnostico_principal": "TEXT",
        "total_consultas": "INTEGER DEFAULT 0",
        "total_laboratorios": "INTEGER DEFAULT 0",
        "total_imagenologia": "INTEGER DEFAULT 0",
        "servicios_no_disponibles": "TEXT",
    }.items():
        try:
            con.execute(f"ALTER TABLE cache_clinica ADD COLUMN {column} {definition}")
        except sqlite3.OperationalError:
            pass
    con.execute("CREATE TABLE IF NOT EXISTS configuracion_repositorio (clave TEXT PRIMARY KEY, valor TEXT NOT NULL)")
    ensure_audit(con)
    con.commit()
    con.close()


def audit_value(row, keys, default=""):
    for key in keys:
        if key in row.keys() and row[key] not in (None, ""):
            return str(row[key])
    return default


def split_fecha_hora(row):
    fecha = audit_value(row, ["fecha"], "")
    hora = audit_value(row, ["hora"], "")
    fecha_hora = audit_value(row, ["fecha_hora"], "")
    if (not fecha or not hora) and fecha_hora:
        cleaned = fecha_hora.replace("T", " ")
        parts = cleaned.split(" ", 1)
        if not fecha:
            fecha = parts[0]
        if not hora and len(parts) > 1:
            hora = parts[1][:8]
    now = datetime.now()
    return fecha or now.date().isoformat(), hora or now.time().isoformat(timespec="seconds")


def normalize_role(value):
    value = (value or "SIN_ROL").replace("ROLE_", "")
    return value if value.strip() else "SIN_ROL"


def consolidate_auditoria():
    rows = []
    for db in AUDIT_DATABASES:
        path = BASE / db
        if not path.exists():
            continue
        con = sqlite3.connect(path)
        con.row_factory = sqlite3.Row
        if table_exists(con, "auditorias"):
            for row in con.execute("SELECT * FROM auditorias"):
                fecha, hora = split_fecha_hora(row)
                rows.append(
                    (
                        audit_value(row, ["usuario"], "anonimo"),
                        normalize_role(audit_value(row, ["rol"], "SIN_ROL")),
                        fecha,
                        hora,
                        audit_value(row, ["direccion_ip", "ip"], ""),
                        audit_value(row, ["modulo"], db.replace(".sqlite", "")),
                        audit_value(row, ["paciente"], ""),
                        audit_value(row, ["accion"], "SIN_ACCION"),
                        audit_value(row, ["resultado"], "OK"),
                    )
                )
        con.close()

    auth = sqlite3.connect(BASE / "Autenticacion.sqlite")
    auth.execute("DROP TABLE IF EXISTS auditorias_nuevo")
    auth.execute(
        "CREATE TABLE auditorias_nuevo ("
        + ", ".join(f"{name} {definition}" for name, definition in AUDIT_DEFINITION)
        + ")"
    )
    auth.executemany(
        "INSERT INTO auditorias_nuevo(usuario, rol, fecha, hora, direccion_ip, modulo, paciente, accion, resultado) VALUES (?,?,?,?,?,?,?,?,?)",
        rows,
    )
    auth.execute("DROP TABLE IF EXISTS auditorias")
    auth.execute("ALTER TABLE auditorias_nuevo RENAME TO auditorias")
    auth.commit()
    auth.close()

    for db in AUDIT_DATABASES:
        if db == "Autenticacion.sqlite":
            continue
        path = BASE / db
        if not path.exists():
            continue
        con = sqlite3.connect(path)
        con.execute("DROP TABLE IF EXISTS auditorias")
        con.commit()
        con.close()


def archive_duplicate_databases():
    LEGACY.mkdir(parents=True, exist_ok=True)
    canonical = {
        "autenticacion.sqlite",
        "pacientes.sqlite",
        "consultas.sqlite",
        "laboratorio.sqlite",
        "imagenologia.sqlite",
        "repositorioclinico.sqlite",
    }
    keep_exact = {
        "Autenticacion.sqlite",
        "Pacientes.sqlite",
        "Consultas.sqlite",
        "Laboratorio.sqlite",
        "Imagenologia.sqlite",
        "RepositorioClinico.sqlite",
    }
    for path in BASE.glob("*.sqlite"):
        if path.name in keep_exact:
            continue
        if path.name.lower() in canonical or path.name.endswith("DB.sqlite"):
            target = LEGACY / path.name
            if target.exists():
                target.unlink()
            path.rename(target)


def main():
    BASE.mkdir(parents=True, exist_ok=True)
    for migrate in [
        migrate_auth,
        migrate_patients,
        migrate_consultas,
        migrate_laboratorio,
        migrate_imagenologia,
        migrate_repositorio,
    ]:
        migrate()
    consolidate_auditoria()
    archive_duplicate_databases()
    print(f"Migracion completada en {BASE}")


if __name__ == "__main__":
    main()
