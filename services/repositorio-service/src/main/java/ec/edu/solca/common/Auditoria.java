package ec.edu.solca.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

public class Auditoria {
  public static void crearTabla(JdbcTemplate jdbc) {
    jdbc.execute("CREATE TABLE IF NOT EXISTS auditorias (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario TEXT NOT NULL, fecha_hora TEXT NOT NULL, accion TEXT NOT NULL, paciente TEXT, endpoint TEXT NOT NULL)");
    agregarColumna(jdbc, "rol", "TEXT");
    agregarColumna(jdbc, "ip", "TEXT");
    agregarColumna(jdbc, "modulo", "TEXT");
    agregarColumna(jdbc, "resultado", "TEXT");
    agregarColumna(jdbc, "metodo_http", "TEXT");
    agregarColumna(jdbc, "estado_http", "INTEGER");
    agregarColumna(jdbc, "tiempo_respuesta_ms", "INTEGER");
    agregarColumna(jdbc, "token_parcial", "TEXT");
    agregarColumna(jdbc, "mensaje", "TEXT");
  }

  public static void registrar(JdbcTemplate jdbc, String accion, String paciente, HttpServletRequest request) {
    String usuario = SecurityContextHolder.getContext().getAuthentication() == null ? "sistema" : SecurityContextHolder.getContext().getAuthentication().getName();
    String rol = SecurityContextHolder.getContext().getAuthentication() == null ? "SISTEMA" : SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.joining(","));
    jdbc.update("INSERT INTO auditorias(usuario, fecha_hora, accion, paciente, endpoint, rol, ip, modulo, resultado, metodo_http, estado_http, mensaje) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", usuario, LocalDateTime.now().toString(), accion, paciente, request.getMethod() + " " + request.getRequestURI(), rol, ip(request), modulo(request), "OK", request.getMethod(), 200, "Registro manual compatible");
  }

  public static void registrarAuto(JdbcTemplate jdbc, HttpServletRequest request, int status, long tiempoMs, String mensaje) {
    String usuario = SecurityContextHolder.getContext().getAuthentication() == null ? "anonimo" : SecurityContextHolder.getContext().getAuthentication().getName();
    String rol = SecurityContextHolder.getContext().getAuthentication() == null ? "SIN_ROL" : SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.joining(","));
    String resultado = status >= 200 && status < 400 ? "OK" : "ERROR";
    jdbc.update("INSERT INTO auditorias(usuario, fecha_hora, accion, paciente, endpoint, rol, ip, modulo, resultado, metodo_http, estado_http, tiempo_respuesta_ms, token_parcial, mensaje) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      usuario, LocalDateTime.now().toString(), request.getMethod() + " " + request.getRequestURI(), paciente(request), request.getRequestURI(), rol, ip(request), modulo(request), resultado, request.getMethod(), status, tiempoMs, tokenParcial(request), mensaje);
  }

  private static void agregarColumna(JdbcTemplate jdbc, String columna, String definicion) {
    try { jdbc.execute("ALTER TABLE auditorias ADD COLUMN " + columna + " " + definicion); } catch (Exception ignored) {}
  }

  private static String ip(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    return forwarded == null || forwarded.isBlank() ? request.getRemoteAddr() : forwarded.split(",")[0].trim();
  }

  private static String modulo(HttpServletRequest request) {
    String path = request.getRequestURI();
    String[] parts = path.split("/");
    return parts.length > 1 && !parts[1].isBlank() ? parts[1] : "general";
  }

  private static String paciente(HttpServletRequest request) {
    String path = request.getRequestURI();
    if (path.contains("/paciente/")) return path.substring(path.lastIndexOf("/paciente/") + 10);
    return request.getParameter("paciente");
  }

  private static String tokenParcial(HttpServletRequest request) {
    String auth = request.getHeader("Authorization");
    if (auth == null || !auth.startsWith("Bearer ") || auth.length() < 24) return null;
    String token = auth.substring(7);
    return token.substring(0, Math.min(12, token.length())) + "...";
  }
}
