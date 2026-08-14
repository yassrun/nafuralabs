package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.dto.DpgfLotTotalDto;
import ma.nafura.etudes.api.request.DpgfNoeudCreateDto;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.service.DpgfService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/etudes/dpgf")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dpgf")
public class DpgfController {

    private final DpgfService service;

    public DpgfController(DpgfService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("etudes.read")
    public ResponseEntity<List<Dpgf>> list(@RequestParam(required = false) UUID metreId) {
        return ResponseEntity.ok(service.list(metreId));
    }

    @GetMapping("/{id}")
    @RequirePermission("etudes.read")
    public ResponseEntity<Dpgf> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("etudes.create")
    public ResponseEntity<Dpgf> create(
            @RequestParam UUID fromMetreId,
            @RequestParam(required = false) BigDecimal tvaTaux) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createFromMetre(fromMetreId, tvaTaux));
    }

    @GetMapping("/{id}/arbre")
    @RequirePermission("etudes.read")
    public ResponseEntity<Dpgf> getArbre(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getArbre(id));
    }

    @PostMapping("/{id}/noeuds")
    @RequirePermission("etudes.update")
    public ResponseEntity<DpgfNoeud> addNoeud(
            @PathVariable UUID id, @Valid @RequestBody DpgfNoeudCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addNoeud(id, body));
    }

    @GetMapping("/{id}/totaux")
    @RequirePermission("etudes.read")
    public ResponseEntity<List<DpgfLotTotalDto>> getTotaux(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getTotauxByLot(id));
    }

    @GetMapping("/{id}/pdf")
    @RequirePermission("etudes.read")
    public ResponseEntity<Void> getPdf(@PathVariable UUID id) {
        service.getById(id);
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }
}
