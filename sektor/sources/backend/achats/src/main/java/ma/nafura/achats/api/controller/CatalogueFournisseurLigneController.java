package ma.nafura.achats.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.request.CatalogueFournisseurLigneCreateDto;
import ma.nafura.achats.api.request.CatalogueFournisseurLigneUpdateDto;
import ma.nafura.achats.domain.model.CatalogueFournisseurLigne;
import ma.nafura.achats.service.CatalogueFournisseurLigneService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/catalogue-fournisseur")
@SecuredResource(domain = "achats", feature = "achats", resource = "catalogue-fournisseur")
public class CatalogueFournisseurLigneController {

    private final CatalogueFournisseurLigneService service;

    public CatalogueFournisseurLigneController(CatalogueFournisseurLigneService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("achats.catalogue-fournisseur.read")
    public ResponseEntity<List<CatalogueFournisseurLigne>> list(
            @RequestParam(required = false) String fournisseurId,
            @RequestParam(required = false) String articleId,
            @RequestParam(required = false) Boolean actif,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(fournisseurId, articleId, actif, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("achats.catalogue-fournisseur.read")
    public ResponseEntity<CatalogueFournisseurLigne> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("achats.catalogue-fournisseur.create")
    public ResponseEntity<CatalogueFournisseurLigne> create(
            @Valid @RequestBody CatalogueFournisseurLigneCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("achats.catalogue-fournisseur.update")
    public ResponseEntity<CatalogueFournisseurLigne> update(
            @PathVariable UUID id, @Valid @RequestBody CatalogueFournisseurLigneUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("achats.catalogue-fournisseur.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
