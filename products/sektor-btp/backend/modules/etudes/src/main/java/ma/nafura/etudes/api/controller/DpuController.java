package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.dto.DpuHistoriqueEntryDto;
import ma.nafura.etudes.api.request.ComposantDpuInputDto;
import ma.nafura.etudes.api.request.PrixDpuCreateDto;
import ma.nafura.etudes.api.request.PrixDpuUpdateDto;
import ma.nafura.etudes.domain.model.ComposantDpu;
import ma.nafura.etudes.domain.model.PrixDpu;
import ma.nafura.etudes.service.DpuService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/etudes/dpu")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dpu")
public class DpuController {

    private final DpuService service;

    public DpuController(DpuService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("etudes.read")
    public ResponseEntity<List<PrixDpu>> list(@RequestParam(required = false) UUID ouvrageId) {
        return ResponseEntity.ok(service.list(ouvrageId));
    }

    @GetMapping("/{id}")
    @RequirePermission("etudes.read")
    public ResponseEntity<PrixDpu> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("etudes.create")
    public ResponseEntity<PrixDpu> create(@Valid @RequestBody PrixDpuCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("etudes.update")
    public ResponseEntity<PrixDpu> update(@PathVariable UUID id, @Valid @RequestBody PrixDpuUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @GetMapping("/{id}/composants")
    @RequirePermission("etudes.read")
    public ResponseEntity<List<ComposantDpu>> getComposants(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getComposants(id));
    }

    @PostMapping("/{id}/composants")
    @RequirePermission("etudes.update")
    public ResponseEntity<ComposantDpu> addComposant(
            @PathVariable UUID id, @Valid @RequestBody ComposantDpuInputDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addComposant(id, body));
    }

    @PostMapping("/{id}/recompute")
    @RequirePermission("etudes.update")
    public ResponseEntity<PrixDpu> recompute(@PathVariable UUID id) {
        return ResponseEntity.ok(service.recompute(id));
    }

    @PostMapping("/{id}/versions")
    @RequirePermission("etudes.update")
    public ResponseEntity<DpuHistoriqueEntryDto> createVersion(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createVersion(id));
    }
}
