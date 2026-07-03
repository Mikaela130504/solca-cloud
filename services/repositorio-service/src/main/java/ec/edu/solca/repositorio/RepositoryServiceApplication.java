package ec.edu.solca.repositorio;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import java.util.*;

@SpringBootApplication(scanBasePackages = "ec.edu.solca")
public class RepositoryServiceApplication {
  public static void main(String[] args) { SpringApplication.run(RepositoryServiceApplication.class, args); }
}

@RestController
@RequestMapping("/repositorio-clinico")
class RepositorioController {
  private final RepositorioService service;
  RepositorioController(RepositorioService service) { this.service = service; }
  @GetMapping @PreAuthorize("hasAnyRole('ADMIN','MEDICO','LABORATORIO')") Map<String,Object> vacio() { return Map.of("mensaje", "Ingrese un identificador regional o cédula para consultar el repositorio clínico."); }
  @GetMapping("/{paciente}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO','LABORATORIO')") Map<String,Object> consultar(@PathVariable("paciente") String paciente, @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) { return service.consultar(paciente, authorization); }
}

@RestController
@RequestMapping("/repositorio")
class RepositorioAvanceController {
  private final RepositorioService service;
  RepositorioAvanceController(RepositorioService service) { this.service = service; }
  @GetMapping("/paciente/{idPacienteRegional}") @PreAuthorize("hasAnyRole('ADMIN','MEDICO','LABORATORIO')") Map<String,Object> consultarPaciente(@PathVariable("idPacienteRegional") String idPacienteRegional, @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) { return service.consultarAvance(idPacienteRegional, authorization); }
}

@org.springframework.stereotype.Service
class RepositorioService {
  private final RestClient rest = RestClient.builder().build();
  @Value("${service.pacientes:http://localhost:8001}") String pacientes;
  @Value("${service.consultas:http://localhost:8002}") String consultas;
  @Value("${service.laboratorios:http://localhost:8003}") String laboratorios;
  @Value("${service.imagenologia:http://localhost:8004}") String imagenologia;

  Map<String,Object> consultar(String paciente, String authorization) {
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
    return respuesta;
  }

  Map<String,Object> consultarAvance(String paciente, String authorization) {
    Map<String,Object> base = consultar(paciente, authorization);
    Map<String,Object> respuesta = new LinkedHashMap<>();
    respuesta.put("paciente", base.get("paciente"));
    respuesta.put("consultas", base.get("consultas"));
    respuesta.put("laboratorio", base.get("laboratorios"));
    respuesta.put("imagenes", base.get("imagenologia"));
    respuesta.put("serviciosNoDisponibles", base.get("serviciosNoDisponibles"));
    return respuesta;
  }

  Object llamar(String url, String authorization, List<String> noDisponibles, String nombre, Object fallback) {
    try {
      return rest.get().uri(url).header(HttpHeaders.AUTHORIZATION, authorization).retrieve().body(Object.class);
    } catch (HttpClientErrorException.NotFound ex) {
      return fallback;
    } catch (Exception ex) {
      noDisponibles.add(nombre);
      return fallback;
    }
  }
}
