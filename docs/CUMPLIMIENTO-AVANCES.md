# Cumplimiento de Avance 1 y Avance 2

## Avance 1: Diseño inicial y microservicios base

| Requisito | Estado | Evidencia en el proyecto |
| --- | --- | --- |
| Análisis del problema actual de SOLCA Cuenca, Manabí y Quito | Cumplido | `docs/AVANCE-1-DISENO.md` |
| Diagrama preliminar de arquitectura cloud | Cumplido | `docs/diagramas/arquitectura-cloud-preliminar.mmd` |
| Modelo del Paciente Maestro Regional | Cumplido | `docs/AVANCE-1-DISENO.md` y microservicio `services/paciente-maestro-regional` |
| Diseño de bases de datos independientes | Cumplido | `docs/BASES-DE-DATOS.md` |
| Identificación IaaS, PaaS, SaaS y DBaaS | Cumplido | `docs/AVANCE-1-DISENO.md` |
| Microservicio Paciente Maestro Regional | Cumplido | `services/paciente-maestro-regional`, puerto `8001` |
| Microservicio Consulta Clínica | Cumplido | `services/consulta-service`, puerto `8002` |
| Microservicio Laboratorio Clínico | Cumplido | `services/lab-service`, puerto `8003` |
| Microservicio Imagenología / PACS básico | Cumplido | `services/imaginologia-service`, puerto `8004` |
| Microservicio Repositorio Clínico Regional | Cumplido | `services/repositorio-service`, puerto `8005` |
| API REST básica por microservicio | Cumplido | Controladores Spring Boot en cada servicio |
| Base de datos independiente por microservicio | Cumplido | Volúmenes Docker independientes y archivos SQLite por servicio |
| Endpoints mínimos funcionales | Cumplido | Colección `postman/SOLCA-Avances.postman_collection.json` |
| Pruebas en Postman | Preparado | Importar colección Postman y tomar capturas |
| Repositorio GitHub creado | Pendiente de evidenciar | Tomar captura del repositorio remoto en GitHub |
| Código organizado por microservicios | Cumplido | Carpeta `services` |
| Capturas de Postman | Pendiente de captura manual | Ver `docs/EVIDENCIAS.md` |
| Capturas de bases de datos | Pendiente de captura manual | Ver `docs/EVIDENCIAS.md` |
| Diagrama preliminar | Cumplido | `docs/diagramas/arquitectura-cloud-preliminar.mmd` |

## Avance 2: Repositorio Clínico Regional e integración

| Requisito | Estado | Evidencia en el proyecto |
| --- | --- | --- |
| Diagrama actualizado de integración entre microservicios | Cumplido | `docs/diagramas/integracion-microservicios.mmd` |
| Explicación de comunicación mediante APIs REST | Cumplido | `docs/AVANCE-2-INTEGRACION.md` |
| Datos estructurados | Cumplido | `docs/AVANCE-2-INTEGRACION.md` |
| Datos no estructurados | Cumplido | `docs/AVANCE-2-INTEGRACION.md` |
| DBaaS | Cumplido en diseño | `docs/AVANCE-2-INTEGRACION.md` |
| Storage cloud | Cumplido en diseño | `docs/AVANCE-2-INTEGRACION.md` |
| Matriz preliminar de riesgos | Cumplido | `docs/MATRIZ-RIESGOS.md` |
| Repositorio consume Paciente Maestro | Cumplido | `services/repositorio-service` |
| Repositorio consume Consulta Clínica | Cumplido | `services/repositorio-service` |
| Repositorio consume Laboratorio | Cumplido | `services/repositorio-service` |
| Repositorio consume Imagenología | Cumplido | `services/repositorio-service` |
| Endpoint `GET /repositorio/paciente/{idPacienteRegional}` | Cumplido | `services/repositorio-service` |
| JSON consolidado con `paciente`, `consultas`, `laboratorio`, `imagenes` | Cumplido | Endpoint anterior |
| Llamadas REST entre servicios | Cumplido | `RestClient` en `RepositorioService` |
| No acceso directo entre bases de datos | Cumplido | Repositorio solo consume APIs REST |
| Manejo básico de errores si un microservicio no responde | Cumplido | Campo `serviciosNoDisponibles` |

## Pendiente fuera del código

Estas evidencias no se pueden completar desde el código porque son capturas visuales requeridas por la entrega:

- Captura del repositorio GitHub.
- Capturas de Postman ejecutando los endpoints.
- Capturas de las bases SQLite abiertas en DB Browser for SQLite o herramienta equivalente.
- Exportar o pegar los diagramas Mermaid como imagen en el documento final si el docente lo exige en formato gráfico.
