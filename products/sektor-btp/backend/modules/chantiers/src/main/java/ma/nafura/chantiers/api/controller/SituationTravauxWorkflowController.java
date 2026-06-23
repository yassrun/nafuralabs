package ma.nafura.chantiers.api.controller;

import ma.nafura.chantiers.api.dto.SituationConvertToFactureDto;
import ma.nafura.chantiers.api.dto.SituationTravauxDto;
import ma.nafura.chantiers.service.SituationTravauxService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/situations")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "situation-travaux")
public class SituationTravauxWorkflowController {

    private final SituationTravauxService service;

    public SituationTravauxWorkflowController(SituationTravauxService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    @RequirePermission("chantiers.read")
    public ResponseEntity<SituationTravauxDto> get(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping("/{id}/submit")
    @RequirePermission("chantiers.update")
    public ResponseEntity<SituationTravauxDto> submit(@PathVariable String id) {
        return ResponseEntity.ok(service.submit(id));
    }

    @PostMapping("/{id}/accept-moa")
    @RequirePermission("chantiers.update")
    public ResponseEntity<SituationTravauxDto> acceptMoa(@PathVariable String id) {
        return ResponseEntity.ok(service.acceptMoa(id));
    }

    @PostMapping("/{id}/reject")
    @RequirePermission("chantiers.update")
    public ResponseEntity<SituationTravauxDto> reject(
            @PathVariable String id, @RequestParam String motif) {
        return ResponseEntity.ok(service.reject(id, motif));
    }

    @PostMapping("/{id}/marquer-payee")
    @RequirePermission("chantiers.update")
    public ResponseEntity<SituationTravauxDto> marquerPayee(@PathVariable String id) {
        return ResponseEntity.ok(service.marquerPayee(id));
    }

    @PostMapping("/{id}/convert-to-facture")
    @RequirePermission("chantiers.update")
    public ResponseEntity<SituationConvertToFactureDto> convertToFacture(@PathVariable String id) {
        return ResponseEntity.ok(service.convertToFacture(id));
    }
}
