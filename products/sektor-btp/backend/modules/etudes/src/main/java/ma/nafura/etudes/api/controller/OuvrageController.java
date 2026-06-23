package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.dto.OuvrageLookupDto;
import ma.nafura.etudes.api.request.OuvrageCreateDto;
import ma.nafura.etudes.api.request.OuvrageUpdateDto;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.service.OuvrageService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.data.domain.Page;
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
@RequestMapping("/api/v1/etudes/ouvrages")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "ouvrage")
public class OuvrageController {

    private final OuvrageService service;

    public OuvrageController(OuvrageService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("etudes.read")
    public ResponseEntity<Page<Ouvrage>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) BigDecimal prixMin,
            @RequestParam(required = false) BigDecimal prixMax,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer pageSize) {
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
        int effectiveSize = pageSize != null && pageSize > 0 ? pageSize : size;
        return ResponseEntity.ok(service.list(
                category,
                isActive,
                prixMin,
                prixMax,
                effectiveSearch,
                effectiveSortBy,
                effectiveSortDirection,
                page,
                effectiveSize));
    }

    @GetMapping("/lookup")
    @RequirePermission("etudes.read")
    public ResponseEntity<List<OuvrageLookupDto>> lookup(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = hasText(search) ? search : q;
        return ResponseEntity.ok(service.lookup(effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("etudes.read")
    public ResponseEntity<Ouvrage> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("etudes.create")
    public ResponseEntity<Ouvrage> create(@Valid @RequestBody OuvrageCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("etudes.update")
    public ResponseEntity<Ouvrage> update(@PathVariable UUID id, @Valid @RequestBody OuvrageUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("etudes.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/import-excel")
    @RequirePermission("etudes.create")
    public ResponseEntity<Void> importExcel() {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
