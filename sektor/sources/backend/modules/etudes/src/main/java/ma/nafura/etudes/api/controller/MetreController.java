package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.request.MetreCreateDto;
import ma.nafura.etudes.api.request.MetreLigneInputDto;
import ma.nafura.etudes.api.request.MetreUpdateDto;
import ma.nafura.etudes.domain.model.Metre;
import ma.nafura.etudes.domain.model.MetreLigne;
import ma.nafura.etudes.service.MetreService;
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
@RequestMapping("/api/v1/etudes/metres")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "metre")
public class MetreController {

    private final MetreService service;

    public MetreController(MetreService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("etudes.read")
    public ResponseEntity<List<Metre>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String metreurId,
            @RequestParam(required = false) String ville,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) String sort) {
        String effectiveSearch = hasText(search) ? search : q;
        String effectiveSortBy = sortBy;
        String effectiveSortDirection = sortDirection;
        if (hasText(sort) && !hasText(sortBy)) {
            String[] parts = sort.split(",");
            effectiveSortBy = parts[0];
            if (parts.length > 1) {
                effectiveSortDirection = parts[1];
            }
        }
        return ResponseEntity.ok(service.list(
                status,
                metreurId,
                ville,
                dateFrom,
                dateTo,
                effectiveSearch,
                effectiveSortBy,
                effectiveSortDirection));
    }

    @GetMapping("/{id}")
    @RequirePermission("etudes.read")
    public ResponseEntity<Metre> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("etudes.create")
    public ResponseEntity<Metre> create(@Valid @RequestBody MetreCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("etudes.update")
    public ResponseEntity<Metre> update(@PathVariable UUID id, @Valid @RequestBody MetreUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("etudes.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/lignes")
    @RequirePermission("etudes.read")
    public ResponseEntity<List<MetreLigne>> listLignes(@PathVariable UUID id) {
        return ResponseEntity.ok(service.listLignes(id));
    }

    @PostMapping("/{id}/lignes")
    @RequirePermission("etudes.update")
    public ResponseEntity<MetreLigne> addLigne(
            @PathVariable UUID id, @Valid @RequestBody MetreLigneInputDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addLigne(id, body));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
