package ma.nafura.approbations.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.approbations.api.request.MatricePouvoirCreateDto;
import ma.nafura.approbations.api.request.MatricePouvoirUpdateDto;
import ma.nafura.approbations.domain.model.MatricePouvoir;
import ma.nafura.approbations.service.MatricePouvoirService;
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
@RequestMapping("/api/v1/approbations/matrice-pouvoirs")
@SecuredResource(domain = "approbations", feature = "matrice-pouvoirs", resource = "matrice-pouvoir")
public class MatricePouvoirController {

    private final MatricePouvoirService service;

    public MatricePouvoirController(MatricePouvoirService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("approbations.matrice-pouvoirs.read")
    public ResponseEntity<List<MatricePouvoir>> list(@RequestParam(required = false) String entityType) {
        return ResponseEntity.ok(service.list(entityType));
    }

    @GetMapping("/{id}")
    @RequirePermission("approbations.matrice-pouvoirs.read")
    public ResponseEntity<MatricePouvoir> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("approbations.matrice-pouvoirs.create")
    public ResponseEntity<MatricePouvoir> create(@Valid @RequestBody MatricePouvoirCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("approbations.matrice-pouvoirs.update")
    public ResponseEntity<MatricePouvoir> update(
            @PathVariable UUID id, @Valid @RequestBody MatricePouvoirUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("approbations.matrice-pouvoirs.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
