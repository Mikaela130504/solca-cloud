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
10. DB Browser for SQLite mostrando cada base en `database/sqlite`:
    - Autenticacion.sqlite.
    - Pacientes.sqlite.
    - Consultas.sqlite.
    - Laboratorio.sqlite.
    - Imagenologia.sqlite.
    - RepositorioClinico.sqlite.
11. Diagrama preliminar de arquitectura cloud.
12. Diagrama actualizado de integración.
13. Postman: asociación de historia clínica local en `POST /pacientes/{idPacienteRegional}/historias-locales`.
14. Postman: auditoría en `GET /repositorio-clinico/auditorias`.
15. Cloud: URLs públicas, variables de entorno, contenedores y DBaaS/storage del proveedor.

## Comandos útiles

```powershell
docker compose ps
docker compose logs --tail=80 repositorio-service
```

## Ubicación de bases SQLite en Docker

Las bases están montadas directamente en el proyecto. Abrir los archivos desde:

```powershell
C:\Users\USER\Documents\SEPTIMO\INFRAESTRUCTURA DE SISTEMA EN LA NUBE\PROYECTO-RETO\solca-cloud\database\sqlite
```

No es necesario copiar desde el contenedor si se usa `docker-compose.yml`, porque todos los servicios escriben en `./database/sqlite:/data`.
