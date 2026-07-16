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

record RegistroDto(Long id, String idPacienteRegional, String cedula, LocalDate fecha, String hora, String sede, String medico, String especialidad, String tipoConsulta, String diagnostico, String diagnosticoPrincipalCodigo, String diagnosticoPrincipalNombre, String diagnosticoSecundarioCodigo, String diagnosticoSecundarioNombre, String tratamiento, String motivo, String evolucion, String resultado, String observaciones, String antecedentesFamiliares, String antecedentesPersonales, String cirugias, String ginecoObstetricos, String medicamentosActuales, String alergias, String examenFisico, String signosVitales, String medicacion, String proximoControl, String ginecoEmbarazos, String ginecoPartos, String ginecoCesareas, String ginecoAbortos, String ginecoObservaciones, String examenGeneral, String examenCabezaCuello, String examenTorax, String examenAbdomen, String examenExtremidades, String examenNeurologico, String peso, String talla, String imc, String temperatura, String presionArterial, String frecuenciaCardiaca, String frecuenciaRespiratoria, String saturacionOxigeno) {}
record RegistroRequest(@NotBlank String cedula, String idPacienteRegional, @NotNull LocalDate fecha, String hora, @NotBlank String sede, String medico, String especialidad, String tipoConsulta, String diagnostico, String diagnosticoPrincipalCodigo, String diagnosticoPrincipalNombre, String diagnosticoSecundarioCodigo, String diagnosticoSecundarioNombre, String tratamiento, String motivo, String evolucion, String resultado, String observaciones, String antecedentesFamiliares, String antecedentesPersonales, String cirugias, String ginecoObstetricos, String medicamentosActuales, String alergias, String examenFisico, String signosVitales, String medicacion, String proximoControl, String ginecoEmbarazos, String ginecoPartos, String ginecoCesareas, String ginecoAbortos, String ginecoObservaciones, String examenGeneral, String examenCabezaCuello, String examenTorax, String examenAbdomen, String examenExtremidades, String examenNeurologico, String peso, String talla, String imc, String temperatura, String presionArterial, String frecuenciaCardiaca, String frecuenciaRespiratoria, String saturacionOxigeno) {}

@RestController
@RequestMapping("/consultas")
class RegistroController {
  private final RegistroService service;
  RegistroController(RegistroService service) { this.service = service; }
  @GetMapping @PreAuthorize("hasAnyRole('ADMIN','MEDICO','LABORATORIO','IMAGENOLOGIA')") List<RegistroDto> listar() { return service.listar(); }
  @GetMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO','LABORATORIO','IMAGENOLOGIA')") RegistroDto obtener(@PathVariable("id") Long id) { return service.obtener(id); }
  @GetMapping("/paciente/{idPacienteRegional}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO','LABORATORIO','IMAGENOLOGIA')") List<RegistroDto> porPaciente(@PathVariable("idPacienteRegional") String idPacienteRegional) { return service.porPaciente(idPacienteRegional); }
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
  RegistroDto crear(RegistroRequest r, HttpServletRequest http) { if (r.fecha().isAfter(LocalDate.now())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha no puede ser futura."); Sedes.validar(r.sede()); RegistroDto dto = repo.crear(r); Auditoria.registrar(repo.jdbc(), "CREAR_CONSULTA", dto.idPacienteRegional(), http); return dto; }
  RegistroDto editar(Long id, RegistroRequest r, HttpServletRequest http) { if (r.fecha().isAfter(LocalDate.now())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha no puede ser futura."); Sedes.validar(r.sede()); RegistroDto dto = repo.editar(id, r); Auditoria.registrar(repo.jdbc(), "EDITAR_CONSULTA", dto.idPacienteRegional(), http); return dto; }
  void eliminar(Long id, HttpServletRequest http) { String paciente = obtener(id).idPacienteRegional(); repo.eliminar(id); Auditoria.registrar(repo.jdbc(), "ELIMINAR_CONSULTA", paciente, http); }
}

@org.springframework.stereotype.Repository
class RegistroRepository {
  private final JdbcTemplate jdbc;
  RegistroRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
  JdbcTemplate jdbc() { return jdbc; }
  void schema() {
    jdbc.execute("CREATE TABLE IF NOT EXISTS consultas (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, cedula TEXT NOT NULL, fecha TEXT NOT NULL, sede TEXT NOT NULL, medico TEXT, especialidad TEXT, tipo_consulta TEXT, diagnostico TEXT, tratamiento TEXT, motivo TEXT, evolucion TEXT, resultado TEXT, observaciones TEXT)");
    agregarColumna("consultas", "antecedentes_familiares", "TEXT");
    agregarColumna("consultas", "antecedentes_personales", "TEXT");
    agregarColumna("consultas", "cirugias", "TEXT");
    agregarColumna("consultas", "gineco_obstetricos", "TEXT");
    agregarColumna("consultas", "medicamentos_actuales", "TEXT");
    agregarColumna("consultas", "alergias", "TEXT");
    agregarColumna("consultas", "examen_fisico", "TEXT");
    agregarColumna("consultas", "signos_vitales", "TEXT");
    agregarColumna("consultas", "medicacion", "TEXT");
    agregarColumna("consultas", "proximo_control", "TEXT");
    agregarColumna("consultas", "gineco_embarazos", "TEXT");
    agregarColumna("consultas", "gineco_partos", "TEXT");
    agregarColumna("consultas", "gineco_cesareas", "TEXT");
    agregarColumna("consultas", "gineco_abortos", "TEXT");
    agregarColumna("consultas", "gineco_observaciones", "TEXT");
    agregarColumna("consultas", "examen_general", "TEXT");
    agregarColumna("consultas", "examen_cabeza_cuello", "TEXT");
    agregarColumna("consultas", "examen_torax", "TEXT");
    agregarColumna("consultas", "examen_abdomen", "TEXT");
    agregarColumna("consultas", "examen_extremidades", "TEXT");
    agregarColumna("consultas", "examen_neurologico", "TEXT");
    agregarColumna("consultas", "peso", "TEXT");
    agregarColumna("consultas", "talla", "TEXT");
    agregarColumna("consultas", "imc", "TEXT");
    agregarColumna("consultas", "temperatura", "TEXT");
    agregarColumna("consultas", "presion_arterial", "TEXT");
    agregarColumna("consultas", "frecuencia_cardiaca", "TEXT");
    agregarColumna("consultas", "frecuencia_respiratoria", "TEXT");
    agregarColumna("consultas", "saturacion_oxigeno", "TEXT");
    agregarColumna("consultas", "hora", "TEXT");
    agregarColumna("consultas", "diagnostico_principal_codigo", "TEXT");
    agregarColumna("consultas", "diagnostico_principal_nombre", "TEXT");
    agregarColumna("consultas", "diagnostico_secundario_codigo", "TEXT");
    agregarColumna("consultas", "diagnostico_secundario_nombre", "TEXT");
    jdbc.execute("CREATE TABLE IF NOT EXISTS consulta_diagnosticos (id INTEGER PRIMARY KEY AUTOINCREMENT, consulta_id INTEGER NOT NULL, tipo TEXT NOT NULL, codigo TEXT, descripcion TEXT, FOREIGN KEY(consulta_id) REFERENCES consultas(id))");
    jdbc.execute("CREATE TABLE IF NOT EXISTS consulta_antecedentes_familiares (id INTEGER PRIMARY KEY AUTOINCREMENT, consulta_id INTEGER NOT NULL, parentesco TEXT NOT NULL, antecedente TEXT NOT NULL, FOREIGN KEY(consulta_id) REFERENCES consultas(id))");
    jdbc.execute("CREATE TABLE IF NOT EXISTS consulta_antecedentes_personales (id INTEGER PRIMARY KEY AUTOINCREMENT, consulta_id INTEGER NOT NULL, tipo TEXT NOT NULL, detalle TEXT, FOREIGN KEY(consulta_id) REFERENCES consultas(id))");
    jdbc.execute("CREATE TABLE IF NOT EXISTS consulta_cirugias (id INTEGER PRIMARY KEY AUTOINCREMENT, consulta_id INTEGER NOT NULL, fecha TEXT, procedimiento TEXT, FOREIGN KEY(consulta_id) REFERENCES consultas(id))");
    jdbc.execute("CREATE TABLE IF NOT EXISTS consulta_signos_vitales (consulta_id INTEGER PRIMARY KEY, peso TEXT, talla TEXT, imc TEXT, temperatura TEXT, presion_arterial TEXT, frecuencia_cardiaca TEXT, frecuencia_respiratoria TEXT, saturacion_oxigeno TEXT, FOREIGN KEY(consulta_id) REFERENCES consultas(id))");
    jdbc.update("UPDATE consultas SET sede='SOLCA Quito' WHERE sede IS NULL OR TRIM(sede) = '' OR sede NOT IN ('SOLCA Cuenca','SOLCA Quito','SOLCA Guayaquil')");
    migrarRegistros("consultas");
    migrarObservacionesEstructuradas();
    migrarCamposNormalizados();
    reconstruirTablasClinicas();
    jdbc.execute("CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas(id_paciente_regional)");
    jdbc.execute("CREATE INDEX IF NOT EXISTS idx_consultas_cedula ON consultas(cedula)");
    Auditoria.crearTabla(jdbc);
  }
  void agregarColumna(String tabla, String columna, String definicion) {
    try { jdbc.execute("ALTER TABLE " + tabla + " ADD COLUMN " + columna + " " + definicion); } catch (Exception ignored) {}
  }
  void migrarRegistros(String destino) {
    Integer existe = jdbc.queryForObject("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='registros'", Integer.class);
    if (existe != null && existe > 0) {
      jdbc.execute("INSERT OR IGNORE INTO " + destino + "(id_paciente_regional,cedula,fecha,sede,medico,especialidad,tipo_consulta,diagnostico,tratamiento,motivo,evolucion,resultado,observaciones) SELECT id_paciente_regional,cedula,fecha,sede,medico,especialidad,tipo_consulta,diagnostico,tratamiento,motivo,evolucion,resultado,observaciones FROM registros");
    }
  }
  RegistroDto crear(RegistroRequest r) {
    DiagnosticoParts diag = diagnosticoParts(r);
    jdbc.update("INSERT INTO consultas(id_paciente_regional,cedula,fecha,hora,sede,medico,especialidad,tipo_consulta,diagnostico,diagnostico_principal_codigo,diagnostico_principal_nombre,diagnostico_secundario_codigo,diagnostico_secundario_nombre,tratamiento,motivo,evolucion,resultado,observaciones,antecedentes_familiares,antecedentes_personales,cirugias,gineco_obstetricos,medicamentos_actuales,alergias,examen_fisico,signos_vitales,medicacion,proximo_control,gineco_embarazos,gineco_partos,gineco_cesareas,gineco_abortos,gineco_observaciones,examen_general,examen_cabeza_cuello,examen_torax,examen_abdomen,examen_extremidades,examen_neurologico,peso,talla,imc,temperatura,presion_arterial,frecuencia_cardiaca,frecuencia_respiratoria,saturacion_oxigeno) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", normalizarPaciente(r),r.cedula(),r.fecha().toString(),normalizarHora(r.hora()),r.sede(),r.medico(),r.especialidad(),r.tipoConsulta(),r.diagnostico(),diag.codigoPrincipal(),diag.nombrePrincipal(),r.diagnosticoSecundarioCodigo(),r.diagnosticoSecundarioNombre(),r.tratamiento(),r.motivo(),r.evolucion(),r.resultado(),r.observaciones(),r.antecedentesFamiliares(),r.antecedentesPersonales(),r.cirugias(),r.ginecoObstetricos(),r.medicamentosActuales(),r.alergias(),r.examenFisico(),r.signosVitales(),r.medicacion(),r.proximoControl(),r.ginecoEmbarazos(),r.ginecoPartos(),r.ginecoCesareas(),r.ginecoAbortos(),r.ginecoObservaciones(),r.examenGeneral(),r.examenCabezaCuello(),r.examenTorax(),r.examenAbdomen(),r.examenExtremidades(),r.examenNeurologico(),r.peso(),r.talla(),r.imc(),r.temperatura(),r.presionArterial(),r.frecuenciaCardiaca(),r.frecuenciaRespiratoria(),r.saturacionOxigeno());
    Long id = jdbc.queryForObject("SELECT last_insert_rowid()", Long.class);
    reconstruirTablasClinicas(id);
    return obtener(id).orElseThrow();
  }
  RegistroDto editar(Long id, RegistroRequest r) {
    DiagnosticoParts diag = diagnosticoParts(r);
    int rows = jdbc.update("UPDATE consultas SET id_paciente_regional=?,cedula=?,fecha=?,hora=?,sede=?,medico=?,especialidad=?,tipo_consulta=?,diagnostico=?,diagnostico_principal_codigo=?,diagnostico_principal_nombre=?,diagnostico_secundario_codigo=?,diagnostico_secundario_nombre=?,tratamiento=?,motivo=?,evolucion=?,resultado=?,observaciones=?,antecedentes_familiares=?,antecedentes_personales=?,cirugias=?,gineco_obstetricos=?,medicamentos_actuales=?,alergias=?,examen_fisico=?,signos_vitales=?,medicacion=?,proximo_control=?,gineco_embarazos=?,gineco_partos=?,gineco_cesareas=?,gineco_abortos=?,gineco_observaciones=?,examen_general=?,examen_cabeza_cuello=?,examen_torax=?,examen_abdomen=?,examen_extremidades=?,examen_neurologico=?,peso=?,talla=?,imc=?,temperatura=?,presion_arterial=?,frecuencia_cardiaca=?,frecuencia_respiratoria=?,saturacion_oxigeno=? WHERE id=?", normalizarPaciente(r),r.cedula(),r.fecha().toString(),normalizarHora(r.hora()),r.sede(),r.medico(),r.especialidad(),r.tipoConsulta(),r.diagnostico(),diag.codigoPrincipal(),diag.nombrePrincipal(),r.diagnosticoSecundarioCodigo(),r.diagnosticoSecundarioNombre(),r.tratamiento(),r.motivo(),r.evolucion(),r.resultado(),r.observaciones(),r.antecedentesFamiliares(),r.antecedentesPersonales(),r.cirugias(),r.ginecoObstetricos(),r.medicamentosActuales(),r.alergias(),r.examenFisico(),r.signosVitales(),r.medicacion(),r.proximoControl(),r.ginecoEmbarazos(),r.ginecoPartos(),r.ginecoCesareas(),r.ginecoAbortos(),r.ginecoObservaciones(),r.examenGeneral(),r.examenCabezaCuello(),r.examenTorax(),r.examenAbdomen(),r.examenExtremidades(),r.examenNeurologico(),r.peso(),r.talla(),r.imc(),r.temperatura(),r.presionArterial(),r.frecuenciaCardiaca(),r.frecuenciaRespiratoria(),r.saturacionOxigeno(),id);
    if (rows == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro no encontrado.");
    reconstruirTablasClinicas(id);
    return obtener(id).orElseThrow();
  }
  void eliminar(Long id) { if (jdbc.update("DELETE FROM consultas WHERE id=?", id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND); }
  List<RegistroDto> listar() { return jdbc.query("SELECT * FROM consultas ORDER BY fecha DESC, id DESC", this::map); }
  List<RegistroDto> porPaciente(String id) { return jdbc.query("SELECT * FROM consultas WHERE id_paciente_regional=? OR cedula=? ORDER BY fecha DESC, id DESC", this::map, id, id); }
  Optional<RegistroDto> obtener(Long id) { return jdbc.query("SELECT * FROM consultas WHERE id=?", this::map, id).stream().findFirst(); }
  String normalizarPaciente(RegistroRequest r) { return r.idPacienteRegional() == null || r.idPacienteRegional().isBlank() ? r.cedula() : r.idPacienteRegional(); }
  RegistroDto map(java.sql.ResultSet rs, int row) throws java.sql.SQLException { return new RegistroDto(rs.getLong("id"),rs.getString("id_paciente_regional"),rs.getString("cedula"),LocalDate.parse(rs.getString("fecha")),rs.getString("hora"),rs.getString("sede"),rs.getString("medico"),rs.getString("especialidad"),rs.getString("tipo_consulta"),rs.getString("diagnostico"),rs.getString("diagnostico_principal_codigo"),rs.getString("diagnostico_principal_nombre"),rs.getString("diagnostico_secundario_codigo"),rs.getString("diagnostico_secundario_nombre"),rs.getString("tratamiento"),rs.getString("motivo"),rs.getString("evolucion"),rs.getString("resultado"),rs.getString("observaciones"),rs.getString("antecedentes_familiares"),rs.getString("antecedentes_personales"),rs.getString("cirugias"),rs.getString("gineco_obstetricos"),rs.getString("medicamentos_actuales"),rs.getString("alergias"),rs.getString("examen_fisico"),rs.getString("signos_vitales"),rs.getString("medicacion"),rs.getString("proximo_control"),rs.getString("gineco_embarazos"),rs.getString("gineco_partos"),rs.getString("gineco_cesareas"),rs.getString("gineco_abortos"),rs.getString("gineco_observaciones"),rs.getString("examen_general"),rs.getString("examen_cabeza_cuello"),rs.getString("examen_torax"),rs.getString("examen_abdomen"),rs.getString("examen_extremidades"),rs.getString("examen_neurologico"),rs.getString("peso"),rs.getString("talla"),rs.getString("imc"),rs.getString("temperatura"),rs.getString("presion_arterial"),rs.getString("frecuencia_cardiaca"),rs.getString("frecuencia_respiratoria"),rs.getString("saturacion_oxigeno")); }

  void migrarCamposNormalizados() {
    for (Map<String,Object> row : jdbc.queryForList("SELECT id, gineco_obstetricos, examen_fisico, signos_vitales FROM consultas")) {
      Long id = ((Number) row.get("id")).longValue();
      String gineco = valor(row.get("gineco_obstetricos"));
      String examen = valor(row.get("examen_fisico"));
      String signos = valor(row.get("signos_vitales"));
      jdbc.update("""
        UPDATE consultas SET
          gineco_embarazos=COALESCE(NULLIF(gineco_embarazos,''), ?),
          gineco_partos=COALESCE(NULLIF(gineco_partos,''), ?),
          gineco_cesareas=COALESCE(NULLIF(gineco_cesareas,''), ?),
          gineco_abortos=COALESCE(NULLIF(gineco_abortos,''), ?),
          gineco_observaciones=COALESCE(NULLIF(gineco_observaciones,''), ?),
          examen_general=COALESCE(NULLIF(examen_general,''), ?),
          examen_cabeza_cuello=COALESCE(NULLIF(examen_cabeza_cuello,''), ?),
          examen_torax=COALESCE(NULLIF(examen_torax,''), ?),
          examen_abdomen=COALESCE(NULLIF(examen_abdomen,''), ?),
          examen_extremidades=COALESCE(NULLIF(examen_extremidades,''), ?),
          examen_neurologico=COALESCE(NULLIF(examen_neurologico,''), ?),
          peso=COALESCE(NULLIF(peso,''), ?),
          talla=COALESCE(NULLIF(talla,''), ?),
          imc=COALESCE(NULLIF(imc,''), ?),
          temperatura=COALESCE(NULLIF(temperatura,''), ?),
          presion_arterial=COALESCE(NULLIF(presion_arterial,''), ?),
          frecuencia_cardiaca=COALESCE(NULLIF(frecuencia_cardiaca,''), ?),
          frecuencia_respiratoria=COALESCE(NULLIF(frecuencia_respiratoria,''), ?),
          saturacion_oxigeno=COALESCE(NULLIF(saturacion_oxigeno,''), ?)
        WHERE id=?
        """,
        extraerValor(gineco, "Embarazos"), extraerValor(gineco, "Partos"), extraerValor(gineco, "Cesáreas"), extraerValor(gineco, "Abortos"), extraerValor(gineco, "Observaciones:"),
        extraerValor(examen, "General:"), extraerValor(examen, "Cabeza/cuello:"), extraerValor(examen, "Tórax:"), extraerValor(examen, "Abdomen:"), extraerValor(examen, "Extremidades:"), extraerValor(examen, "Neurológico:"),
        extraerValor(signos, "Peso"), extraerValor(signos, "Talla"), extraerValor(signos, "IMC"), extraerValor(signos, "Temperatura"), extraerValor(signos, "PA"), extraerValor(signos, "FC"), extraerValor(signos, "FR"), extraerValor(signos, "Saturación"), id);
    }
  }

  String valor(Object value) { return value == null ? "" : String.valueOf(value); }

  String extraerValor(String texto, String etiqueta) {
    if (texto == null || texto.isBlank()) return "";
    for (String parte : texto.split(";")) {
      String limpia = parte.trim();
      if (limpia.startsWith(etiqueta)) {
        return limpia.substring(etiqueta.length()).replace("kg", "").replace("cm", "").trim();
      }
    }
    return "";
  }

  void migrarObservacionesEstructuradas() {
    for (Map<String,Object> row : jdbc.queryForList("SELECT id, observaciones FROM consultas WHERE observaciones IS NOT NULL AND TRIM(observaciones) <> ''")) {
      Long id = ((Number) row.get("id")).longValue();
      String texto = String.valueOf(row.get("observaciones"));
      Map<String,String> datos = extraerDatos(texto);
      if (datos.isEmpty()) continue;
      jdbc.update("""
        UPDATE consultas SET
          antecedentes_familiares=COALESCE(NULLIF(antecedentes_familiares,''), ?),
          antecedentes_personales=COALESCE(NULLIF(antecedentes_personales,''), ?),
          cirugias=COALESCE(NULLIF(cirugias,''), ?),
          gineco_obstetricos=COALESCE(NULLIF(gineco_obstetricos,''), ?),
          medicamentos_actuales=COALESCE(NULLIF(medicamentos_actuales,''), ?),
          alergias=COALESCE(NULLIF(alergias,''), ?),
          examen_fisico=COALESCE(NULLIF(examen_fisico,''), ?),
          signos_vitales=COALESCE(NULLIF(signos_vitales,''), ?),
          medicacion=COALESCE(NULLIF(medicacion,''), ?),
          proximo_control=COALESCE(NULLIF(proximo_control,''), ?),
          observaciones=?
        WHERE id=?
        """,
        datos.getOrDefault("antecedentesFamiliares", ""),
        datos.getOrDefault("antecedentesPersonales", ""),
        datos.getOrDefault("cirugias", ""),
        datos.getOrDefault("ginecoObstetricos", ""),
        datos.getOrDefault("medicamentosActuales", ""),
        datos.getOrDefault("alergias", ""),
        datos.getOrDefault("examenFisico", ""),
        datos.getOrDefault("signosVitales", ""),
        datos.getOrDefault("medicacion", ""),
        datos.getOrDefault("proximoControl", ""),
        datos.getOrDefault("observaciones", ""),
        id);
    }
  }

  Map<String,String> extraerDatos(String texto) {
    Map<String,String> datos = new LinkedHashMap<>();
    datos.put("antecedentesFamiliares", extraerLinea(texto, "Antecedentes familiares:"));
    datos.put("antecedentesPersonales", extraerLinea(texto, "Antecedentes personales:"));
    datos.put("cirugias", extraerLineas(texto, "Cirugía "));
    datos.put("ginecoObstetricos", extraerLinea(texto, "Gineco-obstétricos:"));
    datos.put("medicamentosActuales", extraerLinea(texto, "Medicamentos actuales:"));
    datos.put("alergias", extraerLinea(texto, "Alergias:"));
    datos.put("examenFisico", extraerLinea(texto, "Examen físico:"));
    datos.put("signosVitales", extraerLinea(texto, "Signos vitales:"));
    datos.put("medicacion", extraerLinea(texto, "Medicación:"));
    datos.put("proximoControl", extraerLinea(texto, "Próximo control:"));
    datos.put("observaciones", extraerLinea(texto, "Observaciones:"));
    datos.entrySet().removeIf(entry -> entry.getValue() == null || entry.getValue().isBlank());
    return datos;
  }

  String extraerLinea(String texto, String prefijo) {
    for (String linea : texto.split("\\R")) {
      String limpia = linea.trim();
      if (limpia.startsWith(prefijo)) return limpia.substring(prefijo.length()).trim();
    }
    return "";
  }

  String extraerLineas(String texto, String prefijo) {
    List<String> lineas = new ArrayList<>();
    for (String linea : texto.split("\\R")) {
      String limpia = linea.trim();
      if (limpia.startsWith(prefijo)) lineas.add(limpia);
    }
    return String.join("; ", lineas);
  }

  String normalizarHora(String value) {
    return value == null || value.isBlank() ? java.time.LocalTime.now().toString().substring(0, 5) : value.trim();
  }

  DiagnosticoParts diagnosticoParts(RegistroRequest r) {
    String codigo = r.diagnosticoPrincipalCodigo();
    String nombre = r.diagnosticoPrincipalNombre();
    if ((codigo == null || codigo.isBlank()) && r.diagnostico() != null) {
      String[] parts = r.diagnostico().split(" - ", 2);
      if (parts.length == 2) {
        codigo = parts[0].trim();
        nombre = parts[1].trim();
      } else {
        nombre = r.diagnostico().trim();
      }
    }
    return new DiagnosticoParts(codigo, nombre);
  }

  void reconstruirTablasClinicas() {
    for (Map<String,Object> row : jdbc.queryForList("SELECT id FROM consultas")) {
      reconstruirTablasClinicas(((Number) row.get("id")).longValue());
    }
  }

  void reconstruirTablasClinicas(Long consultaId) {
    Map<String,Object> row = jdbc.queryForList("SELECT * FROM consultas WHERE id=?", consultaId).stream().findFirst().orElse(Map.of());
    if (row.isEmpty()) return;
    jdbc.update("DELETE FROM consulta_diagnosticos WHERE consulta_id=?", consultaId);
    jdbc.update("DELETE FROM consulta_antecedentes_familiares WHERE consulta_id=?", consultaId);
    jdbc.update("DELETE FROM consulta_antecedentes_personales WHERE consulta_id=?", consultaId);
    jdbc.update("DELETE FROM consulta_cirugias WHERE consulta_id=?", consultaId);
    jdbc.update("DELETE FROM consulta_signos_vitales WHERE consulta_id=?", consultaId);

    String codigoPrincipal = primerValorNoVacio(valor(row.get("diagnostico_principal_codigo")), extraerCodigo(valor(row.get("diagnostico"))));
    String nombrePrincipal = primerValorNoVacio(valor(row.get("diagnostico_principal_nombre")), extraerDescripcion(valor(row.get("diagnostico"))));
    if (!codigoPrincipal.isBlank() || !nombrePrincipal.isBlank()) {
      jdbc.update("INSERT INTO consulta_diagnosticos(consulta_id,tipo,codigo,descripcion) VALUES (?,?,?,?)", consultaId, "PRINCIPAL", codigoPrincipal, nombrePrincipal);
    }
    String codigoSec = valor(row.get("diagnostico_secundario_codigo"));
    String nombreSec = valor(row.get("diagnostico_secundario_nombre"));
    if (!codigoSec.isBlank() || !nombreSec.isBlank()) {
      jdbc.update("INSERT INTO consulta_diagnosticos(consulta_id,tipo,codigo,descripcion) VALUES (?,?,?,?)", consultaId, "SECUNDARIO", codigoSec, nombreSec);
    }

    for (String item : valor(row.get("antecedentes_familiares")).split(";")) {
      String[] parts = item.split(":", 2);
      if (parts.length == 2 && !parts[1].trim().isBlank() && !"N/A".equalsIgnoreCase(parts[1].trim())) {
        jdbc.update("INSERT INTO consulta_antecedentes_familiares(consulta_id,parentesco,antecedente) VALUES (?,?,?)", consultaId, parts[0].trim(), parts[1].trim());
      }
    }
    for (String item : valor(row.get("antecedentes_personales")).split(";")) {
      String clean = item.trim();
      if (!clean.isBlank() && !clean.toLowerCase(Locale.ROOT).startsWith("sin antecedentes")) {
        String[] parts = clean.split(":", 2);
        jdbc.update("INSERT INTO consulta_antecedentes_personales(consulta_id,tipo,detalle) VALUES (?,?,?)", consultaId, parts[0].trim(), parts.length > 1 ? parts[1].trim() : "");
      }
    }
    for (String item : valor(row.get("cirugias")).split(";")) {
      String clean = item.trim().replaceFirst("^Cirugía\\s*\\d*:?\\s*", "");
      if (clean.isBlank()) continue;
      String[] parts = clean.split(" - ", 2);
      jdbc.update("INSERT INTO consulta_cirugias(consulta_id,fecha,procedimiento) VALUES (?,?,?)", consultaId, parts.length > 1 ? parts[0].trim() : "", parts.length > 1 ? parts[1].trim() : clean);
    }
    jdbc.update("INSERT INTO consulta_signos_vitales(consulta_id,peso,talla,imc,temperatura,presion_arterial,frecuencia_cardiaca,frecuencia_respiratoria,saturacion_oxigeno) VALUES (?,?,?,?,?,?,?,?,?)",
      consultaId, valor(row.get("peso")), valor(row.get("talla")), valor(row.get("imc")), valor(row.get("temperatura")), valor(row.get("presion_arterial")), valor(row.get("frecuencia_cardiaca")), valor(row.get("frecuencia_respiratoria")), valor(row.get("saturacion_oxigeno")));
  }

  String extraerCodigo(String diagnostico) {
    if (diagnostico == null || diagnostico.isBlank()) return "";
    String[] parts = diagnostico.split(" - ", 2);
    return parts.length == 2 ? parts[0].trim() : "";
  }

  String extraerDescripcion(String diagnostico) {
    if (diagnostico == null || diagnostico.isBlank()) return "";
    String[] parts = diagnostico.split(" - ", 2);
    return parts.length == 2 ? parts[1].trim() : diagnostico.trim();
  }

  String primerValorNoVacio(String... values) {
    for (String value : values) {
      if (value != null && !value.isBlank()) return value.trim();
    }
    return "";
  }
}

record DiagnosticoParts(String codigoPrincipal, String nombrePrincipal) {}

class Sedes {
  static final List<String> OFICIALES = List.of("SOLCA Cuenca", "SOLCA Quito", "SOLCA Guayaquil");
  static void validar(String sede) {
    if (sede == null || !OFICIALES.contains(sede.trim())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sede inválida. Use SOLCA Cuenca, SOLCA Quito o SOLCA Guayaquil.");
    }
  }
}
