INSERT INTO paciente.pacientes (
    id_paciente_regional, cedula, nombres, apellidos, fecha_nacimiento, sexo, telefono, direccion
) VALUES
    ('PAC-00001', '0102030405', 'Ana Maria', 'Torres', '1990-05-10', 'F', '0991112222', 'Cuenca'),
    ('PAC-00002', '1712345678', 'Carlos Andres', 'Mendoza', '1982-11-21', 'M', '0983334444', 'Quito')
ON CONFLICT (id_paciente_regional) DO NOTHING;

INSERT INTO paciente.historias_locales (id_paciente_regional, sede, historia_clinica) VALUES
    ('PAC-00001', 'SOLCA-CUENCA', 'HC-12345'),
    ('PAC-00001', 'SOLCA-QUITO', 'HC-98765'),
    ('PAC-00002', 'SOLCA-MANABI', 'HC-45678')
ON CONFLICT (sede, historia_clinica) DO NOTHING;

INSERT INTO consulta.consultas (
    id_paciente_regional, fecha_consulta, medico, especialidad, diagnostico, tratamiento, sede
) VALUES
    ('PAC-00001', '2026-06-22 10:30:00', 'Dra. Paula Perez', 'Oncologia', 'Control post tratamiento', 'Seguimiento mensual', 'SOLCA-CUENCA'),
    ('PAC-00002', '2026-06-20 09:15:00', 'Dr. Luis Castro', 'Medicina Interna', 'Valoracion inicial', 'Solicitar laboratorio completo', 'SOLCA-MANABI');

INSERT INTO laboratorio.resultados_laboratorio (
    id_paciente_regional, examen, resultado, valor_referencia, fecha_resultado, sede
) VALUES
    ('PAC-00001', 'Hemoglobina', '13.5 g/dL', '12.0 - 15.5 g/dL', '2026-06-22 12:00:00', 'SOLCA-CUENCA'),
    ('PAC-00002', 'Leucocitos', '7800 /uL', '4500 - 11000 /uL', '2026-06-20 11:00:00', 'SOLCA-MANABI');

INSERT INTO imagenologia.estudios_imagen (
    id_paciente_regional, tipo_estudio, fecha_estudio, formato, url_archivo, tamano_mb, sede
) VALUES
    ('PAC-00001', 'Tomografia de torax', '2026-06-21 15:30:00', 'DICOM', 's3://solca-pacs/PAC-00001/tac-torax.dcm', 128.4, 'SOLCA-QUITO'),
    ('PAC-00002', 'Radiografia simple', '2026-06-20 13:45:00', 'DICOM', 's3://solca-pacs/PAC-00002/rx-simple.dcm', 32.7, 'SOLCA-MANABI');

INSERT INTO auditoria.auditoria (usuario, rol, accion, paciente_consultado, fecha_hora) VALUES
    ('dr.perez', 'MEDICO', 'CONSULTA_REPOSITORIO', 'PAC-00001', '2026-06-22 10:30:00');

