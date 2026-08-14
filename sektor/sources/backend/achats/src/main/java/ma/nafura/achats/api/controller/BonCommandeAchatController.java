package ma.nafura.achats.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.request.BonCommandeAchatApproveDto;
import ma.nafura.achats.api.request.BonCommandeAchatCreateDto;
import ma.nafura.achats.api.request.BonCommandeAchatUpdateDto;
import ma.nafura.achats.api.request.ReceptionAchatCreateDto;
import ma.nafura.achats.domain.model.BonCommandeAchat;
import ma.nafura.achats.domain.model.ReceptionAchat;
import ma.nafura.achats.service.BonCommandeAchatService;
import ma.nafura.achats.service.ReceptionAchatService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bons-commande-achat")
@SecuredResource(domain = "achats", feature = "achats", resource = "bon-commande-achat")
public class BonCommandeAchatController {

    private final BonCommandeAchatService service;
    private final ReceptionAchatService receptionService;

    public BonCommandeAchatController(
            BonCommandeAchatService service, ReceptionAchatService receptionService) {
        this.service = service;
        this.receptionService = receptionService;
    }

    @GetMapping
    @RequirePermission("achats.bon-commande-achat.read")
    public ResponseEntity<List<BonCommandeAchat>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String fournisseurId,
            @RequestParam(required = false) String chantierId,
            @RequestParam(required = false) String rubrique,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(status, fournisseurId, chantierId, rubrique, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("achats.bon-commande-achat.read")
    public ResponseEntity<BonCommandeAchat> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("achats.bon-commande-achat.create")
    public ResponseEntity<BonCommandeAchat> create(@Valid @RequestBody BonCommandeAchatCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("achats.bon-commande-achat.update")
    public ResponseEntity<BonCommandeAchat> update(
            @PathVariable UUID id, @Valid @RequestBody BonCommandeAchatUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("achats.bon-commande-achat.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    @RequirePermission("achats.bon-commande-achat.update")
    public ResponseEntity<BonCommandeAchat> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(service.submit(id));
    }

    @PostMapping("/{id}/approve")
    @RequirePermission("achats.bon-commande-achat.update")
    public ResponseEntity<BonCommandeAchat> approve(
            @PathVariable UUID id, @RequestBody(required = false) BonCommandeAchatApproveDto body) {
        String validateurId = body != null ? body.getValidateurId() : null;
        String validateurName = body != null ? body.getValidateurName() : null;
        return ResponseEntity.ok(service.approve(id, validateurId, validateurName));
    }

    @PostMapping("/{id}/send")
    @RequirePermission("achats.bon-commande-achat.update")
    public ResponseEntity<BonCommandeAchat> send(@PathVariable UUID id) {
        return ResponseEntity.ok(service.send(id));
    }

    @PostMapping("/{id}/cancel")
    @RequirePermission("achats.bon-commande-achat.update")
    public ResponseEntity<BonCommandeAchat> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(service.cancel(id));
    }

    @PostMapping("/{id}/close")
    @RequirePermission("achats.bon-commande-achat.update")
    public ResponseEntity<BonCommandeAchat> close(@PathVariable UUID id) {
        return ResponseEntity.ok(service.close(id));
    }

    @PostMapping("/{id}/acknowledge-reception")
    @RequirePermission("achats.bon-commande-achat.update")
    public ResponseEntity<BonCommandeAchat> acknowledgeReception(@PathVariable UUID id) {
        return ResponseEntity.ok(service.acknowledgeReception(id));
    }

    @GetMapping("/{id}/receptions")
    @RequirePermission("achats.bon-commande-achat.read")
    public ResponseEntity<List<ReceptionAchat>> listReceptions(@PathVariable UUID id) {
        return ResponseEntity.ok(receptionService.listByBonCommande(id));
    }

    @PostMapping("/{id}/receptions")
    @RequirePermission("achats.bon-commande-achat.update")
    public ResponseEntity<ReceptionAchat> createReception(
            @PathVariable UUID id, @Valid @RequestBody ReceptionAchatCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(receptionService.create(id, body));
    }
}
