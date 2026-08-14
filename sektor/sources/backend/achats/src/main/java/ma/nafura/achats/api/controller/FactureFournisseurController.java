package ma.nafura.achats.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.dto.MatchingReceptionDto;
import ma.nafura.achats.api.dto.MatchingToleranceDto;
import ma.nafura.achats.api.request.FactureFournisseurCreateDto;
import ma.nafura.achats.api.request.FactureFournisseurLitigeDto;
import ma.nafura.achats.domain.model.FactureFournisseur;
import ma.nafura.achats.service.FactureFournisseurService;
import ma.nafura.achats.service.MatchingThreeWayService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/factures-fournisseur")
@SecuredResource(domain = "achats", feature = "achats", resource = "facture-fournisseur")
public class FactureFournisseurController {

    private final FactureFournisseurService service;

    public FactureFournisseurController(FactureFournisseurService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("achats.facture-fournisseur.read")
    public ResponseEntity<List<FactureFournisseur>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID bcId,
            @RequestParam(required = false) String fournisseurId) {
        return ResponseEntity.ok(service.list(status, bcId, fournisseurId));
    }

    @GetMapping("/{id}")
    @RequirePermission("achats.facture-fournisseur.read")
    public ResponseEntity<FactureFournisseur> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("achats.facture-fournisseur.create")
    public ResponseEntity<FactureFournisseur> create(@Valid @RequestBody FactureFournisseurCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("achats.facture-fournisseur.update")
    public ResponseEntity<FactureFournisseur> update(
            @PathVariable UUID id, @Valid @RequestBody FactureFournisseurCreateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @GetMapping("/{id}/matching")
    @RequirePermission("achats.facture-fournisseur.read")
    public ResponseEntity<MatchingReceptionDto> getMatching(
            @PathVariable UUID id,
            @RequestParam(required = false) java.math.BigDecimal pricePct,
            @RequestParam(required = false) java.math.BigDecimal qtyPct) {
        MatchingToleranceDto tolerance = buildTolerance(pricePct, qtyPct);
        return ResponseEntity.ok(service.getMatching(id, tolerance));
    }

    @GetMapping("/matching/by-bc/{bcId}")
    @RequirePermission("achats.facture-fournisseur.read")
    public ResponseEntity<MatchingReceptionDto> getMatchingByBc(
            @PathVariable UUID bcId,
            @RequestParam(required = false) java.math.BigDecimal pricePct,
            @RequestParam(required = false) java.math.BigDecimal qtyPct) {
        MatchingToleranceDto tolerance = buildTolerance(pricePct, qtyPct);
        return ResponseEntity.ok(service.computeMatchingForBc(bcId, tolerance));
    }

    @PostMapping("/{id}/matching/recompute")
    @RequirePermission("achats.facture-fournisseur.update")
    public ResponseEntity<MatchingReceptionDto> recomputeMatching(
            @PathVariable UUID id, @RequestBody(required = false) MatchingToleranceDto body) {
        return ResponseEntity.ok(service.recomputeMatching(id, body));
    }

    @PostMapping("/{id}/validate")
    @RequirePermission("achats.facture-fournisseur.update")
    public ResponseEntity<FactureFournisseur> validate(@PathVariable UUID id) {
        return ResponseEntity.ok(service.validate(id));
    }

    @PostMapping("/{id}/litige")
    @RequirePermission("achats.facture-fournisseur.update")
    public ResponseEntity<FactureFournisseur> litige(
            @PathVariable UUID id, @Valid @RequestBody FactureFournisseurLitigeDto body) {
        return ResponseEntity.ok(service.litige(id, body.getMotif()));
    }

    @PostMapping("/{id}/comptabiliser")
    @RequirePermission("achats.facture-fournisseur.update")
    public ResponseEntity<FactureFournisseur> comptabiliser(@PathVariable UUID id) {
        return ResponseEntity.ok(service.comptabiliser(id));
    }

    @PostMapping("/{id}/cancel")
    @RequirePermission("achats.facture-fournisseur.update")
    public ResponseEntity<FactureFournisseur> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(service.cancel(id));
    }

    private MatchingToleranceDto buildTolerance(java.math.BigDecimal pricePct, java.math.BigDecimal qtyPct) {
        if (pricePct == null && qtyPct == null) {
            return null;
        }
        return MatchingToleranceDto.builder()
                .pricePct(pricePct != null ? pricePct : MatchingThreeWayService.DEFAULT_TOLERANCE.getPricePct())
                .qtyPct(qtyPct != null ? qtyPct : MatchingThreeWayService.DEFAULT_TOLERANCE.getQtyPct())
                .build();
    }
}
