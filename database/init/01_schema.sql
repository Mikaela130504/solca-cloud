CREATE SCHEMA IF NOT EXISTS paciente;
CREATE SCHEMA IF NOT EXISTS consulta;
CREATE SCHEMA IF NOT EXISTS laboratorio;
CREATE SCHEMA IF NOT EXISTS imagenologia;
CREATE SCHEMA IF NOT EXISTS auditoria;

CREATE TABLE IF NOT EXISTS paciente.pacientes (
    id_paciente_regional VARCHAR(20) PRIMARY KEY,
    cedula VARCHAR(10) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo CHAR(1) NOT NULL CHECK (sexo IN ('M', 'F')),
    telefono VARCHAR(15),
    direccion VARCHAR(200),
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paciente.historias_locales (
    id SERIAL PRIMARY KEY,
    id_paciente_regional VARCHAR(20) NOT NULL REFERENCES paciente.pacientes(id_paciente_regional) ON DELETE CASCADE,
    sede VARCHAR(50) NOT NULL,
    historia_clinica VARCHAR(30) NOT NULL,
    UNIQUE (sede, historia_clinica)
);

CREATE INDEX IF NOT EXISTS idx_historias_paciente
    ON paciente.historias_locales(id_paciente_regional);

CREATE TABLE IF NOT EXISTS consulta.consultas (
    id_consulta SERIAL PRIMARY KEY,
    id_paciente_regional VARCHAR(20) NOT NULL REFERENCES paciente.pacientes(id_paciente_regional),
    fecha_consulta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    medico VARCHAR(100) NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    diagnostico TEXT NOT NULL,
    tratamiento TEXT,
    sede VARCHAR(50) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consultas_paciente
    ON consulta.consultas(id_paciente_regional);

CREATE TABLE IF NOT EXISTS laboratorio.resultados_laboratorio (
    id_resultado SERIAL PRIMARY KEY,
    id_paciente_regional VARCHAR(20) NOT NULL REFERENCES paciente.pacientes(id_paciente_regional),
    examen VARCHAR(100) NOT NULL,
    resultado VARCHAR(100) NOT NULL,
    valor_referencia VARCHAR(100),
    fecha_resultado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sede VARCHAR(50) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_laboratorio_paciente
    ON laboratorio.resultados_laboratorio(id_paciente_regional);

CREATE TABLE IF NOT EXISTS imagenologia.estudios_imagen (
    id_estudio SERIAL PRIMARY KEY,
    id_paciente_regional VARCHAR(20) NOT NULL REFERENCES paciente.pacientes(id_paciente_regional),
    tipo_estudio VARCHAR(100) NOT NULL,
    fecha_estudio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    formato VARCHAR(20) NOT NULL,
    url_archivo TEXT NOT NULL,
    tamano_mb DOUBLE PRECISION,
    sede VARCHAR(50) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_imagenologia_paciente
    ON imagenologia.estudios_imagen(id_paciente_regional);

CREATE TABLE IF NOT EXISTS auditoria.auditoria (
    id_auditoria SERIAL PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    accion VARCHAR(100) NOT NULL,
    paciente_consultado VARCHAR(20),
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_paciente
    ON auditoria.auditoria(paciente_consultado);

