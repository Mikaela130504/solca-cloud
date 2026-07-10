package ec.edu.solca.paciente;

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
public class PacienteServiceApplication {
  public static void main(String[] args) { SpringApplication.run(PacienteServiceApplication.class, args); }
  @Bean CommandLineRunner schema(JdbcTemplate jdbc) { return args -> { PacienteRepository repo = new PacienteRepository(jdbc); repo.schema(); repo.normalizarSedesSinDato(); repo.sincronizarHistoriasLocales(); }; }
}

record PacienteDto(Long id, String idPacienteRegional, String cedula, String nombres, String apellidos, LocalDate fechaNacimiento, Integer edad, String sexo, String estadoCivil, String direccion, String provincia, String ciudad, String telefono, String correo, String contactoEmergencia, String seguro, String tipoSangre, String nacionalidad, String observaciones, String sede, List<HistoriaLocalDto> historiasLocales) {}
record PacienteRequest(@NotBlank @Pattern(regexp="\\d{10}") String cedula, @NotBlank @Pattern(regexp="[A-Za-zÁÉÍÓÚáéíóúÑñÜü\\s]+") @Size(max=80) String nombres, @NotBlank @Pattern(regexp="[A-Za-zÁÉÍÓÚáéíóúÑñÜü\\s]+") @Size(max=80) String apellidos, @NotNull LocalDate fechaNacimiento, @NotBlank String sexo, @NotBlank String estadoCivil, @NotBlank String direccion, @NotBlank String provincia, @NotBlank String ciudad, @NotBlank @Pattern(regexp="\\d{10}") String telefono, @NotBlank @Email String correo, @NotBlank @Pattern(regexp="\\d{10}") String contactoEmergencia, @NotBlank String seguro, @NotBlank String tipoSangre, @NotBlank @Pattern(regexp="[A-Za-zÁÉÍÓÚáéíóúÑñÜü\\s]+") String nacionalidad, String observaciones, @NotBlank String sede) {}
record HistoriaLocalRequest(@NotBlank String sede, @NotBlank String identificadorHistoriaLocal) {}
record HistoriaLocalDto(String sede, String identificadorHistoriaLocal) {}

@RestController
@RequestMapping("/pacientes")
class PacienteController {
  private final PacienteService service;
  PacienteController(PacienteService service) { this.service = service; }
  @GetMapping @PreAuthorize("hasAnyRole('ADMIN','MEDICO','LABORATORIO')") List<PacienteDto> listar(@RequestParam(defaultValue="") String q) { return service.listar(q); }
  @PostMapping @ResponseStatus(HttpStatus.CREATED) @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") PacienteDto crear(@Valid @RequestBody PacienteRequest request, HttpServletRequest http) { return service.crear(request, http); }
  @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") PacienteDto editar(@PathVariable("id") String id, @Valid @RequestBody PacienteRequest request, HttpServletRequest http) { return service.editar(id, request, http); }
  @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasRole('ADMIN')") void eliminar(@PathVariable("id") String id, HttpServletRequest http) { service.eliminar(id, http); }
  @GetMapping("/cedula/{cedula}") PacienteDto porCedula(@PathVariable("cedula") String cedula) { return service.porCedula(cedula); }
  @GetMapping("/{id}") PacienteDto porId(@PathVariable("id") String id) { return service.porId(id); }
  @PostMapping("/{id}/historias-locales") @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") void asociar(@PathVariable("id") String id, @Valid @RequestBody HistoriaLocalRequest request, HttpServletRequest http) { service.asociar(id, request, http); }
}

@org.springframework.stereotype.Service
class PacienteService {
  private final PacienteRepository repo;
  PacienteService(PacienteRepository repo) { this.repo = repo; }
  List<PacienteDto> listar(String q) { return repo.listar(q); }
  PacienteDto crear(PacienteRequest r, HttpServletRequest http) {
    if (!Cedula.valida(r.cedula())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cédula ecuatoriana inválida.");
    if (r.fechaNacimiento().isAfter(LocalDate.now())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de nacimiento no puede ser futura.");
    if (repo.existeCedula(r.cedula())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un paciente con esa cédula.");
    String regional = repo.siguienteIdRegional();
    PacienteDto dto = repo.crear(regional, r);
    Auditoria.registrar(repo.jdbc(), "CREAR_PACIENTE", regional, http);
    return dto;
  }
  PacienteDto editar(String id, PacienteRequest r, HttpServletRequest http) {
    if (!Cedula.valida(r.cedula())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cédula ecuatoriana inválida.");
    if (r.fechaNacimiento().isAfter(LocalDate.now())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de nacimiento no puede ser futura.");
    PacienteDto dto = repo.editar(id, r); Auditoria.registrar(repo.jdbc(), "EDITAR_PACIENTE", id, http); return dto;
  }
  void eliminar(String id, HttpServletRequest http) { repo.eliminar(id); Auditoria.registrar(repo.jdbc(), "ELIMINAR_PACIENTE", id, http); }
  PacienteDto porCedula(String cedula) { return repo.porCedula(cedula).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado.")); }
  PacienteDto porId(String id) { return repo.porId(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado.")); }
  void asociar(String id, HistoriaLocalRequest r, HttpServletRequest http) { repo.asociar(id, r); Auditoria.registrar(repo.jdbc(), "ASOCIAR_HISTORIA_LOCAL", id, http); }
}

@org.springframework.stereotype.Repository
class PacienteRepository {
  private final JdbcTemplate jdbc;
  PacienteRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
  JdbcTemplate jdbc() { return jdbc; }
  void schema() {
    jdbc.execute("CREATE TABLE IF NOT EXISTS pacientes (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT NOT NULL UNIQUE, cedula TEXT NOT NULL UNIQUE, nombres TEXT NOT NULL, apellidos TEXT NOT NULL, fecha_nacimiento TEXT NOT NULL, edad INTEGER, sexo TEXT NOT NULL, estado_civil TEXT NOT NULL, direccion TEXT NOT NULL, provincia TEXT NOT NULL, ciudad TEXT NOT NULL, telefono TEXT NOT NULL, correo TEXT NOT NULL, contacto_emergencia TEXT NOT NULL, seguro TEXT NOT NULL, tipo_sangre TEXT NOT NULL, nacionalidad TEXT NOT NULL, observaciones TEXT, sede TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS historias_clinicas_locales (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT NOT NULL, sede TEXT NOT NULL, identificador_historia_local TEXT NOT NULL, UNIQUE(sede, identificador_historia_local), FOREIGN KEY(id_paciente_regional) REFERENCES pacientes(id_paciente_regional))");
    jdbc.execute("CREATE INDEX IF NOT EXISTS idx_pacientes_cedula ON pacientes(cedula)");
    Auditoria.crearTabla(jdbc);
  }
  String siguienteIdRegional() {
    int next = jdbc.queryForList("SELECT id_paciente_regional FROM pacientes", String.class).stream()
      .map(PacienteRepository::numeroDesdeIdentificador)
      .max(Integer::compareTo)
      .orElse(0) + 1;
    return "PAC" + String.format("%09d", next);
  }
  String siguienteHistoriaLocal(String sede) {
    int next = jdbc.queryForList("SELECT identificador_historia_local FROM historias_clinicas_locales WHERE sede=?", String.class, sede).stream()
      .map(PacienteRepository::numeroDesdeIdentificador)
      .max(Integer::compareTo)
      .orElse(0) + 1;
    return String.format("%07d", next);
  }
  static int numeroDesdeIdentificador(String value) {
    if (value == null) return 0;
    String digits = value.replaceAll("\\D", "");
    if (digits.isBlank()) return 0;
    try { return Integer.parseInt(digits); } catch (NumberFormatException ex) { return 0; }
  }
  boolean existeCedula(String cedula) { return jdbc.queryForObject("SELECT COUNT(*) FROM pacientes WHERE cedula=?", Integer.class, cedula) > 0; }
  PacienteDto crear(String id, PacienteRequest r) {
    jdbc.update("INSERT INTO pacientes(id_paciente_regional,cedula,nombres,apellidos,fecha_nacimiento,edad,sexo,estado_civil,direccion,provincia,ciudad,telefono,correo,contacto_emergencia,seguro,tipo_sangre,nacionalidad,observaciones,sede) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", id,r.cedula(),r.nombres(),r.apellidos(),r.fechaNacimiento().toString(),edad(r.fechaNacimiento()),r.sexo(),r.estadoCivil(),r.direccion(),r.provincia(),r.ciudad(),r.telefono(),r.correo(),r.contactoEmergencia(),r.seguro(),r.tipoSangre(),r.nacionalidad(),r.observaciones(),r.sede());
    asociarSiNoExiste(id, r.sede());
    return porId(id).orElseThrow();
  }
  PacienteDto editar(String id, PacienteRequest r) { jdbc.update("UPDATE pacientes SET cedula=?,nombres=?,apellidos=?,fecha_nacimiento=?,edad=?,sexo=?,estado_civil=?,direccion=?,provincia=?,ciudad=?,telefono=?,correo=?,contacto_emergencia=?,seguro=?,tipo_sangre=?,nacionalidad=?,observaciones=?,sede=? WHERE id_paciente_regional=?", r.cedula(),r.nombres(),r.apellidos(),r.fechaNacimiento().toString(),edad(r.fechaNacimiento()),r.sexo(),r.estadoCivil(),r.direccion(),r.provincia(),r.ciudad(),r.telefono(),r.correo(),r.contactoEmergencia(),r.seguro(),r.tipoSangre(),r.nacionalidad(),r.observaciones(),r.sede(),id); return porId(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)); }
  void eliminar(String id) { if (jdbc.update("DELETE FROM pacientes WHERE id_paciente_regional=?", id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND); }
  void asociar(String id, HistoriaLocalRequest r) { porId(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)); jdbc.update("INSERT INTO historias_clinicas_locales(id_paciente_regional,sede,identificador_historia_local) VALUES (?,?,?)", id, r.sede(), r.identificadorHistoriaLocal()); }
  void asociarSiNoExiste(String id, String sede) {
    if (sede == null || sede.isBlank()) return;
    Integer existe = jdbc.queryForObject("SELECT COUNT(*) FROM historias_clinicas_locales WHERE id_paciente_regional=? AND sede=?", Integer.class, id, sede);
    if (existe != null && existe > 0) return;
    jdbc.update("INSERT INTO historias_clinicas_locales(id_paciente_regional,sede,identificador_historia_local) VALUES (?,?,?)", id, sede, siguienteHistoriaLocal(sede));
  }
  void sincronizarHistoriasLocales() {
    List<Map<String,Object>> pacientes = jdbc.queryForList("SELECT id_paciente_regional, sede FROM pacientes WHERE sede IS NOT NULL AND TRIM(sede) <> ''");
    for (Map<String,Object> paciente : pacientes) {
      asociarSiNoExiste(String.valueOf(paciente.get("id_paciente_regional")), String.valueOf(paciente.get("sede")));
    }
  }
  void normalizarSedesSinDato() {
    jdbc.update("UPDATE pacientes SET sede='SOLCA Quito' WHERE sede IS NULL OR TRIM(sede) = ''");
  }
  List<PacienteDto> listar(String q) { String like = "%" + q + "%"; return jdbc.query("SELECT * FROM pacientes WHERE nombres LIKE ? OR apellidos LIKE ? OR cedula LIKE ? OR id_paciente_regional LIKE ? ORDER BY apellidos,nombres", this::map, like, like, like, like); }
  Optional<PacienteDto> porCedula(String cedula) { return jdbc.query("SELECT * FROM pacientes WHERE cedula=?", this::map, cedula).stream().findFirst(); }
  Optional<PacienteDto> porId(String id) { return jdbc.query("SELECT * FROM pacientes WHERE id_paciente_regional=?", this::map, id).stream().findFirst(); }
  List<HistoriaLocalDto> historias(String id) { return jdbc.query("SELECT sede, identificador_historia_local FROM historias_clinicas_locales WHERE id_paciente_regional=? ORDER BY sede", (rs, row) -> new HistoriaLocalDto(rs.getString("sede"), rs.getString("identificador_historia_local")), id); }
  PacienteDto map(java.sql.ResultSet rs, int row) throws java.sql.SQLException { String idRegional = rs.getString("id_paciente_regional"); return new PacienteDto(rs.getLong("id"),idRegional,rs.getString("cedula"),rs.getString("nombres"),rs.getString("apellidos"),LocalDate.parse(rs.getString("fecha_nacimiento")),rs.getInt("edad"),rs.getString("sexo"),rs.getString("estado_civil"),rs.getString("direccion"),rs.getString("provincia"),rs.getString("ciudad"),rs.getString("telefono"),rs.getString("correo"),rs.getString("contacto_emergencia"),rs.getString("seguro"),rs.getString("tipo_sangre"),rs.getString("nacionalidad"),rs.getString("observaciones"),rs.getString("sede"),historias(idRegional)); }
  int edad(LocalDate n) { return java.time.Period.between(n, LocalDate.now()).getYears(); }
}

class Cedula {
  static boolean valida(String cedula) {
    if (cedula == null || !cedula.matches("\\d{10}")) return false;
    int provincia = Integer.parseInt(cedula.substring(0,2)); int tercer = Character.getNumericValue(cedula.charAt(2));
    if (provincia < 1 || provincia > 24 || tercer > 5) return false;
    int suma = 0;
    for (int i=0;i<9;i++) { int d = Character.getNumericValue(cedula.charAt(i)); if (i % 2 == 0) { d *= 2; if (d > 9) d -= 9; } suma += d; }
    int verificador = suma % 10 == 0 ? 0 : 10 - (suma % 10);
    return verificador == Character.getNumericValue(cedula.charAt(9));
  }
}
