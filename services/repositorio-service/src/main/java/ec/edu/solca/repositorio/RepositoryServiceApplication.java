package ec.edu.solca.repositorio;

import ec.edu.solca.common.Auditoria;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.*;
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
  @GetMapping("/{paciente}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") Map<String,Object> consultar(@PathVariable("paciente") String paciente, @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization, HttpServletRequest http) { return service.consultar(paciente, authorization, http); }
  @GetMapping("/auditorias") @PreAuthorize("hasRole('ADMIN')") List<Map<String,Object>> auditorias(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) { return service.auditorias(authorization); }
  @GetMapping("/estado-servicios") @PreAuthorize("hasRole('ADMIN')") List<Map<String,Object>> estadoServicios() { return service.estadoServicios(); }
  @GetMapping("/logs-integracion") @PreAuthorize("hasRole('ADMIN')") List<Map<String,Object>> logsIntegracion() { return service.logsIntegracion(); }
}

@RestController
@RequestMapping("/repositorio")
class RepositorioAvanceController {
  private final RepositorioService service;
  RepositorioAvanceController(RepositorioService service) { this.service = service; }
  @GetMapping("/paciente/{idPacienteRegional}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO')") Map<String,Object> consultarPaciente(@PathVariable("idPacienteRegional") String idPacienteRegional, @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization, HttpServletRequest http) { return service.consultarAvance(idPacienteRegional, authorization, http); }
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
    jdbc.execute("CREATE TABLE IF NOT EXISTS historial_consultas_repositorio (id INTEGER PRIMARY KEY AUTOINCREMENT, paciente TEXT NOT NULL, id_paciente_regional TEXT, usuario TEXT, fecha_hora TEXT NOT NULL, resultado TEXT NOT NULL, servicios_no_disponibles TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS estado_servicios (id INTEGER PRIMARY KEY AUTOINCREMENT, servicio TEXT NOT NULL UNIQUE, estado TEXT NOT NULL, ultima_revision TEXT NOT NULL, mensaje TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS logs_integracion (id INTEGER PRIMARY KEY AUTOINCREMENT, servicio TEXT NOT NULL, endpoint TEXT NOT NULL, fecha_hora TEXT NOT NULL, resultado TEXT NOT NULL, tiempo_respuesta_ms INTEGER, mensaje TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS cache_clinica (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT NOT NULL UNIQUE, fecha_hora TEXT NOT NULL, paciente TEXT, cedula TEXT, sede TEXT, diagnostico_principal TEXT, total_consultas INTEGER DEFAULT 0, total_laboratorios INTEGER DEFAULT 0, total_imagenologia INTEGER DEFAULT 0, servicios_no_disponibles TEXT, resumen TEXT NOT NULL)");
    agregarColumna("cache_clinica", "paciente", "TEXT");
    agregarColumna("cache_clinica", "cedula", "TEXT");
    agregarColumna("cache_clinica", "sede", "TEXT");
    agregarColumna("cache_clinica", "diagnostico_principal", "TEXT");
    agregarColumna("cache_clinica", "total_consultas", "INTEGER DEFAULT 0");
    agregarColumna("cache_clinica", "total_laboratorios", "INTEGER DEFAULT 0");
    agregarColumna("cache_clinica", "total_imagenologia", "INTEGER DEFAULT 0");
    agregarColumna("cache_clinica", "servicios_no_disponibles", "TEXT");
    jdbc.execute("CREATE TABLE IF NOT EXISTS repositorio_clinico (id INTEGER PRIMARY KEY AUTOINCREMENT, tipo_registro TEXT NOT NULL, id_paciente_regional TEXT, registro_origen_id TEXT, consulta_id TEXT, cedula TEXT, nombres TEXT, apellidos TEXT, fecha_nacimiento TEXT, edad TEXT, sexo TEXT, estado_civil TEXT, direccion TEXT, provincia TEXT, ciudad TEXT, telefono TEXT, correo TEXT, contacto_emergencia TEXT, seguro TEXT, tipo_sangre TEXT, nacionalidad TEXT, fecha TEXT, sede TEXT, medico TEXT, especialidad TEXT, tipo_consulta TEXT, diagnostico TEXT, tratamiento TEXT, motivo TEXT, evolucion TEXT, resultado TEXT, observaciones TEXT, antecedentes_familiares TEXT, antecedentes_personales TEXT, cirugias TEXT, gineco_embarazos TEXT, gineco_partos TEXT, gineco_cesareas TEXT, gineco_abortos TEXT, gineco_observaciones TEXT, medicamentos_actuales TEXT, alergias TEXT, examen_general TEXT, examen_cabeza_cuello TEXT, examen_torax TEXT, examen_abdomen TEXT, examen_extremidades TEXT, examen_neurologico TEXT, peso TEXT, talla TEXT, imc TEXT, temperatura TEXT, presion_arterial TEXT, frecuencia_cardiaca TEXT, frecuencia_respiratoria TEXT, saturacion_oxigeno TEXT, medicacion TEXT, proximo_control TEXT, tipo_examen TEXT, estado TEXT, prioridad TEXT, tecnologo_responsable TEXT, fecha_solicitud TEXT, fecha_resultado TEXT, valores TEXT, unidad TEXT, valor_referencia TEXT, interpretacion TEXT, codigo_muestra TEXT, resultado_critico TEXT, hora_resultado TEXT, fecha_validacion TEXT, usuario_valido TEXT, observaciones_laboratorio TEXT, tipo_estudio TEXT, formato TEXT, url TEXT, region_anatomica TEXT, tecnico_responsable TEXT, hora TEXT, fecha_realizacion TEXT, observaciones_imagenologo TEXT, hallazgos TEXT, recomendaciones TEXT, fecha_sincronizacion TEXT)");
    jdbc.execute("CREATE INDEX IF NOT EXISTS idx_repositorio_clinico_regional ON repositorio_clinico(id_paciente_regional)");
    jdbc.execute("CREATE INDEX IF NOT EXISTS idx_repositorio_clinico_tipo ON repositorio_clinico(tipo_registro)");
    jdbc.execute("DROP TABLE IF EXISTS repositorio_pacientes");
    jdbc.execute("DROP TABLE IF EXISTS repositorio_consultas");
    jdbc.execute("DROP TABLE IF EXISTS repositorio_laboratorios");
    jdbc.execute("DROP TABLE IF EXISTS repositorio_imagenologia");
    jdbc.execute("CREATE TABLE IF NOT EXISTS configuracion_repositorio (clave TEXT PRIMARY KEY, valor TEXT NOT NULL)");
  }

  void agregarColumna(String tabla, String columna, String definicion) {
    try { jdbc.execute("ALTER TABLE " + tabla + " ADD COLUMN " + columna + " " + definicion); } catch (Exception ignored) {}
  }

  Map<String,Object> consultar(String paciente, String authorization, HttpServletRequest http) {
    Map<String,Object> respuesta = new LinkedHashMap<>();
    List<String> noDisponibles = new ArrayList<>();
    Object pacienteDto = buscarPaciente(paciente, authorization, noDisponibles);
    String idRegional = paciente;
    if (pacienteDto instanceof Map<?,?> map && map.get("idPacienteRegional") != null) idRegional = String.valueOf(map.get("idPacienteRegional"));
    respuesta.put("paciente", pacienteDto);
    List<String> identificadores = identificadoresPaciente(idRegional);
    Object consultasPaciente = buscarRegistros(consultas + "/consultas/paciente/", identificadores, authorization, noDisponibles, "Consulta Clínica");
    Object laboratoriosPaciente = buscarRegistros(laboratorios + "/laboratorios/paciente/", identificadores, authorization, noDisponibles, "Laboratorio Clínico");
    Object imagenologiaPaciente = buscarRegistros(imagenologia + "/imagenologia/paciente/", identificadores, authorization, noDisponibles, "Imagenología");
    respuesta.put("consultas", consultasPaciente);
    respuesta.put("laboratorios", consolidarConConsulta(laboratoriosPaciente, consultasPaciente));
    respuesta.put("imagenologia", consolidarConConsulta(imagenologiaPaciente, consultasPaciente));
    respuesta.put("serviciosNoDisponibles", noDisponibles);
    guardarHistorial(paciente, idRegional, noDisponibles, http);
    guardarCache(idRegional, respuesta);
    respuesta.put("estadoServicios", estadoServicios());
    respuesta.put("logsIntegracion", logsIntegracion());
    respuesta.put("historialConsultasRepositorio", historialConsultas(idRegional));
    respuesta.put("cacheClinica", cacheClinica(idRegional));
    Auditoria.registrar(jdbc, "CONSULTA_REPOSITORIO", idRegional, http);
    return respuesta;
  }

  Map<String,Object> consultarAvance(String paciente, String authorization, HttpServletRequest http) {
    Map<String,Object> base = consultar(paciente, authorization, http);
    Map<String,Object> respuesta = new LinkedHashMap<>();
    respuesta.put("paciente", base.get("paciente"));
    respuesta.put("consultas", base.get("consultas"));
    respuesta.put("laboratorio", base.get("laboratorios"));
    respuesta.put("imagenes", base.get("imagenologia"));
    respuesta.put("serviciosNoDisponibles", base.get("serviciosNoDisponibles"));
    return respuesta;
  }

  Object llamar(String url, String authorization, List<String> noDisponibles, String nombre, Object fallback) {
    long inicio = System.currentTimeMillis();
    try {
      Object body = rest.get().uri(url).header(HttpHeaders.AUTHORIZATION, authorization).retrieve().body(Object.class);
      registrarServicio(nombre, "DISPONIBLE", url, "OK", System.currentTimeMillis() - inicio, "Respuesta recibida");
      return body;
    } catch (HttpClientErrorException.NotFound ex) {
      registrarServicio(nombre, "DISPONIBLE", url, "SIN_DATOS", System.currentTimeMillis() - inicio, "Sin registros para el paciente");
      return fallback;
    } catch (Exception ex) {
      noDisponibles.add(nombre);
      registrarServicio(nombre, "NO_DISPONIBLE", url, "ERROR", System.currentTimeMillis() - inicio, ex.getMessage());
      return fallback;
    }
  }

  Object buscarPaciente(String paciente, String authorization, List<String> noDisponibles) {
    if (paciente.matches("\\d{10}")) {
      return llamar(pacientes + "/pacientes/cedula/" + paciente, authorization, noDisponibles, "Paciente Maestro Regional", new LinkedHashMap<>());
    }
    for (String id : identificadoresPaciente(paciente)) {
      Object respuesta = llamar(pacientes + "/pacientes/" + id, authorization, noDisponibles, "Paciente Maestro Regional", new LinkedHashMap<>());
      if (respuesta instanceof Map<?,?> map && !map.isEmpty()) return respuesta;
    }
    return new LinkedHashMap<>();
  }

  Object buscarRegistros(String endpoint, List<String> identificadores, String authorization, List<String> noDisponibles, String nombre) {
    for (String id : identificadores) {
      Object respuesta = llamar(endpoint + id, authorization, noDisponibles, nombre, List.of());
      if (respuesta instanceof List<?> list && !list.isEmpty()) return respuesta;
    }
    return List.of();
  }

  List<String> identificadoresPaciente(String id) {
    LinkedHashSet<String> ids = new LinkedHashSet<>();
    if (id == null || id.isBlank()) return List.of();
    String limpio = id.trim();
    ids.add(limpio);
    if (limpio.toUpperCase(Locale.ROOT).startsWith("PAC")) {
      String digitos = limpio.replaceAll("\\D", "");
      if (!digitos.isBlank()) {
        try {
          int numero = Integer.parseInt(digitos);
          ids.add("PAC" + String.format("%09d", numero));
          ids.add("PAC-" + String.format("%07d", numero));
          ids.add("PAC" + String.format("%07d", numero));
        } catch (NumberFormatException ignored) {}
      }
    }
    return new ArrayList<>(ids);
  }

  Object consolidarConConsulta(Object registros, Object consultasPaciente) {
    if (!(registros instanceof List<?> rows) || !(consultasPaciente instanceof List<?> consultasRows)) return registros;
    Map<Long, Map<String,Object>> consultasPorId = new HashMap<>();
    for (Object item : consultasRows) {
      if (item instanceof Map<?,?> map && map.get("id") != null) {
        try {
          Map<String,Object> consulta = new LinkedHashMap<>();
          map.forEach((key, value) -> consulta.put(String.valueOf(key), value));
          consultasPorId.put(Long.valueOf(String.valueOf(map.get("id"))), consulta);
        } catch (NumberFormatException ignored) {}
      }
    }
    List<Map<String,Object>> salida = new ArrayList<>();
    for (Object item : rows) {
      if (!(item instanceof Map<?,?> map)) continue;
      Map<String,Object> row = new LinkedHashMap<>();
      map.forEach((key, value) -> row.put(String.valueOf(key), value));
      Object consultaId = row.get("consultaId");
      if (consultaId != null) {
        try {
          Map<String,Object> consulta = consultasPorId.get(Long.valueOf(String.valueOf(consultaId)));
          if (consulta != null) {
            heredar(row, consulta, "sede");
            heredar(row, consulta, "medico");
            heredar(row, consulta, "especialidad");
            heredar(row, consulta, "tipoConsulta");
            heredar(row, consulta, "fecha");
            heredar(row, consulta, "diagnostico");
          }
        } catch (NumberFormatException ignored) {}
      }
      salida.add(row);
    }
    return salida;
  }

  void heredar(Map<String,Object> destino, Map<String,Object> consulta, String campo) {
    Object value = consulta.get(campo);
    if (value != null && !String.valueOf(value).isBlank()) destino.put(campo, value);
  }

  List<Map<String,Object>> auditorias(String authorization) {
    return auditoriasServicio(auth, authorization);
  }

  List<Map<String,Object>> auditoriasServicio(String baseUrl, String authorization) {
    try {
      Object body = rest.get().uri(baseUrl + "/auditorias").header(HttpHeaders.AUTHORIZATION, authorization).retrieve().body(Object.class);
      if (body instanceof List<?> list) {
        List<Map<String,Object>> salida = new ArrayList<>();
        for (Object item : list) {
          if (item instanceof Map<?,?> map) {
            Map<String,Object> row = new LinkedHashMap<>();
            map.forEach((key, value) -> row.put(String.valueOf(key), value));
            salida.add(row);
          }
        }
        return salida;
      }
    } catch (Exception ignored) {}
    return List.of();
  }

  List<Map<String,Object>> estadoServicios() {
    return jdbc.queryForList("SELECT servicio, estado, ultima_revision, mensaje FROM estado_servicios ORDER BY servicio");
  }

  List<Map<String,Object>> logsIntegracion() {
    return jdbc.queryForList("SELECT servicio, endpoint, fecha_hora, resultado, tiempo_respuesta_ms, mensaje FROM logs_integracion ORDER BY id DESC LIMIT 100");
  }

  List<Map<String,Object>> historialConsultas(String idRegional) {
    return jdbc.queryForList("SELECT paciente, id_paciente_regional, usuario, fecha_hora, resultado, servicios_no_disponibles FROM historial_consultas_repositorio WHERE id_paciente_regional=? OR paciente=? ORDER BY id DESC LIMIT 50", idRegional, idRegional);
  }

  List<Map<String,Object>> cacheClinica(String idRegional) {
    return jdbc.queryForList("SELECT id_paciente_regional, fecha_hora, paciente, cedula, sede, diagnostico_principal, total_consultas, total_laboratorios, total_imagenologia, servicios_no_disponibles, resumen FROM cache_clinica WHERE id_paciente_regional=? ORDER BY id DESC LIMIT 10", idRegional);
  }

  void registrarServicio(String servicio, String estado, String endpoint, String resultado, long tiempoMs, String mensaje) {
    String ahora = LocalDateTime.now().toString();
    jdbc.update("INSERT INTO logs_integracion(servicio, endpoint, fecha_hora, resultado, tiempo_respuesta_ms, mensaje) VALUES (?,?,?,?,?,?)", servicio, endpoint, ahora, resultado, tiempoMs, mensaje);
    jdbc.update("INSERT INTO estado_servicios(servicio, estado, ultima_revision, mensaje) VALUES (?,?,?,?) ON CONFLICT(servicio) DO UPDATE SET estado=excluded.estado, ultima_revision=excluded.ultima_revision, mensaje=excluded.mensaje", servicio, estado, ahora, mensaje);
  }

  void guardarHistorial(String paciente, String idRegional, List<String> noDisponibles, HttpServletRequest http) {
    String usuario = http.getUserPrincipal() == null ? "sistema" : http.getUserPrincipal().getName();
    jdbc.update("INSERT INTO historial_consultas_repositorio(paciente, id_paciente_regional, usuario, fecha_hora, resultado, servicios_no_disponibles) VALUES (?,?,?,?,?,?)", paciente, idRegional, usuario, LocalDateTime.now().toString(), noDisponibles.isEmpty() ? "COMPLETO" : "PARCIAL", String.join(", ", noDisponibles));
  }

  void guardarCache(String idRegional, Map<String,Object> respuesta) {
    Map<String,Object> paciente = comoMapa(respuesta.get("paciente"));
    List<?> consultas = comoLista(respuesta.get("consultas"));
    List<?> laboratorios = comoLista(respuesta.get("laboratorios"));
    List<?> imagenologia = comoLista(respuesta.get("imagenologia"));
    List<?> noDisponibles = comoLista(respuesta.get("serviciosNoDisponibles"));
    String nombrePaciente = nombrePaciente(paciente, idRegional);
    String cedula = valor(paciente, "cedula");
    String sede = primerValorNoVacio(valor(paciente, "sede"), primerCampo(consultas, "sede"), primerCampo(laboratorios, "sede"), primerCampo(imagenologia, "sede"));
    String diagnostico = primerValorNoVacio(primerCampo(consultas, "diagnostico"), primerCampo(laboratorios, "diagnostico"), primerCampo(imagenologia, "diagnostico"));
    String servicios = String.join(", ", noDisponibles.stream().map(String::valueOf).filter(v -> !v.isBlank()).toList());
    String resumen = "Paciente " + nombrePaciente + " con " + consultas.size() + " consultas, " + laboratorios.size() + " laboratorios y " + imagenologia.size() + " estudios de imagen.";
    jdbc.update("""
      INSERT INTO cache_clinica(id_paciente_regional, fecha_hora, paciente, cedula, sede, diagnostico_principal, total_consultas, total_laboratorios, total_imagenologia, servicios_no_disponibles, resumen)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id_paciente_regional) DO UPDATE SET
        fecha_hora=excluded.fecha_hora,
        paciente=excluded.paciente,
        cedula=excluded.cedula,
        sede=excluded.sede,
        diagnostico_principal=excluded.diagnostico_principal,
        total_consultas=excluded.total_consultas,
        total_laboratorios=excluded.total_laboratorios,
        total_imagenologia=excluded.total_imagenologia,
        servicios_no_disponibles=excluded.servicios_no_disponibles,
        resumen=excluded.resumen
      """, idRegional, LocalDateTime.now().toString(), nombrePaciente, cedula, sede, diagnostico, consultas.size(), laboratorios.size(), imagenologia.size(), servicios, resumen);
    guardarRepositorioCentral(idRegional, paciente, consultas, laboratorios, imagenologia);
  }

  void guardarRepositorioCentral(String idRegional, Map<String,Object> paciente, List<?> consultas, List<?> laboratorios, List<?> imagenologia) {
    jdbc.update("DELETE FROM repositorio_clinico WHERE id_paciente_regional=?", idRegional);
    String ahora = LocalDateTime.now().toString();
    if (!paciente.isEmpty()) {
      Map<String,Object> row = baseRepositorio("PACIENTE", idRegional, ahora);
      row.put("cedula", valor(paciente, "cedula"));
      row.put("nombres", valor(paciente, "nombres"));
      row.put("apellidos", valor(paciente, "apellidos"));
      row.put("fecha_nacimiento", valor(paciente, "fechaNacimiento"));
      row.put("edad", valor(paciente, "edad"));
      row.put("sexo", valor(paciente, "sexo"));
      row.put("estado_civil", valor(paciente, "estadoCivil"));
      row.put("direccion", valor(paciente, "direccion"));
      row.put("provincia", valor(paciente, "provincia"));
      row.put("ciudad", valor(paciente, "ciudad"));
      row.put("telefono", valor(paciente, "telefono"));
      row.put("correo", valor(paciente, "correo"));
      row.put("contacto_emergencia", valor(paciente, "contactoEmergencia"));
      row.put("seguro", valor(paciente, "seguro"));
      row.put("tipo_sangre", valor(paciente, "tipoSangre"));
      row.put("nacionalidad", valor(paciente, "nacionalidad"));
      row.put("observaciones", valor(paciente, "observaciones"));
      row.put("sede", valor(paciente, "sede"));
      insertarRepositorio(row);
    }
    for (Object item : consultas) {
      Map<String,Object> row = comoMapa(item);
      Map<String,Object> central = baseRepositorio("CONSULTA", idRegional, ahora);
      central.put("registro_origen_id", valor(row, "id"));
      central.put("consulta_id", valor(row, "id"));
      central.put("cedula", valor(row, "cedula"));
      central.put("fecha", valor(row, "fecha"));
      central.put("sede", valor(row, "sede"));
      central.put("medico", valor(row, "medico"));
      central.put("especialidad", valor(row, "especialidad"));
      central.put("tipo_consulta", valor(row, "tipoConsulta"));
      central.put("diagnostico", valor(row, "diagnostico"));
      central.put("tratamiento", valor(row, "tratamiento"));
      central.put("motivo", valor(row, "motivo"));
      central.put("evolucion", valor(row, "evolucion"));
      central.put("resultado", valor(row, "resultado"));
      central.put("observaciones", valor(row, "observaciones"));
      central.put("antecedentes_familiares", valor(row, "antecedentesFamiliares"));
      central.put("antecedentes_personales", valor(row, "antecedentesPersonales"));
      central.put("cirugias", valor(row, "cirugias"));
      central.put("gineco_embarazos", valor(row, "ginecoEmbarazos"));
      central.put("gineco_partos", valor(row, "ginecoPartos"));
      central.put("gineco_cesareas", valor(row, "ginecoCesareas"));
      central.put("gineco_abortos", valor(row, "ginecoAbortos"));
      central.put("gineco_observaciones", valor(row, "ginecoObservaciones"));
      central.put("medicamentos_actuales", valor(row, "medicamentosActuales"));
      central.put("alergias", valor(row, "alergias"));
      central.put("examen_general", valor(row, "examenGeneral"));
      central.put("examen_cabeza_cuello", valor(row, "examenCabezaCuello"));
      central.put("examen_torax", valor(row, "examenTorax"));
      central.put("examen_abdomen", valor(row, "examenAbdomen"));
      central.put("examen_extremidades", valor(row, "examenExtremidades"));
      central.put("examen_neurologico", valor(row, "examenNeurologico"));
      central.put("peso", valor(row, "peso"));
      central.put("talla", valor(row, "talla"));
      central.put("imc", valor(row, "imc"));
      central.put("temperatura", valor(row, "temperatura"));
      central.put("presion_arterial", valor(row, "presionArterial"));
      central.put("frecuencia_cardiaca", valor(row, "frecuenciaCardiaca"));
      central.put("frecuencia_respiratoria", valor(row, "frecuenciaRespiratoria"));
      central.put("saturacion_oxigeno", valor(row, "saturacionOxigeno"));
      central.put("medicacion", valor(row, "medicacion"));
      central.put("proximo_control", valor(row, "proximoControl"));
      insertarRepositorio(central);
    }
    for (Object item : laboratorios) {
      Map<String,Object> row = comoMapa(item);
      Map<String,Object> central = baseRepositorio("LABORATORIO", idRegional, ahora);
      central.put("registro_origen_id", valor(row, "id"));
      central.put("consulta_id", valor(row, "consultaId"));
      central.put("cedula", valor(row, "cedula"));
      central.put("fecha", valor(row, "fecha"));
      central.put("sede", valor(row, "sede"));
      central.put("medico", valor(row, "medico"));
      central.put("especialidad", valor(row, "especialidad"));
      central.put("tipo_consulta", valor(row, "tipoConsulta"));
      central.put("diagnostico", valor(row, "diagnostico"));
      central.put("tratamiento", valor(row, "tratamiento"));
      central.put("motivo", valor(row, "motivo"));
      central.put("evolucion", valor(row, "evolucion"));
      central.put("tipo_examen", valor(row, "tipoExamen"));
      central.put("resultado", valor(row, "resultado"));
      central.put("observaciones", valor(row, "observaciones"));
      central.put("estado", valor(row, "estado"));
      central.put("prioridad", valor(row, "prioridad"));
      central.put("tecnologo_responsable", valor(row, "tecnologoResponsable"));
      central.put("fecha_solicitud", valor(row, "fechaSolicitud"));
      central.put("fecha_resultado", valor(row, "fechaResultado"));
      central.put("valores", valor(row, "valores"));
      central.put("unidad", valor(row, "unidad"));
      central.put("valor_referencia", valor(row, "valorReferencia"));
      central.put("interpretacion", valor(row, "interpretacion"));
      central.put("codigo_muestra", valor(row, "codigoMuestra"));
      central.put("resultado_critico", valor(row, "resultadoCritico"));
      central.put("hora_resultado", valor(row, "horaResultado"));
      central.put("fecha_validacion", valor(row, "fechaValidacion"));
      central.put("usuario_valido", valor(row, "usuarioValido"));
      central.put("observaciones_laboratorio", valor(row, "observacionesLaboratorio"));
      insertarRepositorio(central);
    }
    for (Object item : imagenologia) {
      Map<String,Object> row = comoMapa(item);
      Map<String,Object> central = baseRepositorio("IMAGENOLOGIA", idRegional, ahora);
      central.put("registro_origen_id", valor(row, "id"));
      central.put("consulta_id", valor(row, "consultaId"));
      central.put("cedula", valor(row, "cedula"));
      central.put("fecha", valor(row, "fecha"));
      central.put("sede", valor(row, "sede"));
      central.put("medico", valor(row, "medico"));
      central.put("especialidad", valor(row, "especialidad"));
      central.put("tipo_consulta", valor(row, "tipoConsulta"));
      central.put("diagnostico", valor(row, "diagnostico"));
      central.put("resultado", valor(row, "resultado"));
      central.put("observaciones", valor(row, "observaciones"));
      central.put("tipo_estudio", valor(row, "tipoEstudio"));
      central.put("formato", valor(row, "formato"));
      central.put("url", valor(row, "url"));
      central.put("region_anatomica", valor(row, "regionAnatomica"));
      central.put("estado", valor(row, "estado"));
      central.put("prioridad", valor(row, "prioridad"));
      central.put("tecnico_responsable", valor(row, "tecnicoResponsable"));
      central.put("hora", valor(row, "hora"));
      central.put("fecha_solicitud", valor(row, "fechaSolicitud"));
      central.put("fecha_realizacion", valor(row, "fechaRealizacion"));
      central.put("observaciones_imagenologo", valor(row, "observacionesImagenologo"));
      central.put("hallazgos", valor(row, "hallazgos"));
      central.put("recomendaciones", primerValorNoVacio(valor(row, "recomendaciones"), "No registradas"));
      insertarRepositorio(central);
    }
  }

  Map<String,Object> baseRepositorio(String tipo, String idRegional, String ahora) {
    Map<String,Object> row = new LinkedHashMap<>();
    row.put("tipo_registro", tipo);
    row.put("id_paciente_regional", idRegional);
    row.put("fecha_sincronizacion", ahora);
    return row;
  }

  void insertarRepositorio(Map<String,Object> valores) {
    List<String> columnas = new ArrayList<>(valores.keySet());
    String placeholders = String.join(",", Collections.nCopies(columnas.size(), "?"));
    Object[] args = columnas.stream().map(valores::get).toArray();
    jdbc.update("INSERT INTO repositorio_clinico(" + String.join(",", columnas) + ") VALUES (" + placeholders + ")", args);
  }

  Map<String,Object> comoMapa(Object value) {
    if (!(value instanceof Map<?,?> map)) return new LinkedHashMap<>();
    Map<String,Object> salida = new LinkedHashMap<>();
    map.forEach((key, item) -> salida.put(String.valueOf(key), item));
    return salida;
  }

  List<?> comoLista(Object value) {
    return value instanceof List<?> list ? list : List.of();
  }

  String nombrePaciente(Map<String,Object> paciente, String idRegional) {
    String nombres = valor(paciente, "nombres");
    String apellidos = valor(paciente, "apellidos");
    String completo = (nombres + " " + apellidos).trim();
    return completo.isBlank() ? idRegional : completo;
  }

  String valor(Map<String,Object> map, String campo) {
    Object value = map.get(campo);
    return value == null ? "" : String.valueOf(value).trim();
  }

  String primerCampo(List<?> rows, String campo) {
    for (Object row : rows) {
      Map<String,Object> map = comoMapa(row);
      String value = valor(map, campo);
      if (!value.isBlank()) return value;
    }
    return "";
  }

  String primerValorNoVacio(String... values) {
    for (String value : values) {
      if (value != null && !value.isBlank()) return value;
    }
    return "";
  }
}
