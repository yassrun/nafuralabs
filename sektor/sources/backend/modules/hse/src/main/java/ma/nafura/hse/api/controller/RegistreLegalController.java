package ma.nafura.hse.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.hse.api.request.RegistreLegalCreateDto;
import ma.nafura.hse.api.request.RegistreLegalUpdateDto;
import ma.nafura.hse.domain.model.RegistreLegal;
import ma.nafura.hse.service.RegistreLegalService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hse/registres-legaux")
@SecuredResource(domain = "hse", feature = "registres-legaux", resource = "registre-legal")
public class RegistreLegalController {

    private final RegistreLegalService service;

    public RegistreLegalController(RegistreLegalService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("hse.registres-legaux.read")
    public ResponseEntity<List<RegistreLegal>> list(
            @RequestParam(required = false) String chantierId,
            @RequestParam(required = false) String registre,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(chantierId, registre, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("hse.registres-legaux.read")
    public ResponseEntity<RegistreLegal> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("hse.registres-legaux.create")
    public ResponseEntity<RegistreLegal> create(@Valid @RequestBody RegistreLegalCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("hse.registres-legaux.update")
    public ResponseEntity<RegistreLegal> update(
            @PathVariable String id, @Valid @RequestBody RegistreLegalUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("hse.registres-legaux.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
