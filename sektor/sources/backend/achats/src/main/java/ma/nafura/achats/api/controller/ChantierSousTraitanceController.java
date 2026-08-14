package ma.nafura.achats.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.achats.api.dto.ContratSousTraitanceDto;
import ma.nafura.achats.api.dto.SousTraitanceSyntheseDto;
import ma.nafura.achats.api.request.ContratSousTraitanceCreateDto;
import ma.nafura.achats.service.ChantierSousTraitanceService;
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
@RequestMapping("/api/v1/chantiers/{chantierId}/sous-traitances")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "sous-traitance")
public class ChantierSousTraitanceController {

    private final ChantierSousTraitanceService service;

    public ChantierSousTraitanceController(ChantierSousTraitanceService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<ContratSousTraitanceDto>> list(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.listByChantier(chantierId));
    }

    @PostMapping
    @RequirePermission("chantiers.create")
    public ResponseEntity<ContratSousTraitanceDto> create(
            @PathVariable String chantierId, @Valid @RequestBody ContratSousTraitanceCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(chantierId, body));
    }

    @GetMapping("/synthese")
    @RequirePermission("chantiers.read")
    public ResponseEntity<SousTraitanceSyntheseDto> synthese(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.synthese(chantierId));
    }
}
