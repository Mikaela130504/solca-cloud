package ec.edu.solca.auth;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@SpringBootApplication(scanBasePackages = "ec.edu.solca")
public class AuthServiceApplication {
  public static void main(String[] args) { SpringApplication.run(AuthServiceApplication.class, args); }

  @Bean CommandLineRunner seed(AuthRepository repo, PasswordEncoder encoder) {
    return args -> {
      repo.save("admin", encoder.encode("admin123"), "ADMIN", "Administrador SOLCA");
      repo.save("medico", encoder.encode("medico123"), "MEDICO", "Dr. Carlos Salazar");
      repo.save("laboratorio", encoder.encode("lab123"), "LABORATORIO", "Laboratorio SOLCA");
      repo.save("imagenologia", encoder.encode("img123"), "IMAGENOLOGIA", "Imagenologia SOLCA");
    };
  }
}

record LoginRequest(@NotBlank String username, @NotBlank String password) {}
record UserResponse(String username, String role, String name) {}
record LoginResponse(String token, UserResponse user) {}
record AuthUser(String username, String passwordHash, String role, String name) {}

@RestController
@RequestMapping("/auth")
class AuthController {
  private final AuthRepository repo;
  private final PasswordEncoder encoder;
  @Value("${jwt.secret}") private String secret;
  AuthController(AuthRepository repo, PasswordEncoder encoder) { this.repo = repo; this.encoder = encoder; }

  @PostMapping("/login")
  LoginResponse login(@Valid @RequestBody LoginRequest request) {
    AuthUser user = repo.find(request.username());
    if (user == null || !encoder.matches(request.password(), user.passwordHash())) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas.");
    String token = Jwts.builder().subject(user.username()).claim("role", user.role()).claim("name", user.name()).issuedAt(new Date()).expiration(Date.from(Instant.now().plusSeconds(28800))).signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))).compact();
    return new LoginResponse(token, new UserResponse(user.username(), user.role(), user.name()));
  }
}

@org.springframework.stereotype.Repository
class AuthRepository {
  private final Map<String, AuthUser> users = new ConcurrentHashMap<>();
  void save(String username, String hash, String role, String name) { users.put(username, new AuthUser(username, hash, role, name)); }
  AuthUser find(String username) { return users.get(username); }
}
