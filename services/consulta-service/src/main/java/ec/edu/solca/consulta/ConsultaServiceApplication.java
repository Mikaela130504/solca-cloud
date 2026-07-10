package ec.edu.solca.consulta;

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
import java.util.*;

@SpringBootApplication(scanBasePackages = "ec.edu.solca")
public class ConsultaServiceApplication {
  public static void main(String[] args) { SpringApplication.run(ConsultaServiceApplication.class, args); }
  @Bean CommandLineRunner schema(RegistroRepository repo) { return args -> repo.schema(); }
}

record RegistroDto(Long id, String idPacienteRegional, String cedula, LocalDate fecha, String sede, String medico, String especialidad, String tipoConsulta, String diagnostico, String tratamiento, String motivo, String evolucion, String tipoExamen, String resultado, String observaciones, String tipoEstudio, String formato, String url, String regionAnatomica) {}
record RegistroRequest(@NotBlank String cedula, String idPacienteRegional, @NotNull LocalDate fecha, @NotBlank String sede, String medico, String especialidad, String tipoConsulta, String diagnostico, String tratamiento, String motivo, String evolucion, String tipoExamen, String resultado, String observaciones, String tipoEstudio, String formato, String url, String regionAnatomica) {}

@RestController
@RequestMapping("/consultas")
class RegistroController {
  private final RegistroService service;
  RegistroController(RegistroService service) { this.service = service; }
  @GetMapping @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") List<RegistroDto> listar() { return service.listar(); }
  @GetMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") RegistroDto obtener(@PathVariable("id") Long id) { return service.obtener(id); }
  @GetMapping("/paciente/{idPacienteRegional}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") List<RegistroDto> porPaciente(@PathVariable("idPacienteRegional") String idPacienteRegional) { return service.porPaciente(idPacienteRegional); }
  @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") RegistroDto crear(@Valid @RequestBody RegistroRequest request, HttpServletRequest http) { return service.crear(request, http); }
  @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") RegistroDto editar(@PathVariable("id") Long id, @Valid @RequestBody RegistroRequest request, HttpServletRequest http) { return service.editar(id, request, http); }
  @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") void eliminar(@PathVariable("id") Long id, HttpServletRequest http) { service.eliminar(id, http); }
}

@org.springframework.stereotype.Service
class RegistroService {
  private final RegistroRepository repo;
  RegistroService(RegistroRepository repo) { this.repo = repo; }
  List<RegistroDto> listar() { return repo.listar(); }
  RegistroDto obtener(Long id) { return repo.obtener(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado.")); }
  List<RegistroDto> porPaciente(String id) { return repo.porPaciente(id); }
  RegistroDto crear(RegistroRequest r, HttpServletRequest http) { if (r.fecha().isAfter(LocalDate.now())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha no puede ser futura."); RegistroDto dto = repo.crear(r); Auditoria.registrar(repo.jdbc(), "CREAR_CONSULTA", dto.idPacienteRegional(), http); return dto; }
  RegistroDto editar(Long id, RegistroRequest r, HttpServletRequest http) { if (r.fecha().isAfter(LocalDate.now())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha no puede ser futura."); RegistroDto dto = repo.editar(id, r); Auditoria.registrar(repo.jdbc(), "EDITAR_CONSULTA", dto.idPacienteRegional(), http); return dto; }
  void eliminar(Long id, HttpServletRequest http) { String paciente = obtener(id).idPacienteRegional(); repo.eliminar(id); Auditoria.registrar(repo.jdbc(), "ELIMINAR_CONSULTA", paciente, http); }
}

@org.springframework.stereotype.Repository
class RegistroRepository {
  private final JdbcTemplate jdbc;
  RegistroRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
  JdbcTemplate jdbc() { return jdbc; }
  void schema() {
    jdbc.execute("CREATE TABLE IF NOT EXISTS consultas (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, cedula TEXT NOT NULL, fecha TEXT NOT NULL, sede TEXT NOT NULL, medico TEXT, especialidad TEXT, tipo_consulta TEXT, diagnostico TEXT, tratamiento TEXT, motivo TEXT, evolucion TEXT, tipo_examen TEXT, resultado TEXT, observaciones TEXT, tipo_estudio TEXT, formato TEXT, url TEXT, region_anatomica TEXT)");
    migrarRegistros("consultas");
    jdbc.execute("CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas(id_paciente_regional)");
    jdbc.execute("CREATE INDEX IF NOT EXISTS idx_consultas_cedula ON consultas(cedula)");
    Auditoria.crearTabla(jdbc);
  }
  void migrarRegistros(String destino) {
    Integer existe = jdbc.queryForObject("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='registros'", Integer.class);
    if (existe != null && existe > 0) jdbc.execute("INSERT OR IGNORE INTO " + destino + " SELECT * FROM registros");
  }
  RegistroDto crear(RegistroRequest r) {
    jdbc.update("INSERT INTO consultas(id_paciente_regional,cedula,fecha,sede,medico,especialidad,tipo_consulta,diagnostico,tratamiento,motivo,evolucion,tipo_examen,resultado,observaciones,tipo_estudio,formato,url,region_anatomica) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", normalizarPaciente(r),r.cedula(),r.fecha().toString(),r.sede(),r.medico(),r.especialidad(),r.tipoConsulta(),r.diagnostico(),r.tratamiento(),r.motivo(),r.evolucion(),r.tipoExamen(),r.resultado(),r.observaciones(),r.tipoEstudio(),r.formato(),r.url(),r.regionAnatomica());
    Long id = jdbc.queryForObject("SELECT last_insert_rowid()", Long.class);
    return obtener(id).orElseThrow();
  }
  RegistroDto editar(Long id, RegistroRequest r) {
    int rows = jdbc.update("UPDATE consultas SET id_paciente_regional=?,cedula=?,fecha=?,sede=?,medico=?,especialidad=?,tipo_consulta=?,diagnostico=?,tratamiento=?,motivo=?,evolucion=?,tipo_examen=?,resultado=?,observaciones=?,tipo_estudio=?,formato=?,url=?,region_anatomica=? WHERE id=?", normalizarPaciente(r),r.cedula(),r.fecha().toString(),r.sede(),r.medico(),r.especialidad(),r.tipoConsulta(),r.diagnostico(),r.tratamiento(),r.motivo(),r.evolucion(),r.tipoExamen(),r.resultado(),r.observaciones(),r.tipoEstudio(),r.formato(),r.url(),r.regionAnatomica(),id);
    if (rows == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado.");
    return obtener(id).orElseThrow();
  }
  void eliminar(Long id) { if (jdbc.update("DELETE FROM consultas WHERE id=?", id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND); }
  List<RegistroDto> listar() { return jdbc.query("SELECT * FROM consultas ORDER BY fecha DESC, id DESC", this::map); }
  List<RegistroDto> porPaciente(String id) { return jdbc.query("SELECT * FROM consultas WHERE id_paciente_regional=? OR cedula=? ORDER BY fecha DESC, id DESC", this::map, id, id); }
  Optional<RegistroDto> obtener(Long id) { return jdbc.query("SELECT * FROM consultas WHERE id=?", this::map, id).stream().findFirst(); }
  String normalizarPaciente(RegistroRequest r) { return r.idPacienteRegional() == null || r.idPacienteRegional().isBlank() ? r.cedula() : r.idPacienteRegional(); }
  RegistroDto map(java.sql.ResultSet rs, int row) throws java.sql.SQLException { return new RegistroDto(rs.getLong("id"),rs.getString("id_paciente_regional"),rs.getString("cedula"),LocalDate.parse(rs.getString("fecha")),rs.getString("sede"),rs.getString("medico"),rs.getString("especialidad"),rs.getString("tipo_consulta"),rs.getString("diagnostico"),rs.getString("tratamiento"),rs.getString("motivo"),rs.getString("evolucion"),rs.getString("tipo_examen"),rs.getString("resultado"),rs.getString("observaciones"),rs.getString("tipo_estudio"),rs.getString("formato"),rs.getString("url"),rs.getString("region_anatomica")); }
}
