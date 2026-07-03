# Avance 2: Repositorio Clínico Regional e integración

## Integración entre microservicios

El Repositorio Clínico Regional no accede directamente a ninguna base de datos clínica. Su función es consumir las APIs REST de los microservicios operativos y construir una respuesta consolidada por paciente.

Servicios consumidos:

- Paciente Maestro Regional.
- Consulta Clínica.
- Laboratorio Clínico.
- Imagenología / PACS básico.

Endpoint obligatorio implementado:

```http
GET /repositorio/paciente/{idPacienteRegional}
```

Respuesta esperada:

```json
{
  "paciente": {},
  "consultas": [],
  "laboratorio": [],
  "imagenes": [],
  "serviciosNoDisponibles": []
}
```

## Comunicación mediante APIs REST

La comunicación se realiza mediante HTTP y JSON. El cliente envía un token JWT en el encabezado `Authorization`. El Repositorio Clínico Regional reutiliza ese token para consultar los demás microservicios.

Flujo:

1. El usuario inicia sesión en `auth-service`.
2. El frontend recibe un token JWT.
3. El frontend consulta el repositorio clínico.
4. El repositorio clínico llama por REST a pacientes, consultas, laboratorio e imagenología.
5. El repositorio devuelve un JSON consolidado.

## Infraestructura de datos

Datos estructurados:

- Pacientes.
- Historias clínicas locales.
- Consultas médicas.
- Resultados de laboratorio.
- Metadatos de estudios de imagenología.
- Auditoría.

Datos no estructurados:

- Informes PDF.
- Imágenes JPG o PNG.
- Archivos DICOM.
- Documentos clínicos adjuntos.

DBaaS:

- En la siguiente etapa cloud, las bases SQLite independientes pueden migrarse a PostgreSQL administrado por proveedor cloud.

Storage cloud:

- Los archivos de imagenología pueden migrarse a almacenamiento de objetos, manteniendo en la base únicamente la URL del archivo.

## Manejo de errores

Si un microservicio no responde, el repositorio no detiene toda la consulta. En su lugar:

- Devuelve una lista vacía para el servicio afectado.
- Agrega el nombre del servicio al campo `serviciosNoDisponibles`.
- Mantiene disponible la información obtenida desde los servicios restantes.
