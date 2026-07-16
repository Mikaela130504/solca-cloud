package ec.edu.solca.repositorio;

import ec.edu.solca.common.Auditoria;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.*;

@SpringBootApplication(scanBasePackages = "ec.edu.solca")
public class RepositoryServiceApplication {
  public static void main(String[] args) { SpringApplication.run(RepositoryServiceApplication.class, args); }
  @Bean CommandLineRunner schema(RepositorioService service) { return args -> service.schema(); }
}

@RestController
@RequestMapping("/repositorio-clinico")
class RepositorioController {
  private final RepositorioService service;
  RepositorioController(RepositorioService service) { this.service = service; }
  @GetMapping @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") Map<String,Object> vacio() { return Map.of("mensaje", "Ingrese un identificador regional o cédula para consultar el repositorio clínico."); }
  @GetMapping("/{paciente}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") Map<String,Object> consultar(@PathVariable String paciente, @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization, HttpServletRequest http) { return service.consultar(paciente, authorization, http); }
  @PostMapping("/sincronizar") @PreAuthorize("hasRole('ADMIN')") Map<String,Object> sincronizar(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization, HttpServletRequest http) { return service.sincronizarTodos(authorization, http); }
  @GetMapping("/auditorias") @PreAuthorize("hasRole('ADMIN')") List<Map<String,Object>> auditorias(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) { return service.auditorias(authorization); }
  @GetMapping("/estado-servicios") @PreAuthorize("hasRole('ADMIN')") List<Map<String,Object>> estadoServicios() { return service.estadoServicios(); }
  @GetMapping("/logs-integracion") @PreAuthorize("hasRole('ADMIN')") List<Map<String,Object>> logsIntegracion() { return service.logsIntegracion(); }
}

@RestController
@RequestMapping("/repositorio")
class RepositorioAvanceController {
  private final RepositorioService service;
  RepositorioAvanceController(RepositorioService service) { this.service = service; }
  @GetMapping("/paciente/{idPacienteRegional}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") Map<String,Object> consultarPaciente(@PathVariable String idPacienteRegional, @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization, HttpServletRequest http) { return service.consultarAvance(idPacienteRegional, authorization, http); }
}

@org.springframework.stereotype.Service
class RepositorioService {
  private final RestClient rest = RestClient.builder().build();
  private final JdbcTemplate jdbc;
  @Value("${service.pacientes:http://localhost:8001}") String pacientes;
  @Value("${service.auth:http://localhost:8000}") String auth;
  @Value("${service.consultas:http://localhost:8002}") String consultas;
  @Value("${service.laboratorios:http://localhost:8003}") String laboratorios;
  @Value("${service.imagenologia:http://localhost:8004}") String imagenologia;

  RepositorioService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

  void schema() {
    Auditoria.crearTabla(jdbc);
    jdbc.execute("DROP TABLE IF EXISTS repositorio_clinico");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_pacientes (id_paciente_regional TEXT PRIMARY KEY, cedula TEXT, nombres TEXT, apellidos TEXT, fecha_nacimiento TEXT, edad TEXT, sexo TEXT, estado_civil TEXT, direccion TEXT, provincia TEXT, ciudad TEXT, telefono TEXT, correo TEXT, contacto_emergencia TEXT, seguro TEXT, tipo_sangre TEXT, nacionalidad TEXT, observaciones TEXT, sede TEXT, fecha_sincronizacion TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_historias_locales (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT NOT NULL, sede TEXT NOT NULL, identificador_historia_local TEXT NOT NULL, UNIQUE(id_paciente_regional,sede,identificador_historia_local))");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_consultas (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, consulta_origen_id TEXT, cedula TEXT, fecha TEXT, hora TEXT, sede TEXT, medico TEXT, especialidad TEXT, tipo_consulta TEXT, diagnostico TEXT, tratamiento TEXT, motivo TEXT, evolucion TEXT, resultado TEXT, observaciones TEXT, medicamentos_actuales TEXT, alergias TEXT, medicacion TEXT, proximo_control TEXT, fecha_sincronizacion TEXT, UNIQUE(id_paciente_regional,consulta_origen_id))");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_diagnosticos (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, consulta_origen_id TEXT, tipo TEXT, codigo TEXT, descripcion TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_antecedentes_familiares (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, consulta_origen_id TEXT, parentesco TEXT, antecedente TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_antecedentes_personales (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, consulta_origen_id TEXT, tipo TEXT, detalle TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_cirugias (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, consulta_origen_id TEXT, fecha TEXT, procedimiento TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_signos_vitales (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, consulta_origen_id TEXT, peso TEXT, talla TEXT, imc TEXT, temperatura TEXT, presion_arterial TEXT, frecuencia_cardiaca TEXT, frecuencia_respiratoria TEXT, saturacion_oxigeno TEXT, examen_general TEXT, examen_cabeza_cuello TEXT, examen_torax TEXT, examen_abdomen TEXT, examen_extremidades TEXT, examen_neurologico TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_laboratorio_solicitudes (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, laboratorio_origen_id TEXT, consulta_origen_id TEXT, cedula TEXT, fecha TEXT, sede TEXT, medico TEXT, especialidad TEXT, tipo_examen TEXT, estado TEXT, prioridad TEXT, observaciones_medicas TEXT, codigo_muestra TEXT, tecnologo_responsable TEXT, fecha_solicitud TEXT, fecha_resultado TEXT, interpretacion TEXT, resultado_critico TEXT, usuario_valido TEXT, observaciones_laboratorio TEXT, fecha_sincronizacion TEXT, UNIQUE(id_paciente_regional,laboratorio_origen_id))");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_laboratorio_parametros (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, laboratorio_origen_id TEXT, parametro TEXT, valor_obtenido TEXT, unidad TEXT, valor_referencia_min TEXT, valor_referencia_max TEXT, indicador TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_imagenologia_solicitudes (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, imagen_origen_id TEXT, consulta_origen_id TEXT, cedula TEXT, fecha TEXT, sede TEXT, medico TEXT, especialidad TEXT, tipo_estudio TEXT, region_anatomica TEXT, estado TEXT, prioridad TEXT, indicacion_medica TEXT, formato TEXT, url TEXT, tecnico_responsable TEXT, hora TEXT, fecha_solicitud TEXT, fecha_realizacion TEXT, fecha_sincronizacion TEXT, UNIQUE(id_paciente_regional,imagen_origen_id))");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_imagenologia_informes (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, imagen_origen_id TEXT, hallazgos TEXT, conclusion_diagnostica TEXT, observaciones_imagenologo TEXT, recomendaciones TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_archivos (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT, modulo TEXT, registro_origen_id TEXT, formato TEXT, url TEXT, nombre_archivo TEXT, fecha_carga TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_estado_servicios (servicio TEXT PRIMARY KEY, estado TEXT, ultima_revision TEXT, mensaje TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_logs_integracion (id INTEGER PRIMARY KEY AUTOINCREMENT, servicio TEXT, endpoint TEXT, fecha_hora TEXT, resultado TEXT, tiempo_respuesta_ms INTEGER, mensaje TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_historial_consultas (id INTEGER PRIMARY KEY AUTOINCREMENT, paciente TEXT, id_paciente_regional TEXT, usuario TEXT, fecha_hora TEXT, resultado TEXT, servicios_no_disponibles TEXT)");
    for (String table : List.of("repositorio_pacientes","repositorio_consultas","repositorio_laboratorio_solicitudes","repositorio_imagenologia_solicitudes")) {
      jdbc.execute("CREATE INDEX IF NOT EXISTS idx_" + table + "_paciente ON " + table + "(id_paciente_regional)");
    }
  }

  Map<String,Object> consultar(String paciente, String authorization, HttpServletRequest http) {
    Map<String,Object> respuesta = new LinkedHashMap<>();
    List<String> noDisponibles = new ArrayList<>();
    Object pacienteDto = buscarPaciente(paciente, authorization, noDisponibles);
    String idRegional = pacienteDto instanceof Map<?,?> map && map.get("idPacienteRegional") != null ? String.valueOf(map.get("idPacienteRegional")) : paciente;
    List<String> ids = identificadoresPaciente(idRegional);
    Object consultasPaciente = buscarRegistros(consultas + "/consultas/paciente/", ids, authorization, noDisponibles, "Consulta Clínica");
    Object laboratoriosPaciente = consolidarConConsulta(buscarRegistros(laboratorios + "/laboratorios/paciente/", ids, authorization, noDisponibles, "Laboratorio Clínico"), consultasPaciente);
    Object imagenologiaPaciente = consolidarConConsulta(buscarRegistros(imagenologia + "/imagenologia/paciente/", ids, authorization, noDisponibles, "Imagenología"), consultasPaciente);
    sincronizarPaciente(idRegional, comoMapa(pacienteDto), comoLista(consultasPaciente), comoLista(laboratoriosPaciente), comoLista(imagenologiaPaciente));
    guardarHistorial(paciente, idRegional, noDisponibles, http);
    respuesta.put("paciente", pacienteDto);
    respuesta.put("consultas", consultasPaciente);
    respuesta.put("laboratorios", laboratoriosPaciente);
    respuesta.put("imagenologia", imagenologiaPaciente);
    respuesta.put("serviciosNoDisponibles", noDisponibles);
    respuesta.put("estadoServicios", estadoServicios());
    respuesta.put("logsIntegracion", logsIntegracion());
    respuesta.put("historialConsultasRepositorio", historialConsultas(idRegional));
    respuesta.put("cacheClinica", cacheClinica(idRegional));
    Auditoria.registrar(jdbc, "CONSULTA_REPOSITORIO", idRegional, http);
    return respuesta;
  }

  Map<String,Object> consultarAvance(String paciente, String authorization, HttpServletRequest http) {
    Map<String,Object> base = consultar(paciente, authorization, http);
    return Map.of("paciente", base.get("paciente"), "consultas", base.get("consultas"), "laboratorio", base.get("laboratorios"), "imagenes", base.get("imagenologia"), "serviciosNoDisponibles", base.get("serviciosNoDisponibles"));
  }

  Map<String,Object> sincronizarTodos(String authorization, HttpServletRequest http) {
    List<Map<String,Object>> pacientesRegional = pacientesRegionales(authorization);
    List<String> sincronizados = new ArrayList<>();
    List<String> errores = new ArrayList<>();
    for (Map<String,Object> row : pacientesRegional) {
      String id = valor(row, "idPacienteRegional");
      if (id.isBlank()) continue;
      try { consultar(id, authorization, http); sincronizados.add(id); }
      catch (Exception ex) { errores.add(id + ": " + ex.getMessage()); }
    }
    return Map.of("totalPacientes", pacientesRegional.size(), "sincronizados", sincronizados.size(), "idsSincronizados", sincronizados, "errores", errores);
  }

  Object llamar(String url, String authorization, List<String> noDisponibles, String nombre, Object fallback) {
    long inicio = System.currentTimeMillis();
    try {
      Object body = rest.get().uri(url).header(HttpHeaders.AUTHORIZATION, authorization).retrieve().body(Object.class);
      registrarServicio(nombre, "DISPONIBLE", url, "OK", System.currentTimeMillis() - inicio, "Respuesta recibida");
      return body;
    } catch (HttpClientErrorException.NotFound ex) {
      registrarServicio(nombre, "DISPONIBLE", url, "SIN_DATOS", System.currentTimeMillis() - inicio, "Sin registros");
      return fallback;
    } catch (Exception ex) {
      noDisponibles.add(nombre);
      registrarServicio(nombre, "NO_DISPONIBLE", url, "ERROR", System.currentTimeMillis() - inicio, ex.getMessage());
      return fallback;
    }
  }

  Object buscarPaciente(String paciente, String authorization, List<String> noDisponibles) {
    if (paciente.matches("\\d{10}")) return llamar(pacientes + "/pacientes/cedula/" + paciente, authorization, noDisponibles, "Paciente Maestro Regional", new LinkedHashMap<>());
    for (String id : identificadoresPaciente(paciente)) {
      Object respuesta = llamar(pacientes + "/pacientes/" + id, authorization, noDisponibles, "Paciente Maestro Regional", new LinkedHashMap<>());
      if (respuesta instanceof Map<?,?> map && !map.isEmpty()) return respuesta;
    }
    return pacienteCache(paciente);
  }

  Object buscarRegistros(String endpoint, List<String> ids, String authorization, List<String> noDisponibles, String nombre) {
    for (String id : ids) {
      Object respuesta = llamar(endpoint + id, authorization, noDisponibles, nombre, List.of());
      if (respuesta instanceof List<?> list && !list.isEmpty()) return respuesta;
    }
    return List.of();
  }

  void sincronizarPaciente(String idRegional, Map<String,Object> paciente, List<?> consultas, List<?> laboratorios, List<?> imagenologia) {
    String ahora = LocalDateTime.now().toString();
    if (!paciente.isEmpty()) guardarPaciente(paciente, idRegional, ahora);
    limpiarClinica(idRegional);
    for (Object item : consultas) guardarConsulta(idRegional, comoMapa(item), ahora);
    for (Object item : laboratorios) guardarLaboratorio(idRegional, comoMapa(item), ahora);
    for (Object item : imagenologia) guardarImagenologia(idRegional, comoMapa(item), ahora);
  }

  void guardarPaciente(Map<String,Object> p, String id, String ahora) {
    jdbc.update("INSERT OR REPLACE INTO repositorio_pacientes(id_paciente_regional,cedula,nombres,apellidos,fecha_nacimiento,edad,sexo,estado_civil,direccion,provincia,ciudad,telefono,correo,contacto_emergencia,seguro,tipo_sangre,nacionalidad,observaciones,sede,fecha_sincronizacion) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      id, valor(p,"cedula"), valor(p,"nombres"), valor(p,"apellidos"), valor(p,"fechaNacimiento"), valor(p,"edad"), valor(p,"sexo"), valor(p,"estadoCivil"), valor(p,"direccion"), valor(p,"provincia"), valor(p,"ciudad"), valor(p,"telefono"), valor(p,"correo"), valor(p,"contactoEmergencia"), valor(p,"seguro"), valor(p,"tipoSangre"), valor(p,"nacionalidad"), valor(p,"observaciones"), valor(p,"sede"), ahora);
    jdbc.update("DELETE FROM repositorio_historias_locales WHERE id_paciente_regional=?", id);
    for (Object item : comoLista(p.get("historiasLocales"))) {
      Map<String,Object> h = comoMapa(item);
      jdbc.update("INSERT OR IGNORE INTO repositorio_historias_locales(id_paciente_regional,sede,identificador_historia_local) VALUES (?,?,?)", id, valor(h,"sede"), valor(h,"identificadorHistoriaLocal"));
    }
  }

  void limpiarClinica(String id) {
    for (String table : List.of("repositorio_consultas","repositorio_diagnosticos","repositorio_antecedentes_familiares","repositorio_antecedentes_personales","repositorio_cirugias","repositorio_signos_vitales","repositorio_laboratorio_solicitudes","repositorio_laboratorio_parametros","repositorio_imagenologia_solicitudes","repositorio_imagenologia_informes","repositorio_archivos")) {
      jdbc.update("DELETE FROM " + table + " WHERE id_paciente_regional=?", id);
    }
  }

  void guardarConsulta(String id, Map<String,Object> c, String ahora) {
    String consultaId = valor(c, "id");
    jdbc.update("INSERT OR REPLACE INTO repositorio_consultas(id_paciente_regional,consulta_origen_id,cedula,fecha,hora,sede,medico,especialidad,tipo_consulta,diagnostico,tratamiento,motivo,evolucion,resultado,observaciones,medicamentos_actuales,alergias,medicacion,proximo_control,fecha_sincronizacion) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      id, consultaId, valor(c,"cedula"), valor(c,"fecha"), valor(c,"hora"), valor(c,"sede"), valor(c,"medico"), valor(c,"especialidad"), valor(c,"tipoConsulta"), valor(c,"diagnostico"), valor(c,"tratamiento"), valor(c,"motivo"), valor(c,"evolucion"), valor(c,"resultado"), valor(c,"observaciones"), valor(c,"medicamentosActuales"), valor(c,"alergias"), valor(c,"medicacion"), valor(c,"proximoControl"), ahora);
    guardarDiagnostico(id, consultaId, "PRINCIPAL", primer(valor(c,"diagnosticoPrincipalCodigo"), codigo(valor(c,"diagnostico"))), primer(valor(c,"diagnosticoPrincipalNombre"), descripcion(valor(c,"diagnostico"))));
    guardarDiagnostico(id, consultaId, "SECUNDARIO", valor(c,"diagnosticoSecundarioCodigo"), valor(c,"diagnosticoSecundarioNombre"));
    guardarFamiliares(id, consultaId, valor(c, "antecedentesFamiliares"));
    guardarPersonales(id, consultaId, valor(c, "antecedentesPersonales"));
    guardarCirugias(id, consultaId, valor(c, "cirugias"));
    jdbc.update("INSERT INTO repositorio_signos_vitales(id_paciente_regional,consulta_origen_id,peso,talla,imc,temperatura,presion_arterial,frecuencia_cardiaca,frecuencia_respiratoria,saturacion_oxigeno,examen_general,examen_cabeza_cuello,examen_torax,examen_abdomen,examen_extremidades,examen_neurologico) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      id, consultaId, valor(c,"peso"), valor(c,"talla"), valor(c,"imc"), valor(c,"temperatura"), valor(c,"presionArterial"), valor(c,"frecuenciaCardiaca"), valor(c,"frecuenciaRespiratoria"), valor(c,"saturacionOxigeno"), valor(c,"examenGeneral"), valor(c,"examenCabezaCuello"), valor(c,"examenTorax"), valor(c,"examenAbdomen"), valor(c,"examenExtremidades"), valor(c,"examenNeurologico"));
  }

  void guardarLaboratorio(String id, Map<String,Object> l, String ahora) {
    String labId = valor(l, "id");
    jdbc.update("INSERT OR REPLACE INTO repositorio_laboratorio_solicitudes(id_paciente_regional,laboratorio_origen_id,consulta_origen_id,cedula,fecha,sede,medico,especialidad,tipo_examen,estado,prioridad,observaciones_medicas,codigo_muestra,tecnologo_responsable,fecha_solicitud,fecha_resultado,interpretacion,resultado_critico,usuario_valido,observaciones_laboratorio,fecha_sincronizacion) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      id, labId, valor(l,"consultaId"), valor(l,"cedula"), valor(l,"fecha"), valor(l,"sede"), valor(l,"medico"), valor(l,"especialidad"), valor(l,"tipoExamen"), valor(l,"estado"), valor(l,"prioridad"), valor(l,"observaciones"), valor(l,"codigoMuestra"), valor(l,"tecnologoResponsable"), valor(l,"fechaSolicitud"), valor(l,"fechaResultado"), valor(l,"interpretacion"), valor(l,"resultadoCritico"), valor(l,"usuarioValido"), valor(l,"observacionesLaboratorio"), ahora);
    guardarParametros(id, labId, valor(l, "valores"), valor(l, "unidad"), valor(l, "valorReferencia"));
  }

  void guardarImagenologia(String id, Map<String,Object> img, String ahora) {
    String imgId = valor(img, "id");
    jdbc.update("INSERT OR REPLACE INTO repositorio_imagenologia_solicitudes(id_paciente_regional,imagen_origen_id,consulta_origen_id,cedula,fecha,sede,medico,especialidad,tipo_estudio,region_anatomica,estado,prioridad,indicacion_medica,formato,url,tecnico_responsable,hora,fecha_solicitud,fecha_realizacion,fecha_sincronizacion) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      id, imgId, valor(img,"consultaId"), valor(img,"cedula"), valor(img,"fecha"), valor(img,"sede"), valor(img,"medico"), valor(img,"especialidad"), valor(img,"tipoEstudio"), valor(img,"regionAnatomica"), valor(img,"estado"), valor(img,"prioridad"), valor(img,"observaciones"), valor(img,"formato"), valor(img,"url"), valor(img,"tecnicoResponsable"), valor(img,"hora"), valor(img,"fechaSolicitud"), valor(img,"fechaRealizacion"), ahora);
    jdbc.update("INSERT INTO repositorio_imagenologia_informes(id_paciente_regional,imagen_origen_id,hallazgos,conclusion_diagnostica,observaciones_imagenologo,recomendaciones) VALUES (?,?,?,?,?,?)", id, imgId, valor(img,"hallazgos"), valor(img,"resultado"), valor(img,"observacionesImagenologo"), valor(img,"recomendaciones"));
    String url = valor(img, "url");
    if (!url.isBlank()) jdbc.update("INSERT INTO repositorio_archivos(id_paciente_regional,modulo,registro_origen_id,formato,url,nombre_archivo,fecha_carga) VALUES (?,?,?,?,?,?,?)", id, "IMAGENOLOGIA", imgId, valor(img,"formato"), url, nombreArchivo(url), valor(img,"fechaRealizacion"));
  }

  void guardarDiagnostico(String id, String consultaId, String tipo, String codigo, String descripcion) {
    if (codigo.isBlank() && descripcion.isBlank()) return;
    jdbc.update("INSERT INTO repositorio_diagnosticos(id_paciente_regional,consulta_origen_id,tipo,codigo,descripcion) VALUES (?,?,?,?,?)", id, consultaId, tipo, codigo, descripcion);
  }

  void guardarFamiliares(String id, String consultaId, String text) {
    for (String item : text.split(";")) {
      String[] parts = item.split(":", 2);
      if (parts.length == 2 && !parts[1].trim().isBlank() && !"N/A".equalsIgnoreCase(parts[1].trim())) jdbc.update("INSERT INTO repositorio_antecedentes_familiares(id_paciente_regional,consulta_origen_id,parentesco,antecedente) VALUES (?,?,?,?)", id, consultaId, parts[0].trim(), parts[1].trim());
    }
  }

  void guardarPersonales(String id, String consultaId, String text) {
    for (String item : text.split(";")) {
      String clean = item.trim();
      if (clean.isBlank() || clean.toLowerCase(Locale.ROOT).startsWith("sin antecedentes")) continue;
      String[] parts = clean.split(":", 2);
      jdbc.update("INSERT INTO repositorio_antecedentes_personales(id_paciente_regional,consulta_origen_id,tipo,detalle) VALUES (?,?,?,?)", id, consultaId, parts[0].trim(), parts.length > 1 ? parts[1].trim() : "");
    }
  }

  void guardarCirugias(String id, String consultaId, String text) {
    for (String item : text.split(";")) {
      String clean = item.trim().replaceFirst("^Cirugía\\s*\\d*:?\\s*", "");
      if (clean.isBlank()) continue;
      String[] parts = clean.split(" - ", 2);
      jdbc.update("INSERT INTO repositorio_cirugias(id_paciente_regional,consulta_origen_id,fecha,procedimiento) VALUES (?,?,?,?)", id, consultaId, parts.length > 1 ? parts[0].trim() : "", parts.length > 1 ? parts[1].trim() : clean);
    }
  }

  void guardarParametros(String id, String labId, String valores, String unidadGeneral, String referenciaGeneral) {
    if (valores == null || valores.isBlank()) return;
    if (valores.trim().startsWith("[")) {
      java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\{([^}]*)\\}").matcher(valores);
      while (matcher.find()) {
        String object = matcher.group(1);
        String parametro = primer(jsonValue(object, "name"), jsonValue(object, "parametro"));
        if (!parametro.isBlank()) jdbc.update("INSERT INTO repositorio_laboratorio_parametros(id_paciente_regional,laboratorio_origen_id,parametro,valor_obtenido,unidad,valor_referencia_min,valor_referencia_max,indicador) VALUES (?,?,?,?,?,?,?,?)", id, labId, parametro, jsonValue(object,"value"), jsonValue(object,"unit"), jsonValue(object,"min"), jsonValue(object,"max"), jsonValue(object,"indicator"));
      }
    } else {
      jdbc.update("INSERT INTO repositorio_laboratorio_parametros(id_paciente_regional,laboratorio_origen_id,parametro,valor_obtenido,unidad,valor_referencia_min,valor_referencia_max,indicador) VALUES (?,?,?,?,?,?,?,?)", id, labId, "Resultado general", valores, unidadGeneral, "", referenciaGeneral, "");
    }
  }

  Object consolidarConConsulta(Object registros, Object consultasPaciente) {
    if (!(registros instanceof List<?> rows) || !(consultasPaciente instanceof List<?> consultasRows)) return registros;
    Map<Long, Map<String,Object>> consultasPorId = new HashMap<>();
    for (Object item : consultasRows) {
      Map<String,Object> map = comoMapa(item);
      if (!valor(map, "id").isBlank()) consultasPorId.put(Long.valueOf(valor(map, "id")), map);
    }
    List<Map<String,Object>> salida = new ArrayList<>();
    for (Object item : rows) {
      Map<String,Object> row = comoMapa(item);
      String consultaId = valor(row, "consultaId");
      if (!consultaId.isBlank() && consultasPorId.containsKey(Long.valueOf(consultaId))) {
        Map<String,Object> c = consultasPorId.get(Long.valueOf(consultaId));
        for (String campo : List.of("sede","medico","especialidad","tipoConsulta","fecha","hora","diagnostico")) if (!valor(c,campo).isBlank()) row.put(campo, c.get(campo));
      }
      salida.add(row);
    }
    return salida;
  }

  void registrarServicio(String servicio, String estado, String endpoint, String resultado, long tiempoMs, String mensaje) {
    String ahora = LocalDateTime.now().toString();
    jdbc.update("INSERT INTO repositorio_logs_integracion(servicio,endpoint,fecha_hora,resultado,tiempo_respuesta_ms,mensaje) VALUES (?,?,?,?,?,?)", servicio, endpoint, ahora, resultado, tiempoMs, mensaje);
    jdbc.update("INSERT OR REPLACE INTO repositorio_estado_servicios(servicio,estado,ultima_revision,mensaje) VALUES (?,?,?,?)", servicio, estado, ahora, mensaje);
  }

  void guardarHistorial(String paciente, String idRegional, List<String> noDisponibles, HttpServletRequest http) {
    String usuario = http.getUserPrincipal() == null ? "sistema" : http.getUserPrincipal().getName();
    jdbc.update("INSERT INTO repositorio_historial_consultas(paciente,id_paciente_regional,usuario,fecha_hora,resultado,servicios_no_disponibles) VALUES (?,?,?,?,?,?)", paciente, idRegional, usuario, LocalDateTime.now().toString(), noDisponibles.isEmpty() ? "COMPLETO" : "PARCIAL", String.join(", ", noDisponibles));
  }

  List<Map<String,Object>> estadoServicios() { return jdbc.queryForList("SELECT servicio, estado, ultima_revision, mensaje FROM repositorio_estado_servicios ORDER BY servicio"); }
  List<Map<String,Object>> logsIntegracion() { return jdbc.queryForList("SELECT servicio, endpoint, fecha_hora, resultado, tiempo_respuesta_ms, mensaje FROM repositorio_logs_integracion ORDER BY id DESC LIMIT 100"); }
  List<Map<String,Object>> historialConsultas(String id) { return jdbc.queryForList("SELECT paciente,id_paciente_regional,usuario,fecha_hora,resultado,servicios_no_disponibles FROM repositorio_historial_consultas WHERE id_paciente_regional=? OR paciente=? ORDER BY id DESC LIMIT 50", id, id); }
  List<Map<String,Object>> cacheClinica(String id) { return jdbc.queryForList("SELECT p.id_paciente_regional, p.cedula, p.nombres || ' ' || p.apellidos paciente, p.sede, COUNT(DISTINCT c.consulta_origen_id) total_consultas, COUNT(DISTINCT l.laboratorio_origen_id) total_laboratorios, COUNT(DISTINCT i.imagen_origen_id) total_imagenologia FROM repositorio_pacientes p LEFT JOIN repositorio_consultas c ON c.id_paciente_regional=p.id_paciente_regional LEFT JOIN repositorio_laboratorio_solicitudes l ON l.id_paciente_regional=p.id_paciente_regional LEFT JOIN repositorio_imagenologia_solicitudes i ON i.id_paciente_regional=p.id_paciente_regional WHERE p.id_paciente_regional=? GROUP BY p.id_paciente_regional", id); }
  List<Map<String,Object>> auditorias(String authorization) { try { Object body = rest.get().uri(auth + "/auditorias").header(HttpHeaders.AUTHORIZATION, authorization).retrieve().body(Object.class); return body instanceof List<?> list ? list.stream().map(this::comoMapa).toList() : List.of(); } catch (Exception ignored) { return List.of(); } }
  List<Map<String,Object>> pacientesRegionales(String authorization) { Object body = rest.get().uri(pacientes + "/pacientes").header(HttpHeaders.AUTHORIZATION, authorization).retrieve().body(Object.class); return body instanceof List<?> list ? list.stream().map(this::comoMapa).filter(m -> !m.isEmpty()).toList() : List.of(); }
  Map<String,Object> pacienteCache(String paciente) { return jdbc.queryForList("SELECT * FROM repositorio_pacientes WHERE id_paciente_regional=? OR cedula=? LIMIT 1", paciente, paciente).stream().findFirst().orElse(new LinkedHashMap<>()); }
  List<String> identificadoresPaciente(String id) { LinkedHashSet<String> ids = new LinkedHashSet<>(); if (id == null || id.isBlank()) return List.of(); String limpio = id.trim(); ids.add(limpio); if (limpio.toUpperCase(Locale.ROOT).startsWith("PAC")) { String digitos = limpio.replaceAll("\\D", ""); if (!digitos.isBlank()) { int n = Integer.parseInt(digitos); ids.add("PAC" + String.format("%09d", n)); ids.add("PAC-" + String.format("%07d", n)); ids.add("PAC" + String.format("%07d", n)); } } return new ArrayList<>(ids); }
  Map<String,Object> comoMapa(Object value) { if (!(value instanceof Map<?,?> map)) return new LinkedHashMap<>(); Map<String,Object> salida = new LinkedHashMap<>(); map.forEach((k,v) -> salida.put(String.valueOf(k), v)); return salida; }
  List<?> comoLista(Object value) { return value instanceof List<?> list ? list : List.of(); }
  String valor(Map<String,Object> map, String campo) { Object value = map.get(campo); return value == null ? "" : String.valueOf(value).trim(); }
  String jsonValue(String object, String key) { java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"" + key + "\"\\s*:\\s*(\"([^\"]*)\"|([^,]+))").matcher(object); return m.find() ? (m.group(2) != null ? m.group(2).trim() : m.group(3).replace("\"", "").trim()) : ""; }
  String codigo(String diagnostico) { String[] p = diagnostico.split(" - ", 2); return p.length == 2 ? p[0].trim() : ""; }
  String descripcion(String diagnostico) { String[] p = diagnostico.split(" - ", 2); return p.length == 2 ? p[1].trim() : diagnostico; }
  String primer(String... values) { for (String v : values) if (v != null && !v.isBlank()) return v; return ""; }
  String nombreArchivo(String url) { int i = url.lastIndexOf('/'); return i >= 0 ? url.substring(i + 1) : url; }
}
