package ma.nafura.achats.api.controller;

import java.util.List;
import ma.nafura.achats.api.dto.ContratSousTraitanceDto;
import ma.nafura.achats.service.ChantierSousTraitanceService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chantiers/sous-traitances")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "sous-traitance")
public class ChantierSousTraitanceGlobalController {

    private final ChantierSousTraitanceService service;

    public ChantierSousTraitanceGlobalController(ChantierSousTraitanceService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<ContratSousTraitanceDto>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }
}
