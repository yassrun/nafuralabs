package ma.nafura.finance.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.CaisseMouvementDto;
import ma.nafura.finance.api.request.CaisseMouvementCreateDto;
import ma.nafura.finance.service.CaisseService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/caisse-mouvements")
@SecuredResource(domain = "finance", feature = "finance", resource = "caisse")
public class CaisseMouvementController {

    private final CaisseService service;

    public CaisseMouvementController(CaisseService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.caisse.read")
    public ResponseEntity<List<CaisseMouvementDto>> list(@RequestParam("caisseId") UUID caisseId) {
        return ResponseEntity.ok(service.listMouvements(caisseId));
    }

    @PostMapping
    @RequirePermission("finance.caisse.create")
    public ResponseEntity<CaisseMouvementDto> create(@Valid @RequestBody CaisseMouvementCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createMouvement(body));
    }

    @PostMapping("/{id}/valider")
    @RequirePermission("finance.caisse.update")
    public ResponseEntity<CaisseMouvementDto> valider(@PathVariable UUID id) {
        return ResponseEntity.ok(service.validerMouvement(id));
    }
}
