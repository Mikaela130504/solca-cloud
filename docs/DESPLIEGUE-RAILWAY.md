# Despliegue en Railway

## Causa del fallo actual

Railway intentó construir el repositorio completo `solca-cloud` como una sola aplicación. El proyecto es un monorepo, por eso cada componente debe desplegarse como un servicio separado usando su propia carpeta raíz.

## Servicios que se deben crear

Crear un servicio Railway por cada carpeta:

| Servicio Railway | Root Directory |
| --- | --- |
| `auth-service` | `services/auth-service` |
| `paciente-maestro-regional` | `services/paciente-maestro-regional` |
| `consulta-service` | `services/consulta-service` |
| `lab-service` | `services/lab-service` |
| `imaginologia-service` | `services/imaginologia-service` |
| `repositorio-service` | `services/repositorio-service` |
| `frontend-solca` | `frontend-solca` |

## Variables generales

Todos los microservicios Spring Boot:

```env
JWT_SECRET=solca-cloud-secret-solca-cloud-secret-solca-cloud-secret
CORS_ORIGINS=https://URL-DEL-FRONTEND.up.railway.app
```

Repositorio Clínico Regional:

```env
SERVICE_PACIENTES=https://URL-PACIENTE.up.railway.app
SERVICE_CONSULTAS=https://URL-CONSULTA.up.railway.app
SERVICE_LABORATORIOS=https://URL-LABORATORIO.up.railway.app
SERVICE_IMAGENOLOGIA=https://URL-IMAGENOLOGIA.up.railway.app
```

Frontend:

```env
VITE_AUTH_API_URL=https://URL-AUTH.up.railway.app
VITE_PATIENT_API_URL=https://URL-PACIENTE.up.railway.app
VITE_CONSULTATION_API_URL=https://URL-CONSULTA.up.railway.app
VITE_LABORATORY_API_URL=https://URL-LABORATORIO.up.railway.app
VITE_IMAGING_API_URL=https://URL-IMAGENOLOGIA.up.railway.app
VITE_REPOSITORY_API_URL=https://URL-REPOSITORIO.up.railway.app
```

## Orden recomendado

1. Desplegar `auth-service`.
2. Desplegar `paciente-maestro-regional`.
3. Desplegar `consulta-service`.
4. Desplegar `lab-service`.
5. Desplegar `imaginologia-service`.
6. Configurar las URLs anteriores y desplegar `repositorio-service`.
7. Configurar las URLs del frontend y desplegar `frontend-solca`.

## Evidencias para capturar

- Deploy exitoso de cada servicio.
- URL pública de cada servicio.
- Variables de entorno.
- Logs sin errores.
- Postman usando URLs Railway.
- Frontend consultando el repositorio clínico.
