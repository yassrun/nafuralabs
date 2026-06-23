package ma.nafura.item.api.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import ma.nafura.item.api.request.MaterielCreateDto;
import ma.nafura.item.api.request.MaterielUpdateDto;
import ma.nafura.item.domain.model.Materiel;
import ma.nafura.item.service.MaterielService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/materiels")
@SecuredResource(domain = "item", feature = "item", resource = "materiel")
public class MaterielController {

    private final MaterielService service;

    public MaterielController(MaterielService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("item.materiel.read")
    public ResponseEntity<Page<Materiel>> list(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "familleId", required = false) String familleId,
            @RequestParam(value = "sort", required = false) String sort) {
        return ResponseEntity.ok(service.list(page, size, search, status, familleId, sort));
    }

    @GetMapping("/{id}")
    @RequirePermission("item.materiel.read")
    public ResponseEntity<Materiel> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("item.materiel.create")
    public ResponseEntity<Materiel> create(@Valid @RequestBody MaterielCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("item.materiel.update")
    public ResponseEntity<Materiel> update(@PathVariable UUID id, @Valid @RequestBody MaterielUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("item.materiel.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
