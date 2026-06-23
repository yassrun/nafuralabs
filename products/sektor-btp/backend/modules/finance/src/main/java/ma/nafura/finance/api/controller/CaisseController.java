package ma.nafura.finance.api.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.CaisseDto;
import ma.nafura.finance.service.CaisseService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/caisses")
@SecuredResource(domain = "finance", feature = "finance", resource = "caisse")
public class CaisseController {

    private final CaisseService service;

    public CaisseController(CaisseService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.caisse.read")
    public ResponseEntity<List<CaisseDto>> list(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "chantierId", required = false) String chantierId) {
        return ResponseEntity.ok(service.list(type, chantierId));
    }

    @GetMapping("/{id}/solde")
    @RequirePermission("finance.caisse.read")
    public ResponseEntity<BigDecimal> solde(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getSolde(id));
    }
}
