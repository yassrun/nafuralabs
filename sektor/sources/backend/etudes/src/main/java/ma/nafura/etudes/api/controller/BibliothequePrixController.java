package ma.nafura.etudes.api.controller;

import java.math.BigDecimal;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.service.OuvrageService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/etudes/bibliotheque-prix")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "ouvrage")
public class BibliothequePrixController {

    private final OuvrageService service;

    public BibliothequePrixController(OuvrageService service) {
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

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
