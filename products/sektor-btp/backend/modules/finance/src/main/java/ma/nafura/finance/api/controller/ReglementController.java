package ma.nafura.finance.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.ReglementDetailDto;
import ma.nafura.finance.api.request.ReglementCreateDto;
import ma.nafura.finance.api.request.ReglementUpdateDto;
import ma.nafura.finance.service.ReglementService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reglements")
@SecuredResource(domain = "finance", feature = "finance", resource = "reglement")
public class ReglementController {

    private final ReglementService service;

    public ReglementController(ReglementService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.reglement.read")
    public ResponseEntity<List<ReglementDetailDto>> list(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "partnerId", required = false) String partnerId,
            @RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(service.list(type, partnerId, status));
    }

    @GetMapping("/{id}")
    @RequirePermission("finance.reglement.read")
    public ResponseEntity<ReglementDetailDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("finance.reglement.create")
    public ResponseEntity<ReglementDetailDto> create(@Valid @RequestBody ReglementCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("finance.reglement.update")
    public ResponseEntity<ReglementDetailDto> update(
            @PathVariable UUID id, @Valid @RequestBody ReglementUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("finance.reglement.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/comptabiliser")
    @RequirePermission("finance.reglement.update")
    public ResponseEntity<ReglementDetailDto> comptabiliser(@PathVariable UUID id) {
        return ResponseEntity.ok(service.comptabiliser(id));
    }

    @PostMapping("/{id}/annuler")
    @RequirePermission("finance.reglement.update")
    public ResponseEntity<ReglementDetailDto> annuler(@PathVariable UUID id) {
        return ResponseEntity.ok(service.annuler(id));
    }
}
