# Pruebas en Postman

## Archivos a importar

Importar estos dos archivos:

- `postman/SOLCA-Avances.postman_collection.json`
- `postman/SOLCA-local.postman_environment.json`

Después, seleccionar el entorno `SOLCA Local Docker` en la esquina superior derecha de Postman.

## Orden obligatorio

1. Ejecutar primero `Login ADMIN`.
2. Verificar que la variable `token` tenga valor en el entorno.
3. Ejecutar `Crear paciente maestro`.
4. Ejecutar `Crear consulta clínica`.
5. Ejecutar `Crear resultado laboratorio`.
6. Ejecutar `Crear estudio imagenología`.
7. Ejecutar `Repositorio clínico integrado`.

## Si aparece 403

El error 403 significa que el token no se está enviando o no se ejecutó el login primero.

Revisar que cada request tenga este header:

```text
Authorization: Bearer {{token}}
```

No escribir solo el token. Debe incluir la palabra `Bearer`, un espacio y luego el token.

## Verificación rápida

El login debe devolver un JSON con:

```json
{
  "token": "...",
  "user": {
    "username": "admin",
    "role": "ADMIN"
  }
}
```
