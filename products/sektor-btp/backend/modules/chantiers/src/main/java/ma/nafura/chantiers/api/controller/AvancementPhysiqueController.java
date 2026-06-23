package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.chantiers.api.dto.AvancementPhysiqueDto;
import ma.nafura.chantiers.api.request.AvancementPhysiqueCreateDto;
import ma.nafura.chantiers.service.AvancementPhysiqueService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/avancements")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "avancement-physique")
public class AvancementPhysiqueController {

    private final AvancementPhysiqueService service;

    public AvancementPhysiqueController(AvancementPhysiqueService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<AvancementPhysiqueDto>> list(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.listByChantier(chantierId));
    }

    @PostMapping
    @RequirePermission("chantiers.create")
    public ResponseEntity<List<AvancementPhysiqueDto>> create(
            @PathVariable String chantierId, @Valid @RequestBody AvancementPhysiqueCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(chantierId, body));
    }

    @GetMapping("/dernier")
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<AvancementPhysiqueDto>> dernier(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.findDernierByChantier(chantierId));
    }
}
