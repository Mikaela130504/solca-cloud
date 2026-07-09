# Diseño de bases de datos independientes

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
| tipo_examen | TEXT |
| resultado | TEXT |
| observaciones | TEXT |

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
| tipo_estudio | TEXT |
| formato | TEXT |
| url | TEXT |
| region_anatomica | TEXT |
| resultado | TEXT |
| observaciones | TEXT |

## Auditoría

Cada microservicio mantiene su propia tabla `auditorias`:

| Campo | Tipo |
| --- | --- |
| id | INTEGER |
| usuario | TEXT |
| fecha_hora | TEXT |
| accion | TEXT |
| paciente | TEXT |
| endpoint | TEXT |
