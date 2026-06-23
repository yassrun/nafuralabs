package ma.nafura.hse.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.hse.api.request.PhsCreateDto;
import ma.nafura.hse.domain.model.Phs;
import ma.nafura.hse.service.PhsService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hse/phs")
@SecuredResource(domain = "hse", feature = "phs", resource = "phs")
public class PhsController {

    private final PhsService service;

    public PhsController(PhsService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("hse.phs.read")
    public ResponseEntity<List<Phs>> list() {
        return ResponseEntity.ok(service.list());
    }

    @PostMapping
    @RequirePermission("hse.phs.create")
    public ResponseEntity<Phs> create(@Valid @RequestBody PhsCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @GetMapping("/{id}/pdf")
    @RequirePermission("hse.phs.read")
    public ResponseEntity<Void> pdf(@PathVariable String id) {
        service.getById(id);
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }
}
