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
  @GetMapping("/auditorias") @PreAuthorize("hasRole('ADMIN')") List<Map<String,Object>> auditorias() { return service.auditorias(); }
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
  @Value("${service.consultas:http://localhost:8002}") String consultas;
  @Value("${service.laboratorios:http://localhost:8003}") String laboratorios;
  @Value("${service.imagenologia:http://localhost:8004}") String imagenologia;

  RepositorioService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

  void schema() {
    Auditoria.crearTabla(jdbc);
    jdbc.execute("CREATE TABLE IF NOT EXISTS historial_consultas_repositorio (id INTEGER PRIMARY KEY AUTOINCREMENT, paciente TEXT NOT NULL, id_paciente_regional TEXT, usuario TEXT, fecha_hora TEXT NOT NULL, resultado TEXT NOT NULL, servicios_no_disponibles TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS estado_servicios (id INTEGER PRIMARY KEY AUTOINCREMENT, servicio TEXT NOT NULL UNIQUE, estado TEXT NOT NULL, ultima_revision TEXT NOT NULL, mensaje TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS logs_integracion (id INTEGER PRIMARY KEY AUTOINCREMENT, servicio TEXT NOT NULL, endpoint TEXT NOT NULL, fecha_hora TEXT NOT NULL, resultado TEXT NOT NULL, tiempo_respuesta_ms INTEGER, mensaje TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS cache_clinica (id INTEGER PRIMARY KEY AUTOINCREMENT, id_paciente_regional TEXT NOT NULL UNIQUE, fecha_hora TEXT NOT NULL, resumen TEXT NOT NULL)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS configuracion_repositorio (clave TEXT PRIMARY KEY, valor TEXT NOT NULL)");
  }

  Map<String,Object> consultar(String paciente, String authorization, HttpServletRequest http) {
    Map<String,Object> respuesta = new LinkedHashMap<>();
    List<String> noDisponibles = new ArrayList<>();
    Object pacienteDto = llamar(pacientes + (paciente.matches("\\d{10}") ? "/pacientes/cedula/" : "/pacientes/") + paciente, authorization, noDisponibles, "Paciente Maestro Regional", new LinkedHashMap<>());
    String idRegional = paciente;
    if (pacienteDto instanceof Map<?,?> map && map.get("idPacienteRegional") != null) idRegional = String.valueOf(map.get("idPacienteRegional"));
    respuesta.put("paciente", pacienteDto);
    respuesta.put("consultas", llamar(consultas + "/consultas/paciente/" + idRegional, authorization, noDisponibles, "Consulta Clínica", List.of()));
    respuesta.put("laboratorios", llamar(laboratorios + "/laboratorios/paciente/" + idRegional, authorization, noDisponibles, "Laboratorio Clínico", List.of()));
    respuesta.put("imagenologia", llamar(imagenologia + "/imagenologia/paciente/" + idRegional, authorization, noDisponibles, "Imagenología", List.of()));
    respuesta.put("serviciosNoDisponibles", noDisponibles);
    guardarHistorial(paciente, idRegional, noDisponibles, http);
    guardarCache(idRegional, respuesta);
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

  List<Map<String,Object>> auditorias() {
    return jdbc.queryForList("SELECT usuario, rol, fecha_hora, accion, paciente, endpoint, ip, modulo, resultado, metodo_http, estado_http, tiempo_respuesta_ms, mensaje FROM auditorias ORDER BY id DESC LIMIT 50");
  }

  List<Map<String,Object>> estadoServicios() {
    return jdbc.queryForList("SELECT servicio, estado, ultima_revision, mensaje FROM estado_servicios ORDER BY servicio");
  }

  List<Map<String,Object>> logsIntegracion() {
    return jdbc.queryForList("SELECT servicio, endpoint, fecha_hora, resultado, tiempo_respuesta_ms, mensaje FROM logs_integracion ORDER BY id DESC LIMIT 100");
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
    jdbc.update("INSERT INTO cache_clinica(id_paciente_regional, fecha_hora, resumen) VALUES (?,?,?) ON CONFLICT(id_paciente_regional) DO UPDATE SET fecha_hora=excluded.fecha_hora, resumen=excluded.resumen", idRegional, LocalDateTime.now().toString(), respuesta.toString());
  }
}
