package ec.edu.solca.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
public class AuditoriaFilter extends OncePerRequestFilter {
  private final JdbcTemplate jdbc;

  public AuditoriaFilter(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
    long inicio = System.currentTimeMillis();
    try {
      chain.doFilter(request, response);
      registrar(request, response, inicio, "OK");
    } catch (ServletException | IOException ex) {
      registrar(request, response, inicio, ex.getMessage());
      throw ex;
    } catch (RuntimeException ex) {
      registrar(request, response, inicio, ex.getMessage());
      throw ex;
    }
  }

  private void registrar(HttpServletRequest request, HttpServletResponse response, long inicio, String mensaje) {
    if ("OPTIONS".equalsIgnoreCase(request.getMethod()) || request.getRequestURI().startsWith("/actuator")) return;
    try {
      Auditoria.crearTabla(jdbc);
      Auditoria.registrarAuto(jdbc, request, response.getStatus(), System.currentTimeMillis() - inicio, mensaje);
    } catch (Exception ignored) {}
  }
}
