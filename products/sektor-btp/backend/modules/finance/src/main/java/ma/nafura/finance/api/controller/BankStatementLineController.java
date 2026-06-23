package ma.nafura.finance.api.controller;

import java.util.UUID;
import ma.nafura.finance.api.dto.BankStatementLineDto;
import ma.nafura.finance.api.request.BankStatementLineMatchDto;
import ma.nafura.finance.service.bank.BankStatementService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bank-statement-lines")
@SecuredResource(domain = "finance", feature = "finance", resource = "rapprochement")
public class BankStatementLineController {

    private final BankStatementService service;

    public BankStatementLineController(BankStatementService service) {
        this.service = service;
    }

    @PostMapping("/{id}/match")
    @RequirePermission("finance.rapprochement.update")
    public ResponseEntity<BankStatementLineDto> match(
            @PathVariable UUID id, @RequestBody BankStatementLineMatchDto body) {
        return ResponseEntity.ok(service.matchLine(id, body));
    }

    @PostMapping("/{id}/auto-match")
    @RequirePermission("finance.rapprochement.update")
    public ResponseEntity<BankStatementLineDto> autoMatch(@PathVariable UUID id) {
        return ResponseEntity.ok(service.autoMatchLine(id));
    }
}
