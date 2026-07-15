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
