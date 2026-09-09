package ma.nafura.rh.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.request.RhNomenclatureCreateDto;
import ma.nafura.rh.api.request.RhNomenclatureUpdateDto;
import ma.nafura.rh.domain.referentiel.RhDepartement;
import ma.nafura.rh.service.RhDepartementService;
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
@RequestMapping("/api/v1/rh/departements")
@SecuredResource(domain = "rh", feature = "departements", resource = "departement")
public class RhDepartementController {

    private final RhDepartementService service;

    public RhDepartementController(RhDepartementService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("rh.departements.read")
    public ResponseEntity<List<RhDepartement>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean actif) {
        String term = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(term, actif));
    }

    @GetMapping("/{id}")
    @RequirePermission("rh.departements.read")
    public ResponseEntity<RhDepartement> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("rh.departements.create")
    public ResponseEntity<RhDepartement> create(@Valid @RequestBody RhNomenclatureCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("rh.departements.update")
    public ResponseEntity<RhDepartement> update(
            @PathVariable String id, @Valid @RequestBody RhNomenclatureUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("rh.departements.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
