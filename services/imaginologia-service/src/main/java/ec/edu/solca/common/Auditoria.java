package ec.edu.solca.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import java.time.LocalDateTime;

public class Auditoria {
  public static void crearTabla(JdbcTemplate jdbc) {
    jdbc.execute("CREATE TABLE IF NOT EXISTS auditorias (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario TEXT NOT NULL, fecha_hora TEXT NOT NULL, accion TEXT NOT NULL, paciente TEXT, endpoint TEXT NOT NULL)");
  }

  public static void registrar(JdbcTemplate jdbc, String accion, String paciente, HttpServletRequest request) {
    String usuario = SecurityContextHolder.getContext().getAuthentication() == null ? "sistema" : SecurityContextHolder.getContext().getAuthentication().getName();
    jdbc.update("INSERT INTO auditorias(usuario, fecha_hora, accion, paciente, endpoint) VALUES (?,?,?,?,?)", usuario, LocalDateTime.now().toString(), accion, paciente, request.getMethod() + " " + request.getRequestURI());
  }
}
