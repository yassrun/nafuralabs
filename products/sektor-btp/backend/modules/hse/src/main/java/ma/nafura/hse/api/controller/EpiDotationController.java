package ma.nafura.hse.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.hse.api.request.EpiDotationCreateDto;
import ma.nafura.hse.api.request.EpiDotationUpdateDto;
import ma.nafura.hse.domain.model.EpiDotation;
import ma.nafura.hse.service.EpiDotationService;
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
@RequestMapping("/api/v1/hse/epi-dotations")
@SecuredResource(domain = "hse", feature = "epi-dotations", resource = "epi-dotation")
public class EpiDotationController {

    private final EpiDotationService service;

    public EpiDotationController(EpiDotationService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("hse.epi-dotations.read")
    public ResponseEntity<List<EpiDotation>> list(
            @RequestParam(required = false) String employeId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(employeId, effectiveSearch));
    }

    @GetMapping("/expirant")
    @RequirePermission("hse.epi-dotations.read")
    public ResponseEntity<List<EpiDotation>> listExpirant(
            @RequestParam(defaultValue = "30") int days, @RequestParam(required = false) String employeId) {
        return ResponseEntity.ok(service.listExpirant(days, employeId));
    }

    @GetMapping("/{id}")
    @RequirePermission("hse.epi-dotations.read")
    public ResponseEntity<EpiDotation> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("hse.epi-dotations.create")
    public ResponseEntity<EpiDotation> create(@Valid @RequestBody EpiDotationCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("hse.epi-dotations.update")
    public ResponseEntity<EpiDotation> update(
            @PathVariable String id, @Valid @RequestBody EpiDotationUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("hse.epi-dotations.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
