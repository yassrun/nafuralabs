package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.chantiers.api.dto.ChantierLookupDto;
import ma.nafura.chantiers.api.dto.ChantierSummaryDto;
import ma.nafura.chantiers.api.request.ChantierCreateDto;
import ma.nafura.chantiers.api.request.ChantierUpdateDto;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.service.ChantierService;
import ma.nafura.chantiers.service.ChantierSummaryReadService;
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
@RequestMapping("/api/v1/chantiers")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "chantier")
public class ChantierController {

    private final ChantierService service;
    private final ChantierSummaryReadService summaryReadService;

    public ChantierController(ChantierService service, ChantierSummaryReadService summaryReadService) {
        this.service = service;
        this.summaryReadService = summaryReadService;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<Chantier>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) String societeId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(status, clientId, societeId, effectiveSearch));
    }

    @GetMapping("/lookup")
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<ChantierLookupDto>> lookup(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.lookup(effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("chantiers.read")
    public ResponseEntity<Chantier> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/{id}/summary")
    @RequirePermission("chantiers.read")
    public ResponseEntity<ChantierSummaryDto> summary(@PathVariable String id) {
        return ResponseEntity.ok(summaryReadService.getSummary(id));
    }

    @PostMapping
    @RequirePermission("chantiers.create")
    public ResponseEntity<Chantier> create(@Valid @RequestBody ChantierCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("chantiers.update")
    public ResponseEntity<Chantier> update(@PathVariable String id, @Valid @RequestBody ChantierUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("chantiers.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/demarrer")
    @RequirePermission("chantiers.update")
    public ResponseEntity<Chantier> demarrer(@PathVariable String id) {
        return ResponseEntity.ok(service.demarrer(id));
    }

    @PostMapping("/{id}/suspendre")
    @RequirePermission("chantiers.update")
    public ResponseEntity<Chantier> suspendre(@PathVariable String id) {
        return ResponseEntity.ok(service.suspendre(id));
    }

    @PostMapping("/{id}/reprendre")
    @RequirePermission("chantiers.update")
    public ResponseEntity<Chantier> reprendre(@PathVariable String id) {
        return ResponseEntity.ok(service.reprendre(id));
    }

    @PostMapping("/{id}/reception-provisoire")
    @RequirePermission("chantiers.update")
    public ResponseEntity<Chantier> receptionProvisoire(@PathVariable String id) {
        return ResponseEntity.ok(service.receptionProvisoire(id));
    }

    @PostMapping("/{id}/reception-definitive")
    @RequirePermission("chantiers.update")
    public ResponseEntity<Chantier> receptionDefinitive(@PathVariable String id) {
        return ResponseEntity.ok(service.receptionDefinitive(id));
    }

    @PostMapping("/{id}/clore")
    @RequirePermission("chantiers.update")
    public ResponseEntity<Chantier> clore(@PathVariable String id) {
        return ResponseEntity.ok(service.clore(id));
    }
}
