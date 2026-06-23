package ma.nafura.chantiers.api.controller;

import java.util.List;
import ma.nafura.chantiers.api.dto.SituationTravauxDto;
import ma.nafura.chantiers.service.SituationTravauxService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/situations")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "situation-travaux")
public class SituationTravauxChantierController {

    private final SituationTravauxService service;

    public SituationTravauxChantierController(SituationTravauxService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<SituationTravauxDto>> list(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.listByChantier(chantierId));
    }

    @PostMapping("/generate")
    @RequirePermission("chantiers.create")
    public ResponseEntity<SituationTravauxDto> generate(
            @PathVariable String chantierId, @RequestParam(name = "numero") int numero) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.generate(chantierId, numero));
    }
}
