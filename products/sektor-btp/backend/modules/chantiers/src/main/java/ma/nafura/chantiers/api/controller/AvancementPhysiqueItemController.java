package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import ma.nafura.chantiers.api.dto.AvancementPhysiqueDto;
import ma.nafura.chantiers.api.request.AvancementPhysiqueUpdateDto;
import ma.nafura.chantiers.service.AvancementPhysiqueService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/avancements")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "avancement-physique")
public class AvancementPhysiqueItemController {

    private final AvancementPhysiqueService service;

    public AvancementPhysiqueItemController(AvancementPhysiqueService service) {
        this.service = service;
    }

    @PutMapping("/{id}")
    @RequirePermission("chantiers.update")
    public ResponseEntity<AvancementPhysiqueDto> update(
            @PathVariable String id, @Valid @RequestBody AvancementPhysiqueUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @PostMapping("/{id}/valider")
    @RequirePermission("chantiers.update")
    public ResponseEntity<AvancementPhysiqueDto> valider(@PathVariable String id) {
        return ResponseEntity.ok(service.valider(id));
    }
}
