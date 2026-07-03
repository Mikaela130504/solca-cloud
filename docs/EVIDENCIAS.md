# Evidencias para entregar

## Capturas obligatorias

Tomar las siguientes capturas:

1. GitHub con el repositorio `solca-cloud`.
2. Docker Desktop mostrando los contenedores ejecutándose.
3. Postman: login en `POST /auth/login`.
4. Postman: creación de paciente en `POST /pacientes`.
5. Postman: consulta de paciente en `GET /pacientes/{idPacienteRegional}`.
6. Postman: creación de consulta en `POST /consultas`.
7. Postman: creación de laboratorio en `POST /laboratorios`.
8. Postman: creación de imagenología en `POST /imagenologia`.
9. Postman: integración en `GET /repositorio/paciente/{idPacienteRegional}`.
10. DB Browser for SQLite mostrando cada base:
    - PacienteDB.sqlite.
    - ConsultaDB.sqlite.
    - LaboratorioDB.sqlite.
    - ImagenologiaDB.sqlite.
11. Diagrama preliminar de arquitectura cloud.
12. Diagrama actualizado de integración.

## Comandos útiles

```powershell
docker compose ps
docker compose logs --tail=80 repositorio-service
```

## Ubicación de bases SQLite en Docker

Las bases están dentro de volúmenes Docker montados en `/data` dentro de cada contenedor. Para copiar una base al proyecto y abrirla con DB Browser:

```powershell
docker cp solca-cloud-paciente-maestro-regional-1:/data/PacienteDB.sqlite ./PacienteDB.sqlite
docker cp solca-cloud-consulta-service-1:/data/ConsultaDB.sqlite ./ConsultaDB.sqlite
docker cp solca-cloud-lab-service-1:/data/LaboratorioDB.sqlite ./LaboratorioDB.sqlite
docker cp solca-cloud-imaginologia-service-1:/data/ImagenologiaDB.sqlite ./ImagenologiaDB.sqlite
```
