# Avance 3: Seguridad, despliegue cloud y evidencias finales

## Estado técnico actual

El proyecto ya cuenta con los componentes requeridos para la sustentación final:

- Microservicios Spring Boot dockerizados.
- Frontend React para consultar el Repositorio Clínico Regional.
- Autenticación JWT.
- Roles `ADMIN`, `MEDICO` y `LABORATORIO`.
- Control de acceso por rol con Spring Security.
- Auditoría de acciones clínicas y de consulta del repositorio.
- Bases SQLite independientes por microservicio con nombres en español.
- Integración REST del Repositorio Clínico Regional sin acceso directo a bases externas.
- Manejo de servicios no disponibles mediante `serviciosNoDisponibles`.

## Bases de datos locales

Las bases locales quedan montadas en:

```powershell
database\sqlite
```

Archivos:

- `Autenticacion.sqlite`
- `Pacientes.sqlite`
- `Consultas.sqlite`
- `Laboratorio.sqlite`
- `Imagenologia.sqlite`
- `RepositorioClinico.sqlite`

Tablas principales:

- `pacientes`
- `historias_clinicas_locales`
- `consultas`
- `resultados_laboratorio`
- `estudios_imagenologia`
- `auditorias`

## Endpoints principales para evidencias

Autenticación:

```http
POST /auth/login
```

Paciente Maestro Regional:

```http
POST /pacientes
GET /pacientes/{idPacienteRegional}
GET /pacientes/cedula/{cedula}
POST /pacientes/{idPacienteRegional}/historias-locales
```

Consulta Clínica:

```http
POST /consultas
GET /consultas/paciente/{idPacienteRegional}
```

Laboratorio Clínico:

```http
POST /laboratorios
GET /laboratorios/paciente/{idPacienteRegional}
```

Imagenología:

```http
POST /imagenologia
POST /imagenologia multipart/form-data
GET /imagenologia/paciente/{idPacienteRegional}
GET /imagenologia/{id}/archivo
```

Repositorio Clínico Regional:

```http
GET /repositorio/paciente/{idPacienteRegional}
GET /repositorio-clinico/auditorias
```

## Evidencias que faltan para cerrar Avance 3

Estas evidencias requieren acceso a una cuenta cloud real:

1. Crear proyecto en Railway o Fly.io.
2. Crear servicios cloud para:
   - Paciente Maestro Regional.
   - Consulta Clínica.
   - Laboratorio Clínico.
   - Imagenología.
   - Repositorio Clínico Regional.
   - Auth Service.
   - Frontend React.
3. Configurar variables de entorno:
   - `JWT_SECRET`
   - `CORS_ORIGINS`
   - `SERVICE_PACIENTES`
   - `SERVICE_CONSULTAS`
   - `SERVICE_LABORATORIOS`
   - `SERVICE_IMAGENOLOGIA`
4. Configurar DBaaS o volumen persistente según el proveedor.
5. Configurar storage cloud para archivos de imagenología.
6. Obtener URLs públicas funcionales.
7. Ejecutar Postman con URLs cloud.
8. Capturar:
   - Servicios desplegados.
   - Variables de entorno.
   - Logs de ejecución.
   - URLs públicas.
   - DBaaS o volumen persistente.
   - Storage cloud.
   - Postman usando URLs cloud.

## Qué debe hacer el usuario para continuar

Para completar lo que falta, se necesita una de estas opciones:

- Acceso iniciado en Railway o Fly.io en el navegador.
- Token o CLI configurado del proveedor cloud.
- Confirmación del proveedor elegido para adaptar variables, volúmenes y URLs.

Con ese acceso se puede terminar el despliegue real, tomar evidencias y actualizar Postman con URLs cloud.
