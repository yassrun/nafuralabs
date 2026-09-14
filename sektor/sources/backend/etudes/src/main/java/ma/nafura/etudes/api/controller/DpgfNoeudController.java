package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import ma.nafura.etudes.api.request.DpgfLotAffectationRequest;
import ma.nafura.etudes.api.request.DpgfNoeudUpdateDto;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.service.DpgfLotAffectationService;
import ma.nafura.etudes.service.DpgfService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/etudes/dpgf-noeuds")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dpgf")
public class DpgfNoeudController {

    private final DpgfService service;
    private final DpgfLotAffectationService lotAffectationService;

    public DpgfNoeudController(DpgfService service, DpgfLotAffectationService lotAffectationService) {
        this.service = service;
        this.lotAffectationService = lotAffectationService;
    }

    @PutMapping("/{id}")
    @RequirePermission("etudes.update")
    public ResponseEntity<DpgfNoeud> update(
            @PathVariable UUID id, @Valid @RequestBody DpgfNoeudUpdateDto body) {
        return ResponseEntity.ok(service.updateNoeud(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("etudes.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.deleteNoeud(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/affecter")
    @RequirePermission("etudes.update")
    public ResponseEntity<DpgfNoeud> affecter(
            @PathVariable UUID id, @RequestBody(required = false) DpgfLotAffectationRequest body) {
        return ResponseEntity.ok(lotAffectationService.affecter(id, body));
    }
}
