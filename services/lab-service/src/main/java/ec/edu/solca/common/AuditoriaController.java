package ec.edu.solca.common;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auditorias")
public class AuditoriaController {
  private final JdbcTemplate jdbc;

  public AuditoriaController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public List<Map<String,Object>> listar() {
    Auditoria.crearTabla(jdbc);
    return jdbc.queryForList("SELECT usuario, rol, fecha_hora, accion, paciente, endpoint, ip, modulo, resultado, metodo_http, estado_http, tiempo_respuesta_ms, mensaje FROM auditorias ORDER BY id DESC LIMIT 100");
  }
}
