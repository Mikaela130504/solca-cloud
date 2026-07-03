# Avance 1: Diseño inicial y microservicios base

## Análisis del problema actual

SOLCA Cuenca, SOLCA Manabí y SOLCA Quito operan con sistemas hospitalarios independientes, basados en infraestructura local y bases de datos aisladas. Esta situación impide consultar de forma integrada la información clínica de un paciente cuando recibe atención en diferentes sedes.

Los principales problemas identificados son:

- Duplicidad de pacientes por falta de un identificador regional único.
- Historias clínicas locales separadas por sede.
- Dificultad para consultar antecedentes, resultados de laboratorio y estudios de imagenología entre hospitales.
- Dependencia de servidores locales.
- Escalabilidad limitada.
- Riesgo de indisponibilidad ante fallas locales.
- Mayor costo operativo por mantenimiento independiente.

## Arquitectura propuesta

La solución utiliza microservicios independientes desplegados en contenedores Docker. Cada microservicio expone una API REST propia y mantiene su propia base de datos SQLite en esta fase local del proyecto.

Componentes principales:

| Componente | Función |
| --- | --- |
| Paciente Maestro Regional | Identificación única regional del paciente |
| Consulta Clínica | Registro y consulta de atenciones médicas |
| Laboratorio Clínico | Registro y consulta de resultados de laboratorio |
| Imagenología / PACS básico | Registro de estudios y archivos clínicos |
| Repositorio Clínico Regional | Vista clínica integrada consumiendo APIs REST |
| Auth Service | Autenticación JWT y roles |

## Modelo del Paciente Maestro Regional

El Paciente Maestro Regional centraliza la identificación del paciente mediante un identificador único con formato:

```text
PAC-0000001
PAC-0000002
PAC-0000003
```

Antes de registrar un paciente, el sistema valida:

- Cédula ecuatoriana.
- Existencia previa de la cédula.
- Campos obligatorios.
- Formatos de correo, teléfono y fecha.

También permite asociar historias clínicas locales de cada sede para mantener la relación entre el identificador regional y los registros hospitalarios anteriores.

## Componentes cloud iniciales

| Categoría | Componente propuesto | Uso en el proyecto |
| --- | --- | --- |
| IaaS | Máquina virtual o servicio de contenedores | Ejecución de Docker y microservicios |
| PaaS | Plataforma para aplicaciones Spring Boot | Despliegue de APIs REST |
| SaaS | GitHub | Repositorio y control de versiones |
| DBaaS | PostgreSQL Cloud en fase futura | Persistencia administrada en nube |
| Storage cloud | Almacenamiento de objetos | Archivos DICOM, PDF e informes |

En esta fase de desarrollo local se usa SQLite por microservicio para cumplir la independencia de bases de datos y facilitar la ejecución en Docker.
