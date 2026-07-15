# Diseño de bases de datos independientes

Todas las bases se montan desde `./database/sqlite` hacia `/data` en Docker. Cada microservicio usa su propio archivo SQLite y se comunica con los demás por API REST.

## Autenticacion.sqlite

El servicio de autenticación mantiene usuarios de demostración en memoria para emitir JWT. La base se usa para auditoría de accesos y acciones.

Tabla `auditorias`:

| Campo | Tipo |
| --- | --- |
| id | INTEGER |
| usuario | TEXT |
| rol | TEXT |
| fecha | TEXT |
| hora | TEXT |
| direccion_ip | TEXT |
| modulo | TEXT |
| paciente | TEXT |
| accion | TEXT |
| resultado | TEXT |

## Pacientes.sqlite

Tabla `pacientes`:

| Campo | Tipo | Restricción |
| --- | --- | --- |
| id | INTEGER | PK autoincremental |
| id_paciente_regional | TEXT | Único, obligatorio |
| cedula | TEXT | Único, obligatorio |
| nombres | TEXT | Obligatorio |
| apellidos | TEXT | Obligatorio |
| fecha_nacimiento | TEXT | Obligatorio |
| edad | INTEGER | Calculado |
| sexo | TEXT | Obligatorio |
| estado_civil | TEXT | Obligatorio |
| direccion | TEXT | Obligatorio |
| provincia | TEXT | Obligatorio |
| ciudad | TEXT | Obligatorio |
| telefono | TEXT | Obligatorio |
| correo | TEXT | Obligatorio |
| contacto_emergencia | TEXT | Obligatorio |
| seguro | TEXT | Obligatorio |
| tipo_sangre | TEXT | Obligatorio |
| nacionalidad | TEXT | Obligatorio |
| observaciones | TEXT | Opcional |
| sede | TEXT | Opcional |

Tabla `historias_clinicas_locales`:

| Campo | Tipo | Restricción |
| --- | --- | --- |
| id | INTEGER | PK autoincremental |
| id_paciente_regional | TEXT | FK lógica hacia pacientes |
| sede | TEXT | Obligatorio |
| identificador_historia_local | TEXT | Obligatorio |

## Consultas.sqlite

Tabla `consultas`:

| Campo | Tipo |
| --- | --- |
| id | INTEGER |
| id_paciente_regional | TEXT |
| cedula | TEXT |
| fecha | TEXT |
| sede | TEXT |
| medico | TEXT |
| especialidad | TEXT |
| tipo_consulta | TEXT |
| diagnostico | TEXT |
| tratamiento | TEXT |
| motivo | TEXT |
| evolucion | TEXT |
| resultado | TEXT |
| observaciones | TEXT |

## Laboratorio.sqlite

Tabla `resultados_laboratorio`:

| Campo | Tipo |
| --- | --- |
| id | INTEGER |
| id_paciente_regional | TEXT |
| cedula | TEXT |
| fecha | TEXT |
| sede | TEXT |
| medico | TEXT |
| especialidad | TEXT |
| tipo_consulta | TEXT |
| diagnostico | TEXT |
| tratamiento | TEXT |
| motivo | TEXT |
| evolucion | TEXT |
| tipo_examen | TEXT |
| resultado | TEXT |
| observaciones | TEXT |
| estado | TEXT |
| prioridad | TEXT |
| tecnologo_responsable | TEXT |
| fecha_solicitud | TEXT |
| fecha_resultado | TEXT |
| valores | TEXT |
| unidad | TEXT |
| valor_referencia | TEXT |
| interpretacion | TEXT |
| codigo_muestra | TEXT |
| tipo_resultado | TEXT |
| resultado_critico | INTEGER |
| hora_resultado | TEXT |
| fecha_validacion | TEXT |
| usuario_valido | TEXT |
| observaciones_laboratorio | TEXT |
| consulta_id | INTEGER |

## Imagenologia.sqlite

Tabla `estudios_imagenologia`:

| Campo | Tipo |
| --- | --- |
| id | INTEGER |
| id_paciente_regional | TEXT |
| cedula | TEXT |
| fecha | TEXT |
| sede | TEXT |
| medico | TEXT |
| especialidad | TEXT |
| tipo_consulta | TEXT |
| diagnostico | TEXT |
| resultado | TEXT |
| observaciones | TEXT |
| tipo_estudio | TEXT |
| formato | TEXT |
| url | TEXT |
| region_anatomica | TEXT |
| estado | TEXT |
| prioridad | TEXT |
| tecnico_responsable | TEXT |
| hora | TEXT |
| fecha_solicitud | TEXT |
| fecha_realizacion | TEXT |
| observaciones_imagenologo | TEXT |
| hallazgos | TEXT |
| recomendaciones | TEXT |
| consulta_id | INTEGER |

Regla aplicada: `formato` solo acepta `PNG` o `DICOM`. Si se sube archivo, PNG debe tener extensión `.png` y cabecera PNG; DICOM debe tener extensión `.dcm` y cabecera DICOM.

## RepositorioClinico.sqlite

Tabla `historial_consultas_repositorio`:

| Campo | Tipo |
| --- | --- |
| id | INTEGER |
| paciente | TEXT |
| id_paciente_regional | TEXT |
| usuario | TEXT |
| fecha_hora | TEXT |
| resultado | TEXT |
| servicios_no_disponibles | TEXT |

Tabla `estado_servicios`:

| Campo | Tipo |
| --- | --- |
| id | INTEGER |
| servicio | TEXT |
| estado | TEXT |
| ultima_revision | TEXT |
| mensaje | TEXT |

Tabla `logs_integracion`:

| Campo | Tipo |
| --- | --- |
| id | INTEGER |
| servicio | TEXT |
| endpoint | TEXT |
| fecha_hora | TEXT |
| resultado | TEXT |
| tiempo_respuesta_ms | INTEGER |
| mensaje | TEXT |

Tabla `cache_clinica`:

| Campo | Tipo |
| --- | --- |
| id | INTEGER |
| id_paciente_regional | TEXT |
| fecha_hora | TEXT |
| resumen | TEXT |

Tabla `configuracion_repositorio`:

| Campo | Tipo |
| --- | --- |
| clave | TEXT |
| valor | TEXT |

## Auditoría central

La auditoría no se replica por microservicio. Todos los microservicios registran sus acciones en la tabla única `auditorias` de `Autenticacion.sqlite`.
