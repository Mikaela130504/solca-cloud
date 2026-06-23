# SOLCA Cloud - Proyecto Reto

Implementacion practica de una arquitectura cloud basada en microservicios para integrar la informacion clinica de SOLCA Cuenca, SOLCA Quito y SOLCA Manabi.

## Componentes

| Puerto | Servicio | Responsabilidad |
| --- | --- | --- |
| 8000 | auth-service | Login y generacion de JWT |
| 8001 | patient-service | Paciente Maestro Regional e historias locales |
| 8002 | consultation-service | Consultas clinicas |
| 8003 | lab-service | Resultados de laboratorio |
| 8004 | imaging-service | Estudios de imagenologia/PACS |
| 8005 | repository-service | Vista clinica regional unificada |
| 8006 | audit-service | Consulta de auditoria |
| 5432 | postgres | Persistencia relacional PostgreSQL |

La base usa esquemas PostgreSQL por dominio: `paciente`, `consulta`, `laboratorio`, `imagenologia` y `auditoria`.

## Requisitos

- Docker
- Docker Compose

## Ejecucion

```bash
cp .env.example .env
docker compose up --build
```

Cuando los contenedores esten activos, cada microservicio publica documentacion Swagger en:

- http://localhost:8000/docs
- http://localhost:8001/docs
- http://localhost:8002/docs
- http://localhost:8003/docs
- http://localhost:8004/docs
- http://localhost:8005/docs
- http://localhost:8006/docs

## Usuarios de prueba

| Usuario | Clave | Rol |
| --- | --- | --- |
| admin | admin123 | ADMIN |
| dr.perez | medico123 | MEDICO |
| lab.suarez | lab123 | LABORATORIO |

## Flujo de prueba rapido

1. Obtener token de medico:

```bash
curl -X POST http://localhost:8000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"dr.perez\",\"password\":\"medico123\"}"
```

2. Consultar la vista clinica regional con el token recibido:

```bash
curl http://localhost:8005/repositorio/paciente/PAC-00001 ^
  -H "Authorization: Bearer TU_TOKEN"
```

3. Obtener token de administrador y consultar auditoria:

```bash
curl http://localhost:8006/auditoria ^
  -H "Authorization: Bearer TOKEN_ADMIN"
```

## Endpoints principales

### Auth

- `POST /auth/login`

### Paciente Maestro Regional

- `POST /pacientes` requiere `ADMIN`
- `GET /pacientes/{id}` requiere `ADMIN`, `MEDICO` o `LABORATORIO`
- `GET /pacientes/cedula/{cedula}` requiere `ADMIN`, `MEDICO` o `LABORATORIO`

### Consulta Clinica

- `POST /consultas` requiere `MEDICO` o `ADMIN`
- `GET /consultas/paciente/{id}` requiere `MEDICO` o `ADMIN`

### Laboratorio

- `POST /laboratorio` requiere `LABORATORIO` o `ADMIN`
- `GET /laboratorio/paciente/{id}` requiere `MEDICO`, `LABORATORIO` o `ADMIN`

### Imagenologia

- `POST /imagenologia` requiere `MEDICO` o `ADMIN`
- `GET /imagenologia/paciente/{id}` requiere `MEDICO` o `ADMIN`

### Repositorio Clinico Regional

- `GET /repositorio/paciente/{id}` requiere `MEDICO` o `ADMIN`

### Auditoria

- `GET /auditoria` requiere `ADMIN`
- `GET /auditoria/paciente/{id}` requiere `ADMIN`

## Estructura

```text
database/init/
  01_schema.sql
  02_seed.sql
services/
  auth-service/
  patient-service/
  consultation-service/
  lab-service/
  imaging-service/
  repository-service/
  audit-service/
  shared/solca_common/
docker-compose.yml
```

