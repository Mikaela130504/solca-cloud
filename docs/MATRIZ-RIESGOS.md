# Matriz preliminar de riesgos

| Riesgo | Impacto | Probabilidad | Mitigación |
| --- | --- | --- | --- |
| Caída de un microservicio | Alto | Media | Contenedores independientes y manejo de errores en repositorio |
| Acceso no autorizado | Alto | Media | JWT y control de roles |
| Duplicidad de pacientes | Medio | Media | Validación de cédula e identificador regional único |
| Pérdida de información clínica | Alto | Baja | Respaldos de base de datos en fase cloud |
| Falla de comunicación entre servicios | Alto | Media | Campo `serviciosNoDisponibles` y respuesta parcial |
| Crecimiento de archivos de imagenología | Medio | Media | Migración a storage cloud |
| Exposición de datos sensibles | Alto | Baja | Autenticación, autorización y auditoría |
