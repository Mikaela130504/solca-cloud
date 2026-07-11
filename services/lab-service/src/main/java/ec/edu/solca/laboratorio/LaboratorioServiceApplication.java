package ec.edu.solca.laboratorio;

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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@SpringBootApplication(scanBasePackages = "ec.edu.solca")
public class LaboratorioServiceApplication {
  public static void main(String[] args) { SpringApplication.run(LaboratorioServiceApplication.class, args); }
  @Bean CommandLineRunner schema(RegistroRepository repo) { return args -> repo.schema(); }
}

record RegistroDto(Long id, String idPacienteRegional, String cedula, LocalDate fecha, String sede, String medico, String especialidad, String tipoConsulta, String diagnostico, String tratamiento, String motivo, String evolucion, String tipoExamen, String resultado, String observaciones, String tipoEstudio, String formato, String url, String regionAnatomica, String estado, String prioridad, String tecnologoResponsable, LocalDateTime fechaSolicitud, LocalDateTime fechaResultado, String valores, String unidad, String valorReferencia, String interpretacion) {}
record RegistroRequest(@NotBlank String cedula, String idPacienteRegional, @NotNull LocalDate fecha, @NotBlank String sede, String medico, String especialidad, String tipoConsulta, String diagnostico, String tratamiento, String motivo, String evolucion, String tipoExamen, String resultado, String observaciones, String tipoEstudio, String formato, String url, String regionAnatomica, String estado, String prioridad, String tecnologoResponsable, String valores, String unidad, String valorReferencia, String interpretacion) {}

@RestController
@RequestMapping("/laboratorios")
class RegistroController {
  private final RegistroService service;
  RegistroController(RegistroService service) { this.service = service; }
  @GetMapping @PreAuthorize("hasAnyRole('ADMIN','MEDICO','LABORATORIO','REPOSITORIO')") List<RegistroDto> listar(@RequestParam(defaultValue="") String estado, @RequestParam(defaultValue="") String sede, @RequestParam(defaultValue="") String paciente) { return service.listar(estado, sede, paciente); }
  @GetMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO','LABORATORIO','REPOSITORIO')") RegistroDto obtener(@PathVariable("id") Long id) { return service.obtener(id); }
  @GetMapping("/paciente/{idPacienteRegional}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO','LABORATORIO','REPOSITORIO')") List<RegistroDto> porPaciente(@PathVariable("idPacienteRegional") String idPacienteRegional) { return service.porPaciente(idPacienteRegional); }
  @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") RegistroDto crear(@Valid @RequestBody RegistroRequest request, HttpServletRequest http) { return service.crear(request, http); }
  @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','LABORATORIO')") RegistroDto editar(@PathVariable("id") Long id, @Valid @RequestBody RegistroRequest request, HttpServletRequest http) { return service.editar(id, request, http); }
  @PutMapping("/{id}/resultado") @PreAuthorize("hasAnyRole('ADMIN','LABORATORIO')") RegistroDto registrarResultado(@PathVariable("id") Long id, @Valid @RequestBody RegistroRequest request, HttpServletRequest http) { return service.registrarResultado(id, request, http); }
  @PutMapping("/{id}/estado/{estado}") @PreAuthorize("hasAnyRole('ADMIN','LABORATORIO')") RegistroDto cambiarEstado(@PathVariable("id") Long id, @PathVariable("estado") String estado, HttpServletRequest http) { return service.cambiarEstado(id, estado, http); }
  @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasAnyRole('ADMIN','LABORATORIO')") void eliminar(@PathVariable("id") Long id, HttpServletRequest http) { service.eliminar(id, http); }
}

@org.springframework.stereotype.Service
class RegistroService {
  private final RegistroRepository repo;
  RegistroService(RegistroRepository repo) { this.repo = repo; }
  List<RegistroDto> listar(String estado, String sede, String paciente) { return repo.listar(estado, sede, paciente); }
  RegistroDto obtener(Long id) { return repo.obtener(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado.")); }
  List<RegistroDto> porPaciente(String id) { return repo.porPaciente(id); }
  RegistroDto crear(RegistroRequest r, HttpServletRequest http) { if (r.fecha().isAfter(LocalDate.now())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha no puede ser futura."); RegistroDto dto = repo.crear(r); Auditoria.registrar(repo.jdbc(), "SOLICITAR_LABORATORIO", dto.idPacienteRegional(), http); return dto; }
  RegistroDto editar(Long id, RegistroRequest r, HttpServletRequest http) { if (r.fecha().isAfter(LocalDate.now())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha no puede ser futura."); RegistroDto dto = repo.editar(id, r); Auditoria.registrar(repo.jdbc(), "EDITAR_LABORATORIO", dto.idPacienteRegional(), http); return dto; }
  RegistroDto registrarResultado(Long id, RegistroRequest r, HttpServletRequest http) { RegistroDto dto = repo.registrarResultado(id, r); Auditoria.registrar(repo.jdbc(), "VALIDAR_RESULTADO_LABORATORIO", dto.idPacienteRegional(), http); return dto; }
  RegistroDto cambiarEstado(Long id, String estado, HttpServletRequest http) { RegistroDto dto = repo.cambiarEstado(id, estado); Auditoria.registrar(repo.jdbc(), "CAMBIAR_ESTADO_LABORATORIO_" + estado.toUpperCase(Locale.ROOT), dto.idPacienteRegional(), http); return dto; }
  void eliminar(Long id, HttpServletRequest http) { String paciente = obtener(id).idPacienteRegional(); repo.eliminar(id); Auditoria.registrar(repo.jdbc(), "ELIMINAR_LABORATORIO", paciente, http); }
}

@org.springframework.stereotype.Repository
class RegistroRepository {
  private final JdbcTemplate jdbc;
  RegistroRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
  JdbcTemplate jdbc() { return jdbc; }
  void schema() {
    jdbc.execute("CREATE TABLE IF NOT EXISTS resultados_laboratorio (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, cedula TEXT NOT NULL, fecha TEXT NOT NULL, sede TEXT NOT NULL, medico TEXT, especialidad TEXT, tipo_consulta TEXT, diagnostico TEXT, tratamiento TEXT, motivo TEXT, evolucion TEXT, tipo_examen TEXT, resultado TEXT, observaciones TEXT, tipo_estudio TEXT, formato TEXT, url TEXT, region_anatomica TEXT)");
    agregarColumna("resultados_laboratorio", "estado", "TEXT DEFAULT 'PENDIENTE'");
    agregarColumna("resultados_laboratorio", "prioridad", "TEXT DEFAULT 'NORMAL'");
    agregarColumna("resultados_laboratorio", "tecnologo_responsable", "TEXT");
    agregarColumna("resultados_laboratorio", "fecha_solicitud", "TEXT");
    agregarColumna("resultados_laboratorio", "fecha_resultado", "TEXT");
    agregarColumna("resultados_laboratorio", "valores", "TEXT");
    agregarColumna("resultados_laboratorio", "unidad", "TEXT");
    agregarColumna("resultados_laboratorio", "valor_referencia", "TEXT");
    agregarColumna("resultados_laboratorio", "interpretacion", "TEXT");
    jdbc.update("UPDATE resultados_laboratorio SET estado='FINALIZADO' WHERE estado IS NULL AND resultado IS NOT NULL AND TRIM(resultado) <> ''");
    jdbc.update("UPDATE resultados_laboratorio SET estado='PENDIENTE' WHERE estado IS NULL OR TRIM(estado) = ''");
    jdbc.update("UPDATE resultados_laboratorio SET fecha_solicitud=? WHERE fecha_solicitud IS NULL OR TRIM(fecha_solicitud) = ''", LocalDateTime.now().toString());
    migrarRegistros("resultados_laboratorio");
    jdbc.execute("CREATE INDEX IF NOT EXISTS idx_resultados_laboratorio_paciente ON resultados_laboratorio(id_paciente_regional)");
    jdbc.execute("CREATE INDEX IF NOT EXISTS idx_resultados_laboratorio_cedula ON resultados_laboratorio(cedula)");
    jdbc.execute("CREATE INDEX IF NOT EXISTS idx_resultados_laboratorio_estado ON resultados_laboratorio(estado)");
    Auditoria.crearTabla(jdbc);
  }
  void agregarColumna(String tabla, String columna, String definicion) {
    try { jdbc.execute("ALTER TABLE " + tabla + " ADD COLUMN " + columna + " " + definicion); } catch (Exception ignored) {}
  }
  void migrarRegistros(String destino) {
    Integer existe = jdbc.queryForObject("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='registros'", Integer.class);
    if (existe != null && existe > 0) jdbc.execute("INSERT OR IGNORE INTO " + destino + " SELECT * FROM registros");
  }
  RegistroDto crear(RegistroRequest r) {
    String estado = normalizarEstado(r.estado(), r.resultado());
    String fechaResultado = "FINALIZADO".equals(estado) ? LocalDateTime.now().toString() : null;
    jdbc.update("INSERT INTO resultados_laboratorio(id_paciente_regional,cedula,fecha,sede,medico,especialidad,tipo_consulta,diagnostico,tratamiento,motivo,evolucion,tipo_examen,resultado,observaciones,tipo_estudio,formato,url,region_anatomica,estado,prioridad,tecnologo_responsable,fecha_solicitud,fecha_resultado,valores,unidad,valor_referencia,interpretacion) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", normalizarPaciente(r),r.cedula(),r.fecha().toString(),r.sede(),r.medico(),r.especialidad(),r.tipoConsulta(),r.diagnostico(),r.tratamiento(),r.motivo(),r.evolucion(),r.tipoExamen(),r.resultado(),r.observaciones(),r.tipoEstudio(),r.formato(),r.url(),r.regionAnatomica(),estado,normalizarPrioridad(r.prioridad()),r.tecnologoResponsable(),LocalDateTime.now().toString(),fechaResultado,r.valores(),r.unidad(),r.valorReferencia(),r.interpretacion());
    Long id = jdbc.queryForObject("SELECT last_insert_rowid()", Long.class);
    return obtener(id).orElseThrow();
  }
  RegistroDto editar(Long id, RegistroRequest r) {
    String estado = normalizarEstado(r.estado(), r.resultado());
    String fechaResultado = "FINALIZADO".equals(estado) ? LocalDateTime.now().toString() : null;
    int rows = jdbc.update("UPDATE resultados_laboratorio SET id_paciente_regional=?,cedula=?,fecha=?,sede=?,medico=?,especialidad=?,tipo_consulta=?,diagnostico=?,tratamiento=?,motivo=?,evolucion=?,tipo_examen=?,resultado=?,observaciones=?,tipo_estudio=?,formato=?,url=?,region_anatomica=?,estado=?,prioridad=?,tecnologo_responsable=?,fecha_resultado=COALESCE(?,fecha_resultado),valores=?,unidad=?,valor_referencia=?,interpretacion=? WHERE id=?", normalizarPaciente(r),r.cedula(),r.fecha().toString(),r.sede(),r.medico(),r.especialidad(),r.tipoConsulta(),r.diagnostico(),r.tratamiento(),r.motivo(),r.evolucion(),r.tipoExamen(),r.resultado(),r.observaciones(),r.tipoEstudio(),r.formato(),r.url(),r.regionAnatomica(),estado,normalizarPrioridad(r.prioridad()),r.tecnologoResponsable(),fechaResultado,r.valores(),r.unidad(),r.valorReferencia(),r.interpretacion(),id);
    if (rows == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado.");
    return obtener(id).orElseThrow();
  }
  RegistroDto registrarResultado(Long id, RegistroRequest r) {
    int rows = jdbc.update("UPDATE resultados_laboratorio SET resultado=?, observaciones=?, estado='FINALIZADO', tecnologo_responsable=?, fecha_resultado=?, valores=?, unidad=?, valor_referencia=?, interpretacion=? WHERE id=?", r.resultado(), r.observaciones(), r.tecnologoResponsable(), LocalDateTime.now().toString(), r.valores(), r.unidad(), r.valorReferencia(), r.interpretacion(), id);
    if (rows == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado.");
    return obtener(id).orElseThrow();
  }
  RegistroDto cambiarEstado(Long id, String estado) {
    String normalizado = validarEstado(estado);
    int rows = jdbc.update("UPDATE resultados_laboratorio SET estado=? WHERE id=?", normalizado, id);
    if (rows == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado.");
    return obtener(id).orElseThrow();
  }
  void eliminar(Long id) { if (jdbc.update("DELETE FROM resultados_laboratorio WHERE id=?", id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND); }
  List<RegistroDto> listar(String estado, String sede, String paciente) {
    String estadoLike = filtro(estado);
    String sedeLike = filtro(sede);
    String pacienteLike = filtro(paciente);
    return jdbc.query("SELECT * FROM resultados_laboratorio WHERE (?='' OR estado=?) AND (?='' OR sede=?) AND (?='' OR id_paciente_regional LIKE ? OR cedula LIKE ?) ORDER BY fecha_solicitud DESC, fecha DESC, id DESC", this::map, estadoLike, estadoLike, sedeLike, sedeLike, pacienteLike, pacienteLike, pacienteLike);
  }
  List<RegistroDto> porPaciente(String id) { return jdbc.query("SELECT * FROM resultados_laboratorio WHERE id_paciente_regional=? OR cedula=? ORDER BY fecha DESC, id DESC", this::map, id, id); }
  Optional<RegistroDto> obtener(Long id) { return jdbc.query("SELECT * FROM resultados_laboratorio WHERE id=?", this::map, id).stream().findFirst(); }
  String normalizarPaciente(RegistroRequest r) { return r.idPacienteRegional() == null || r.idPacienteRegional().isBlank() ? r.cedula() : r.idPacienteRegional(); }
  String filtro(String value) { return value == null ? "" : value.trim(); }
  String normalizarPrioridad(String prioridad) { return prioridad == null || prioridad.isBlank() ? "NORMAL" : prioridad.trim().toUpperCase(Locale.ROOT); }
  String normalizarEstado(String estado, String resultado) { return estado == null || estado.isBlank() ? (resultado == null || resultado.isBlank() ? "PENDIENTE" : "FINALIZADO") : validarEstado(estado); }
  String validarEstado(String estado) {
    String value = estado == null ? "" : estado.trim().toUpperCase(Locale.ROOT);
    if (List.of("PENDIENTE", "EN_PROCESO", "FINALIZADO").contains(value)) return value;
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de laboratorio inválido.");
  }
  LocalDateTime parseDateTime(String value) { return value == null || value.isBlank() ? null : LocalDateTime.parse(value); }
  RegistroDto map(java.sql.ResultSet rs, int row) throws java.sql.SQLException { return new RegistroDto(rs.getLong("id"),rs.getString("id_paciente_regional"),rs.getString("cedula"),LocalDate.parse(rs.getString("fecha")),rs.getString("sede"),rs.getString("medico"),rs.getString("especialidad"),rs.getString("tipo_consulta"),rs.getString("diagnostico"),rs.getString("tratamiento"),rs.getString("motivo"),rs.getString("evolucion"),rs.getString("tipo_examen"),rs.getString("resultado"),rs.getString("observaciones"),rs.getString("tipo_estudio"),rs.getString("formato"),rs.getString("url"),rs.getString("region_anatomica"),rs.getString("estado"),rs.getString("prioridad"),rs.getString("tecnologo_responsable"),parseDateTime(rs.getString("fecha_solicitud")),parseDateTime(rs.getString("fecha_resultado")),rs.getString("valores"),rs.getString("unidad"),rs.getString("valor_referencia"),rs.getString("interpretacion")); }
}
