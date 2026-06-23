package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.request.DevisCreateDto;
import ma.nafura.etudes.api.request.DevisUpdateDto;
import ma.nafura.etudes.api.dto.ConvertToChantierResultDto;
import ma.nafura.etudes.api.request.DevisVersionCreateDto;
import ma.nafura.etudes.domain.model.Devis;
import ma.nafura.etudes.domain.model.DevisVersion;
import ma.nafura.etudes.service.DevisService;
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
@RequestMapping("/api/v1/etudes/devis")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "devis")
public class DevisController {

    private final DevisService service;

    public DevisController(DevisService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("etudes.read")
    public ResponseEntity<List<Devis>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo,
            @RequestParam(required = false) BigDecimal montantMin,
            @RequestParam(required = false) BigDecimal montantMax,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = hasText(search) ? search : q;
        return ResponseEntity.ok(service.list(
                status, clientId, dateFrom, dateTo, montantMin, montantMax, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("etudes.read")
    public ResponseEntity<Devis> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("etudes.create")
    public ResponseEntity<Devis> create(@Valid @RequestBody DevisCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PostMapping("/from-dpgf")
    @RequirePermission("etudes.create")
    public ResponseEntity<Devis> createFromDpgf(@RequestParam UUID dpgfId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createFromDpgf(dpgfId));
    }

    @PutMapping("/{id}")
    @RequirePermission("etudes.update")
    public ResponseEntity<Devis> update(@PathVariable UUID id, @Valid @RequestBody DevisUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("etudes.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/versions")
    @RequirePermission("etudes.read")
    public ResponseEntity<List<DevisVersion>> listVersions(@PathVariable UUID id) {
        return ResponseEntity.ok(service.listVersions(id));
    }

    @PostMapping("/{id}/versions")
    @RequirePermission("etudes.update")
    public ResponseEntity<Devis> createVersion(
            @PathVariable UUID id, @RequestBody(required = false) DevisVersionCreateDto body) {
        String modifications = body != null ? body.getModifications() : null;
        return ResponseEntity.ok(service.createVersion(id, modifications));
    }

    @PostMapping("/{id}/submit")
    @RequirePermission("etudes.update")
    public ResponseEntity<Devis> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(service.submit(id));
    }

    @PostMapping("/{id}/marquer-gagne")
    @RequirePermission("etudes.update")
    public ResponseEntity<Devis> marquerGagne(@PathVariable UUID id) {
        return ResponseEntity.ok(service.marquerGagne(id));
    }

    @PostMapping("/{id}/convert-to-chantier")
    @RequirePermission("etudes.update")
    public ResponseEntity<ConvertToChantierResultDto> convertToChantier(@PathVariable UUID id) {
        return ResponseEntity.ok(service.convertToChantier(id));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
