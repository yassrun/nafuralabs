package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.dto.ConvertToChantierResultDto;
import ma.nafura.etudes.api.request.AppelOffreClientCreateDto;
import ma.nafura.etudes.api.request.AppelOffreClientMarquerPerduDto;
import ma.nafura.etudes.api.request.AppelOffreClientUpdateDto;
import ma.nafura.etudes.domain.model.AppelOffreClient;
import ma.nafura.etudes.service.AppelOffreClientService;
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
@RequestMapping({"/api/v1/etudes/aoc", "/api/v1/etudes/appels-offres-clients"})
@SecuredResource(domain = "etudes", feature = "etudes", resource = "aoc")
public class AppelOffreClientController {

    private final AppelOffreClientService service;

    public AppelOffreClientController(AppelOffreClientService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("etudes.read")
    public ResponseEntity<List<AppelOffreClient>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String donneurOrdre,
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
                type,
                donneurOrdre,
                dateFrom,
                dateTo,
                effectiveSearch,
                effectiveSortBy,
                effectiveSortDirection));
    }

    @GetMapping("/{id}")
    @RequirePermission("etudes.read")
    public ResponseEntity<AppelOffreClient> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("etudes.create")
    public ResponseEntity<AppelOffreClient> create(@Valid @RequestBody AppelOffreClientCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("etudes.update")
    public ResponseEntity<AppelOffreClient> update(
            @PathVariable UUID id, @Valid @RequestBody AppelOffreClientUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("etudes.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/prepare")
    @RequirePermission("etudes.update")
    public ResponseEntity<AppelOffreClient> prepare(@PathVariable UUID id) {
        return ResponseEntity.ok(service.prepare(id));
    }

    @PostMapping("/{id}/submit")
    @RequirePermission("etudes.update")
    public ResponseEntity<AppelOffreClient> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(service.submit(id));
    }

    @PostMapping({"/{id}/win", "/{id}/marquer-gagne"})
    @RequirePermission("etudes.update")
    public ResponseEntity<AppelOffreClient> marquerGagne(@PathVariable UUID id) {
        return ResponseEntity.ok(service.marquerGagne(id));
    }

    @PostMapping({"/{id}/lose", "/{id}/marquer-perdu"})
    @RequirePermission("etudes.update")
    public ResponseEntity<AppelOffreClient> marquerPerdu(
            @PathVariable UUID id, @RequestBody(required = false) AppelOffreClientMarquerPerduDto body) {
        return ResponseEntity.ok(service.marquerPerdu(id, body));
    }

    @PostMapping("/{id}/infruct")
    @RequirePermission("etudes.update")
    public ResponseEntity<AppelOffreClient> infructueux(@PathVariable UUID id) {
        return ResponseEntity.ok(service.infructueux(id));
    }

    @PostMapping("/{id}/cancel")
    @RequirePermission("etudes.update")
    public ResponseEntity<AppelOffreClient> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(service.cancel(id));
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
