package ma.nafura.rh.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.request.RhNomenclatureCreateDto;
import ma.nafura.rh.api.request.RhNomenclatureUpdateDto;
import ma.nafura.rh.domain.referentiel.RhPoste;
import ma.nafura.rh.service.RhPosteService;
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
@RequestMapping("/api/v1/rh/postes")
@SecuredResource(domain = "rh", feature = "postes", resource = "poste")
public class RhPosteController {

    private final RhPosteService service;

    public RhPosteController(RhPosteService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("rh.postes.read")
    public ResponseEntity<List<RhPoste>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean actif) {
        String term = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(term, actif));
    }

    @GetMapping("/{id}")
    @RequirePermission("rh.postes.read")
    public ResponseEntity<RhPoste> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("rh.postes.create")
    public ResponseEntity<RhPoste> create(@Valid @RequestBody RhNomenclatureCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("rh.postes.update")
    public ResponseEntity<RhPoste> update(
            @PathVariable String id, @Valid @RequestBody RhNomenclatureUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("rh.postes.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
