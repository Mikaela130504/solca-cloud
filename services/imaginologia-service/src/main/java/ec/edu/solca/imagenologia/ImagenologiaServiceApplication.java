package ec.edu.solca.imagenologia;

import ec.edu.solca.common.Auditoria;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@SpringBootApplication(scanBasePackages = "ec.edu.solca")
public class ImagenologiaServiceApplication {
  public static void main(String[] args) { SpringApplication.run(ImagenologiaServiceApplication.class, args); }
  @Bean CommandLineRunner schema(RegistroRepository repo) { return args -> repo.schema(); }
}

record RegistroDto(Long id, String idPacienteRegional, String cedula, LocalDate fecha, String sede, String medico, String especialidad, String tipoConsulta, String diagnostico, String tratamiento, String motivo, String evolucion, String tipoExamen, String resultado, String observaciones, String tipoEstudio, String formato, String url, String regionAnatomica, String estado, String prioridad, String tecnicoResponsable, LocalTime hora, LocalDateTime fechaSolicitud, LocalDateTime fechaRealizacion, String observacionesImagenologo, String hallazgos, String recomendaciones, Long consultaId) {}
record RegistroRequest(@NotBlank String cedula, String idPacienteRegional, @NotNull LocalDate fecha, @NotBlank String sede, String medico, String especialidad, String tipoConsulta, String diagnostico, String tratamiento, String motivo, String evolucion, String tipoExamen, String resultado, String observaciones, String tipoEstudio, String formato, String url, String regionAnatomica, String estado, String prioridad, String tecnicoResponsable, String hora, String observacionesImagenologo, String hallazgos, String recomendaciones, Long consultaId) {}

@RestController
@RequestMapping("/imagenologia")
class RegistroController {
  private final RegistroService service;
  RegistroController(RegistroService service) { this.service = service; }
  @GetMapping @PreAuthorize("hasAnyRole('ADMIN','MEDICO','IMAGENOLOGIA')") List<RegistroDto> listar(@RequestParam(defaultValue="") String estado, @RequestParam(defaultValue="") String sede, @RequestParam(defaultValue="") String paciente) { return service.listar(estado, sede, paciente); }
  @GetMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO','IMAGENOLOGIA')") RegistroDto obtener(@PathVariable("id") Long id) { return service.obtener(id); }
  @GetMapping("/{id}/archivo") @PreAuthorize("hasAnyRole('ADMIN','MEDICO','IMAGENOLOGIA')") ResponseEntity<byte[]> descargar(@PathVariable("id") Long id) throws Exception { return service.descargar(id); }
  @GetMapping("/paciente/{idPacienteRegional}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO','IMAGENOLOGIA')") List<RegistroDto> porPaciente(@PathVariable("idPacienteRegional") String idPacienteRegional) { return service.porPaciente(idPacienteRegional); }
  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE) @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") RegistroDto crear(@Valid @RequestBody RegistroRequest request, HttpServletRequest http) { return service.crear(request, http); }
  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE) @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('ADMIN','MEDICO','IMAGENOLOGIA')") RegistroDto crearConArchivo(
    @RequestParam String cedula,
    @RequestParam(required=false) String idPacienteRegional,
    @RequestParam String fecha,
    @RequestParam String sede,
    @RequestParam(required=false) String medico,
    @RequestParam(required=false) String especialidad,
    @RequestParam(required=false) String tipoConsulta,
    @RequestParam(required=false) String diagnostico,
    @RequestParam(required=false) String tipoEstudio,
    @RequestParam(required=false) String formato,
    @RequestParam(required=false) String prioridad,
    @RequestParam(required=false) Long consultaId,
    @RequestParam(required=false) String regionAnatomica,
    @RequestParam(required=false) String resultado,
    @RequestParam(required=false) String observaciones,
    @RequestParam(required=false) String observacionesImagenologo,
    @RequestParam(required=false) String hallazgos,
    @RequestParam(required=false) String recomendaciones,
    @RequestParam(required=false) String estado,
    @RequestParam(required=false) String tecnicoResponsable,
    @RequestParam(required=false) String hora,
    @RequestParam(required=false, name="archivo") MultipartFile archivo,
    HttpServletRequest http
  ) throws Exception {
    String url = null;
    if (archivo != null && !archivo.isEmpty()) {
      Path dir = Paths.get("/data/archivos");
      Files.createDirectories(dir);
      String fileName = System.currentTimeMillis() + "-" + archivo.getOriginalFilename().replaceAll("[^A-Za-z0-9._-]", "_");
      Path target = dir.resolve(fileName);
      archivo.transferTo(target);
      url = target.toString();
    }
    return service.crear(new RegistroRequest(cedula, idPacienteRegional, LocalDate.parse(fecha), sede, medico, especialidad, tipoConsulta, diagnostico, null, null, null, null, resultado, observaciones, tipoEstudio, formato, url, regionAnatomica, estado, prioridad, tecnicoResponsable, hora, observacionesImagenologo, hallazgos, recomendaciones, consultaId), http);
  }
  @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','IMAGENOLOGIA')") RegistroDto editar(@PathVariable("id") Long id, @Valid @RequestBody RegistroRequest request, HttpServletRequest http) { return service.editar(id, request, http); }
  @PutMapping(value="/{id}/resultado", consumes = MediaType.APPLICATION_JSON_VALUE) @PreAuthorize("hasAnyRole('ADMIN','IMAGENOLOGIA')") RegistroDto registrarResultado(@PathVariable("id") Long id, @Valid @RequestBody RegistroRequest request, HttpServletRequest http) { return service.registrarResultado(id, request, http); }
  @PutMapping(value="/{id}/resultado", consumes = MediaType.MULTIPART_FORM_DATA_VALUE) @PreAuthorize("hasAnyRole('ADMIN','IMAGENOLOGIA')") RegistroDto registrarResultadoArchivo(
    @PathVariable("id") Long id,
    @RequestParam(required=false) String formato,
    @RequestParam(required=false) String resultado,
    @RequestParam(required=false) String observaciones,
    @RequestParam(required=false) String observacionesImagenologo,
    @RequestParam(required=false) String hallazgos,
    @RequestParam(required=false) String recomendaciones,
    @RequestParam(required=false) String tecnicoResponsable,
    @RequestParam(required=false) String hora,
    @RequestParam(required=false, name="archivo") MultipartFile archivo,
    HttpServletRequest http
  ) throws Exception {
    String url = null;
    if (archivo != null && !archivo.isEmpty()) {
      Path dir = Paths.get("/data/archivos");
      Files.createDirectories(dir);
      String original = archivo.getOriginalFilename() == null ? "estudio.bin" : archivo.getOriginalFilename();
      String fileName = System.currentTimeMillis() + "-" + original.replaceAll("[^A-Za-z0-9._-]", "_");
      Path target = dir.resolve(fileName);
      archivo.transferTo(target);
      url = target.toString();
    }
    RegistroDto actual = service.obtener(id);
    return service.registrarResultado(id, new RegistroRequest(actual.cedula(), actual.idPacienteRegional(), actual.fecha(), actual.sede(), actual.medico(), actual.especialidad(), actual.tipoConsulta(), actual.diagnostico(), actual.tratamiento(), actual.motivo(), actual.evolucion(), actual.tipoExamen(), resultado, actual.observaciones(), actual.tipoEstudio(), formato, url, actual.regionAnatomica(), "REALIZADO", actual.prioridad(), tecnicoResponsable, hora, observacionesImagenologo == null ? observaciones : observacionesImagenologo, hallazgos, recomendaciones, actual.consultaId()), http);
  }
  @PutMapping("/{id}/estado/{estado}") @PreAuthorize("hasAnyRole('ADMIN','IMAGENOLOGIA')") RegistroDto cambiarEstado(@PathVariable("id") Long id, @PathVariable("estado") String estado, HttpServletRequest http) { return service.cambiarEstado(id, estado, http); }
  @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasAnyRole('ADMIN','IMAGENOLOGIA')") void eliminar(@PathVariable("id") Long id, HttpServletRequest http) { service.eliminar(id, http); }
}

@org.springframework.stereotype.Service
class RegistroService {
  private final RegistroRepository repo;
  RegistroService(RegistroRepository repo) { this.repo = repo; }
  List<RegistroDto> listar(String estado, String sede, String paciente) { return repo.listar(estado, sede, paciente); }
  RegistroDto obtener(Long id) { return repo.obtener(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado.")); }
  List<RegistroDto> porPaciente(String id) { return repo.porPaciente(id); }
  RegistroDto crear(RegistroRequest r, HttpServletRequest http) { if (r.fecha().isAfter(LocalDate.now())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha no puede ser futura."); Sedes.validar(r.sede()); RegistroDto dto = repo.crear(r); Auditoria.registrar(repo.jdbc(), "SOLICITAR_IMAGENOLOGIA", dto.idPacienteRegional(), http); return dto; }
  RegistroDto editar(Long id, RegistroRequest r, HttpServletRequest http) { if (r.fecha().isAfter(LocalDate.now())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha no puede ser futura."); Sedes.validar(r.sede()); RegistroDto dto = repo.editar(id, r); Auditoria.registrar(repo.jdbc(), "EDITAR_IMAGENOLOGIA", dto.idPacienteRegional(), http); return dto; }
  RegistroDto registrarResultado(Long id, RegistroRequest r, HttpServletRequest http) { RegistroDto dto = repo.registrarResultado(id, r); Auditoria.registrar(repo.jdbc(), "REGISTRAR_ESTUDIO_IMAGENOLOGIA", dto.idPacienteRegional(), http); return dto; }
  RegistroDto cambiarEstado(Long id, String estado, HttpServletRequest http) { RegistroDto dto = repo.cambiarEstado(id, estado); Auditoria.registrar(repo.jdbc(), "CAMBIAR_ESTADO_IMAGENOLOGIA_" + estado.toUpperCase(Locale.ROOT), dto.idPacienteRegional(), http); return dto; }
  void eliminar(Long id, HttpServletRequest http) { String paciente = obtener(id).idPacienteRegional(); repo.eliminar(id); Auditoria.registrar(repo.jdbc(), "ELIMINAR_IMAGENOLOGIA", paciente, http); }
  ResponseEntity<byte[]> descargar(Long id) throws Exception {
    RegistroDto dto = obtener(id);
    if (dto.url() == null || dto.url().isBlank()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El estudio no tiene archivo asociado.");
    Path path = Paths.get(dto.url());
    if (!Files.exists(path) || !Files.isRegularFile(path)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Archivo de estudio no encontrado.");
    String filename = path.getFileName().toString();
    return ResponseEntity.ok()
      .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
      .contentType(MediaType.APPLICATION_OCTET_STREAM)
      .body(Files.readAllBytes(path));
  }
}

@org.springframework.stereotype.Repository
class RegistroRepository {
  private final JdbcTemplate jdbc;
  RegistroRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
  JdbcTemplate jdbc() { return jdbc; }
  void schema() {
    jdbc.execute("CREATE TABLE IF NOT EXISTS estudios_imagenologia (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, cedula TEXT NOT NULL, fecha TEXT NOT NULL, sede TEXT NOT NULL, medico TEXT, especialidad TEXT, tipo_consulta TEXT, diagnostico TEXT, tratamiento TEXT, motivo TEXT, evolucion TEXT, tipo_examen TEXT, resultado TEXT, observaciones TEXT, tipo_estudio TEXT, formato TEXT, url TEXT, region_anatomica TEXT)");
    jdbc.update("UPDATE estudios_imagenologia SET sede='SOLCA Quito' WHERE sede IS NULL OR TRIM(sede) = '' OR sede NOT IN ('SOLCA Cuenca','SOLCA Quito','SOLCA Guayaquil')");
    agregarColumna("estudios_imagenologia", "estado", "TEXT DEFAULT 'SOLICITADO'");
    agregarColumna("estudios_imagenologia", "prioridad", "TEXT DEFAULT 'NORMAL'");
    agregarColumna("estudios_imagenologia", "observaciones_imagenologo", "TEXT");
    agregarColumna("estudios_imagenologia", "hallazgos", "TEXT");
    agregarColumna("estudios_imagenologia", "recomendaciones", "TEXT");
    agregarColumna("estudios_imagenologia", "consulta_id", "INTEGER");
    agregarColumna("estudios_imagenologia", "tecnico_responsable", "TEXT");
    agregarColumna("estudios_imagenologia", "hora", "TEXT");
    agregarColumna("estudios_imagenologia", "fecha_solicitud", "TEXT");
    agregarColumna("estudios_imagenologia", "fecha_realizacion", "TEXT");
    jdbc.update("UPDATE estudios_imagenologia SET estado='REALIZADO' WHERE estado IS NULL AND url IS NOT NULL AND TRIM(url) <> ''");
    jdbc.update("UPDATE estudios_imagenologia SET estado='SOLICITADO' WHERE estado IS NULL OR TRIM(estado) = ''");
    jdbc.update("UPDATE estudios_imagenologia SET fecha_solicitud=? WHERE fecha_solicitud IS NULL OR TRIM(fecha_solicitud) = ''", LocalDateTime.now().toString());
    migrarRegistros("estudios_imagenologia");
    jdbc.execute("CREATE INDEX IF NOT EXISTS idx_estudios_imagenologia_paciente ON estudios_imagenologia(id_paciente_regional)");
    jdbc.execute("CREATE INDEX IF NOT EXISTS idx_estudios_imagenologia_cedula ON estudios_imagenologia(cedula)");
    jdbc.execute("CREATE INDEX IF NOT EXISTS idx_estudios_imagenologia_estado ON estudios_imagenologia(estado)");
    Auditoria.crearTabla(jdbc);
  }
  void agregarColumna(String tabla, String columna, String definicion) {
    try { jdbc.execute("ALTER TABLE " + tabla + " ADD COLUMN " + columna + " " + definicion); } catch (Exception ignored) {}
  }
  void migrarRegistros(String destino) {
    Integer existe = jdbc.queryForObject("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='registros'", Integer.class);
    if (existe != null && existe > 0) {
      try {
        jdbc.execute("INSERT OR IGNORE INTO " + destino + "(id_paciente_regional,cedula,fecha,sede,medico,especialidad,tipo_consulta,diagnostico,tratamiento,motivo,evolucion,tipo_examen,resultado,observaciones,tipo_estudio,formato,url,region_anatomica) SELECT id_paciente_regional,cedula,fecha,sede,medico,especialidad,tipo_consulta,diagnostico,tratamiento,motivo,evolucion,tipo_examen,resultado,observaciones,tipo_estudio,formato,url,region_anatomica FROM registros");
      } catch (Exception ignored) {}
    }
  }
  RegistroDto crear(RegistroRequest r) {
    String estado = normalizarEstado(r.estado(), r.url(), r.resultado());
    String fechaRealizacion = "REALIZADO".equals(estado) || "INFORMADO".equals(estado) ? LocalDateTime.now().toString() : null;
    jdbc.update("INSERT INTO estudios_imagenologia(id_paciente_regional,cedula,fecha,sede,medico,especialidad,tipo_consulta,diagnostico,tratamiento,motivo,evolucion,tipo_examen,resultado,observaciones,tipo_estudio,formato,url,region_anatomica,estado,prioridad,tecnico_responsable,hora,fecha_solicitud,fecha_realizacion,observaciones_imagenologo,hallazgos,recomendaciones,consulta_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", normalizarPaciente(r),r.cedula(),r.fecha().toString(),r.sede(),r.medico(),r.especialidad(),r.tipoConsulta(),r.diagnostico(),r.tratamiento(),r.motivo(),r.evolucion(),r.tipoExamen(),r.resultado(),r.observaciones(),r.tipoEstudio(),r.formato(),r.url(),r.regionAnatomica(),estado,normalizarPrioridad(r.prioridad()),r.tecnicoResponsable(),normalizarHora(r.hora()),LocalDateTime.now().toString(),fechaRealizacion,r.observacionesImagenologo(),r.hallazgos(),r.recomendaciones(),r.consultaId());
    Long id = jdbc.queryForObject("SELECT last_insert_rowid()", Long.class);
    return obtener(id).orElseThrow();
  }
  RegistroDto editar(Long id, RegistroRequest r) {
    String estado = normalizarEstado(r.estado(), r.url(), r.resultado());
    String fechaRealizacion = "REALIZADO".equals(estado) || "INFORMADO".equals(estado) ? LocalDateTime.now().toString() : null;
    int rows = jdbc.update("UPDATE estudios_imagenologia SET id_paciente_regional=?,cedula=?,fecha=?,sede=?,medico=?,especialidad=?,tipo_consulta=?,diagnostico=?,tratamiento=?,motivo=?,evolucion=?,tipo_examen=?,resultado=?,observaciones=?,tipo_estudio=?,formato=?,url=?,region_anatomica=?,estado=?,prioridad=?,tecnico_responsable=?,hora=?,fecha_realizacion=COALESCE(?,fecha_realizacion),observaciones_imagenologo=?,hallazgos=?,recomendaciones=?,consulta_id=? WHERE id=?", normalizarPaciente(r),r.cedula(),r.fecha().toString(),r.sede(),r.medico(),r.especialidad(),r.tipoConsulta(),r.diagnostico(),r.tratamiento(),r.motivo(),r.evolucion(),r.tipoExamen(),r.resultado(),r.observaciones(),r.tipoEstudio(),r.formato(),r.url(),r.regionAnatomica(),estado,normalizarPrioridad(r.prioridad()),r.tecnicoResponsable(),normalizarHora(r.hora()),fechaRealizacion,r.observacionesImagenologo(),r.hallazgos(),r.recomendaciones(),r.consultaId(),id);
    if (rows == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado.");
    return obtener(id).orElseThrow();
  }
  RegistroDto registrarResultado(Long id, RegistroRequest r) {
    int rows = jdbc.update("UPDATE estudios_imagenologia SET resultado=?, observaciones_imagenologo=?, hallazgos=?, recomendaciones=?, formato=?, url=?, estado=?, tecnico_responsable=?, hora=?, fecha_realizacion=? WHERE id=?", r.resultado(), r.observacionesImagenologo(), r.hallazgos(), r.recomendaciones(), r.formato(), r.url(), normalizarEstado(r.estado() == null ? "REALIZADO" : r.estado(), r.url(), r.resultado()), r.tecnicoResponsable(), normalizarHora(r.hora()), LocalDateTime.now().toString(), id);
    if (rows == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado.");
    return obtener(id).orElseThrow();
  }
  RegistroDto cambiarEstado(Long id, String estado) {
    String normalizado = validarEstado(estado);
    int rows = jdbc.update("UPDATE estudios_imagenologia SET estado=? WHERE id=?", normalizado, id);
    if (rows == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado.");
    return obtener(id).orElseThrow();
  }
  void eliminar(Long id) { if (jdbc.update("DELETE FROM estudios_imagenologia WHERE id=?", id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND); }
  List<RegistroDto> listar(String estado, String sede, String paciente) {
    String estadoLike = filtro(estado);
    String sedeLike = filtro(sede);
    String pacienteLike = filtro(paciente);
    return jdbc.query("SELECT * FROM estudios_imagenologia WHERE (?='' OR estado=?) AND (?='' OR sede=?) AND (?='' OR id_paciente_regional LIKE ? OR cedula LIKE ?) ORDER BY fecha_solicitud DESC, fecha DESC, id DESC", this::map, estadoLike, estadoLike, sedeLike, sedeLike, pacienteLike, pacienteLike, pacienteLike);
  }
  List<RegistroDto> porPaciente(String id) { return jdbc.query("SELECT * FROM estudios_imagenologia WHERE id_paciente_regional=? OR cedula=? ORDER BY fecha DESC, id DESC", this::map, id, id); }
  Optional<RegistroDto> obtener(Long id) { return jdbc.query("SELECT * FROM estudios_imagenologia WHERE id=?", this::map, id).stream().findFirst(); }
  String normalizarPaciente(RegistroRequest r) { return r.idPacienteRegional() == null || r.idPacienteRegional().isBlank() ? r.cedula() : r.idPacienteRegional(); }
  String filtro(String value) { return value == null ? "" : value.trim(); }
  String normalizarHora(String value) { return value == null || value.isBlank() ? LocalTime.now().toString().substring(0, 5) : value; }
  String normalizarPrioridad(String prioridad) { return prioridad == null || prioridad.isBlank() ? "NORMAL" : prioridad.trim().toUpperCase(Locale.ROOT); }
  String normalizarEstado(String estado, String url, String resultado) { return estado == null || estado.isBlank() ? ((url != null && !url.isBlank()) || (resultado != null && !resultado.isBlank()) ? "REALIZADO" : "SOLICITADO") : validarEstado(estado); }
  String validarEstado(String estado) {
    String value = estado == null ? "" : estado.trim().toUpperCase(Locale.ROOT);
    if (List.of("SOLICITADO", "REALIZADO", "INFORMADO").contains(value)) return value;
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de imagenología inválido.");
  }
  LocalDateTime parseDateTime(String value) { return value == null || value.isBlank() ? null : LocalDateTime.parse(value); }
  LocalTime parseTime(String value) { return value == null || value.isBlank() ? null : LocalTime.parse(value); }
  RegistroDto map(java.sql.ResultSet rs, int row) throws java.sql.SQLException { return new RegistroDto(rs.getLong("id"),rs.getString("id_paciente_regional"),rs.getString("cedula"),LocalDate.parse(rs.getString("fecha")),rs.getString("sede"),rs.getString("medico"),rs.getString("especialidad"),rs.getString("tipo_consulta"),rs.getString("diagnostico"),rs.getString("tratamiento"),rs.getString("motivo"),rs.getString("evolucion"),rs.getString("tipo_examen"),rs.getString("resultado"),rs.getString("observaciones"),rs.getString("tipo_estudio"),rs.getString("formato"),rs.getString("url"),rs.getString("region_anatomica"),rs.getString("estado"),rs.getString("prioridad"),rs.getString("tecnico_responsable"),parseTime(rs.getString("hora")),parseDateTime(rs.getString("fecha_solicitud")),parseDateTime(rs.getString("fecha_realizacion")),rs.getString("observaciones_imagenologo"),rs.getString("hallazgos"),rs.getString("recomendaciones"),rs.getObject("consulta_id") == null ? null : rs.getLong("consulta_id")); }
}

class Sedes {
  static final List<String> OFICIALES = List.of("SOLCA Cuenca", "SOLCA Quito", "SOLCA Guayaquil");
  static void validar(String sede) {
    if (sede == null || !OFICIALES.contains(sede.trim())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sede inválida. Use SOLCA Cuenca, SOLCA Quito o SOLCA Guayaquil.");
    }
  }
}
