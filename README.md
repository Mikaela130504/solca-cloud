# SOLCA Cloud

Proyecto práctico con frontend React y microservicios Spring Boot independientes para integrar información clínica regional.

## Servicios

| Puerto | Servicio | Base SQLite |
| --- | --- | --- |
| 8000 | auth-service | AuthDB.sqlite |
| 8001 | paciente-maestro-regional | PacienteDB.sqlite |
| 8002 | consulta-service | ConsultaDB.sqlite |
| 8003 | lab-service | LaboratorioDB.sqlite |
| 8004 | imaginologia-service | ImagenologiaDB.sqlite |
| 8005 | repositorio-service | RepositorioDB.sqlite |

## Usuarios iniciales

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| admin | admin123 | ADMIN |
| medico | medico123 | MEDICO |
| laboratorio | lab123 | LABORATORIO |

## Ejecución

```powershell
docker compose up --build
```

Frontend:

```powershell
cd frontend-solca
npm install
npm run dev
```

## Verificación

```powershell
cd frontend-solca
npm run lint
npm run build
```

Para compilar cada microservicio sin Docker:

```powershell
cd services/auth-service
mvn -DskipTests package
```

Repetir en cada carpeta de `services`.

## Arquitectura

Cada microservicio tiene su propio proyecto Spring Boot, su API REST, su base SQLite y su tabla de auditoría. El Repositorio Clínico Regional no accede directamente a bases de datos clínicas; consume las APIs de pacientes, consultas, laboratorio e imagenología y devuelve una vista consolidada con la lista de servicios no disponibles cuando alguno falla.
