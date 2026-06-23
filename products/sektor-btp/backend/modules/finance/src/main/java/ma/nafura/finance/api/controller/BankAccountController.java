package ma.nafura.finance.api.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.BankAccountDto;
import ma.nafura.finance.api.dto.MovementCandidateDto;
import ma.nafura.finance.service.bank.BankStatementService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/bank-accounts")
@SecuredResource(domain = "finance", feature = "finance", resource = "rapprochement")
public class BankAccountController {

    private final BankStatementService service;

    public BankAccountController(BankStatementService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.rapprochement.read")
    public ResponseEntity<List<BankAccountDto>> list() {
        return ResponseEntity.ok(service.listAccounts());
    }

    @GetMapping("/{id}/balance")
    @RequirePermission("finance.rapprochement.read")
    public ResponseEntity<BigDecimal> balance(
            @PathVariable UUID id,
            @RequestParam("at") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate at) {
        return ResponseEntity.ok(service.computeAccountingBalance(id, at));
    }

    @GetMapping("/{id}/movement-candidates")
    @RequirePermission("finance.rapprochement.read")
    public ResponseEntity<List<MovementCandidateDto>> movementCandidates(
            @PathVariable UUID id,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "excludeStatementId", required = false) UUID excludeStatementId) {
        return ResponseEntity.ok(service.listMovementCandidates(id, from, to, excludeStatementId));
    }
}
