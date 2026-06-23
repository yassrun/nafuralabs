package ma.nafura.achats.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.dto.AppelOffreAttribuerResultDto;
import ma.nafura.achats.api.dto.AppelOffreComparatifDto;
import ma.nafura.achats.service.AppelOffreComparatifService;
import ma.nafura.achats.api.request.AppelOffreAttribuerDto;
import ma.nafura.achats.api.request.AppelOffreAchatCreateDto;
import ma.nafura.achats.api.request.AppelOffreAchatUpdateDto;
import ma.nafura.achats.domain.model.AppelOffreAchat;
import ma.nafura.achats.service.AppelOffreAchatService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/appels-offres-achat")
@SecuredResource(domain = "achats", feature = "achats", resource = "appel-offre-achat")
public class AppelOffreAchatController {

    private final AppelOffreAchatService service;
    private final AppelOffreComparatifService comparatifService;

    public AppelOffreAchatController(
            AppelOffreAchatService service, AppelOffreComparatifService comparatifService) {
        this.service = service;
        this.comparatifService = comparatifService;
    }

    @GetMapping
    @RequirePermission("achats.appel-offre-achat.read")
    public ResponseEntity<List<AppelOffreAchat>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String chantierId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(status, chantierId, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("achats.appel-offre-achat.read")
    public ResponseEntity<AppelOffreAchat> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("achats.appel-offre-achat.create")
    public ResponseEntity<AppelOffreAchat> create(@Valid @RequestBody AppelOffreAchatCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("achats.appel-offre-achat.update")
    public ResponseEntity<AppelOffreAchat> update(
            @PathVariable UUID id, @Valid @RequestBody AppelOffreAchatUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("achats.appel-offre-achat.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    @RequirePermission("achats.appel-offre-achat.update")
    public ResponseEntity<AppelOffreAchat> publish(@PathVariable UUID id) {
        return ResponseEntity.ok(service.publish(id));
    }

    @PostMapping("/{id}/clore-reception")
    @RequirePermission("achats.appel-offre-achat.update")
    public ResponseEntity<AppelOffreAchat> cloreReception(@PathVariable UUID id) {
        return ResponseEntity.ok(service.cloreReception(id));
    }

    @PostMapping("/{id}/attribuer")
    @RequirePermission("achats.appel-offre-achat.update")
    public ResponseEntity<AppelOffreAttribuerResultDto> attribuer(
            @PathVariable UUID id, @Valid @RequestBody AppelOffreAttribuerDto body) {
        return ResponseEntity.ok(
                service.attribuer(id, body.getFournisseurId(), body.getFournisseurName()));
    }

    @GetMapping("/{id}/comparatif")
    @RequirePermission("achats.appel-offre-achat.read")
    public ResponseEntity<AppelOffreComparatifDto> comparatif(@PathVariable UUID id) {
        return ResponseEntity.ok(comparatifService.getComparatif(id));
    }

    @PostMapping("/{id}/scoring/recompute")
    @RequirePermission("achats.appel-offre-achat.update")
    public ResponseEntity<AppelOffreComparatifDto> recomputeScoring(@PathVariable UUID id) {
        return ResponseEntity.ok(comparatifService.recomputeAndPersist(id));
    }
}
