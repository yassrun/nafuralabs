package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import ma.nafura.chantiers.api.dto.BudgetChantierDto;
import ma.nafura.chantiers.api.request.BudgetChantierUpsertDto;
import ma.nafura.chantiers.service.BudgetChantierService;
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
@RequestMapping("/api/v1/chantiers/{chantierId}/budget")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "budget-chantier")
public class BudgetChantierController {

    private final BudgetChantierService service;

    public BudgetChantierController(BudgetChantierService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<BudgetChantierDto> get(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.getByChantierId(chantierId));
    }

    @PostMapping
    @RequirePermission("chantiers.update")
    public ResponseEntity<BudgetChantierDto> upsert(
            @PathVariable String chantierId, @Valid @RequestBody BudgetChantierUpsertDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.upsert(chantierId, body));
    }
}
