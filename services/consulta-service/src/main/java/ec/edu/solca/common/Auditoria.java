package ec.edu.solca.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.sql.DriverManager;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class Auditoria {
  private static final String DB_URL = "jdbc:sqlite:/data/Autenticacion.sqlite";

  public static void crearTabla(JdbcTemplate ignored) {
    try (var con = DriverManager.getConnection(DB_URL); var st = con.createStatement()) {
      st.execute("CREATE TABLE IF NOT EXISTS auditorias (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario TEXT NOT NULL, rol TEXT NOT NULL, fecha TEXT NOT NULL, hora TEXT NOT NULL, direccion_ip TEXT, modulo TEXT NOT NULL, paciente TEXT, accion TEXT NOT NULL, resultado TEXT NOT NULL)");
    } catch (Exception ignoredException) {}
  }

  public static void registrar(JdbcTemplate jdbc, String accion, String paciente, HttpServletRequest request) {
    registrarCentral(accion, paciente, request, 200);
  }

  public static void registrarAuto(JdbcTemplate jdbc, HttpServletRequest request, int status, long tiempoMs, String mensaje) {
    registrarCentral(request.getMethod() + " " + request.getRequestURI(), paciente(request), request, status);
  }

  public static List<Map<String,Object>> listar() {
    crearTabla(null);
    List<Map<String,Object>> rows = new ArrayList<>();
    try (var con = DriverManager.getConnection(DB_URL);
         var ps = con.prepareStatement("SELECT usuario, rol, fecha, hora, direccion_ip, modulo, paciente, accion, resultado FROM auditorias ORDER BY id DESC LIMIT 200");
         var rs = ps.executeQuery()) {
      while (rs.next()) {
        Map<String,Object> row = new LinkedHashMap<>();
        row.put("usuario", rs.getString("usuario"));
        row.put("rol", rs.getString("rol"));
        row.put("fecha", rs.getString("fecha"));
        row.put("hora", rs.getString("hora"));
        row.put("direccion_ip", rs.getString("direccion_ip"));
        row.put("modulo", rs.getString("modulo"));
        row.put("paciente", rs.getString("paciente"));
        row.put("accion", rs.getString("accion"));
        row.put("resultado", rs.getString("resultado"));
        rows.add(row);
      }
    } catch (Exception ignoredException) {}
    return rows;
  }

  private static void registrarCentral(String accion, String paciente, HttpServletRequest request, int status) {
    LocalDateTime ahora = LocalDateTime.now();
    String resultado = status >= 200 && status < 400 ? "OK" : "ERROR";
    try (var con = DriverManager.getConnection(DB_URL)) {
      crearTabla(null);
      try (var ps = con.prepareStatement("INSERT INTO auditorias(usuario, rol, fecha, hora, direccion_ip, modulo, paciente, accion, resultado) VALUES (?,?,?,?,?,?,?,?,?)")) {
        ps.setString(1, usuario());
        ps.setString(2, rol());
        ps.setString(3, ahora.toLocalDate().toString());
        ps.setString(4, ahora.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        ps.setString(5, ip(request));
        ps.setString(6, modulo(request));
        ps.setString(7, paciente);
        ps.setString(8, accion);
        ps.setString(9, resultado);
        ps.executeUpdate();
      }
    } catch (Exception ignoredException) {}
  }

  private static String usuario() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) return "anonimo";
    Object details = auth.getDetails();
    if (details instanceof String name && !name.isBlank()) return name;
    return auth.getName();
  }

  private static String rol() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null) return "SIN_ROL";
    String roles = auth.getAuthorities().stream()
      .map(GrantedAuthority::getAuthority)
      .map(role -> role.replace("ROLE_", ""))
      .collect(Collectors.joining(","));
    return roles.isBlank() ? "SIN_ROL" : roles;
  }

  private static String ip(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    return forwarded == null || forwarded.isBlank() ? request.getRemoteAddr() : forwarded.split(",")[0].trim();
  }

  private static String modulo(HttpServletRequest request) {
    String path = request.getRequestURI();
    if (path.startsWith("/auth")) return "Autenticacion";
    if (path.startsWith("/pacientes")) return "Paciente Maestro";
    if (path.startsWith("/consultas")) return "Consultas";
    if (path.startsWith("/laboratorios")) return "Laboratorio";
    if (path.startsWith("/imagenologia")) return "Imagenologia";
    if (path.startsWith("/repositorio")) return "Repositorio Clinico";
    if (path.startsWith("/auditorias")) return "Auditoria";
    return "General";
  }

  private static String paciente(HttpServletRequest request) {
    String path = request.getRequestURI();
    if (path.contains("/paciente/")) return path.substring(path.lastIndexOf("/paciente/") + 10);
    if (path.matches(".*/pacientes/[^/]+$")) return path.substring(path.lastIndexOf("/") + 1);
    if (path.matches(".*/laboratorios/paciente/[^/]+$")) return path.substring(path.lastIndexOf("/") + 1);
    if (path.matches(".*/imagenologia/paciente/[^/]+$")) return path.substring(path.lastIndexOf("/") + 1);
    if (path.matches(".*/repositorio-clinico/[^/]+$")) return path.substring(path.lastIndexOf("/") + 1);
    String paciente = request.getParameter("paciente");
    if (paciente == null || paciente.isBlank()) paciente = request.getParameter("idPacienteRegional");
    if (paciente == null || paciente.isBlank()) paciente = request.getParameter("cedula");
    return paciente == null || paciente.isBlank() ? null : paciente;
  }
}
