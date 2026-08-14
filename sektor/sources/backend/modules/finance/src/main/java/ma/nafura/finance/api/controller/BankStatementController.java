package ma.nafura.finance.api.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.BankStatementDto;
import ma.nafura.finance.api.dto.BankStatementLineDto;
import ma.nafura.finance.api.request.BankStatementLineMatchDto;
import ma.nafura.finance.api.request.BankStatementSaveDto;
import ma.nafura.finance.service.bank.BankStatementService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/bank-statements")
@SecuredResource(domain = "finance", feature = "finance", resource = "rapprochement")
public class BankStatementController {

    private final BankStatementService service;

    public BankStatementController(BankStatementService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.rapprochement.read")
    public ResponseEntity<List<BankStatementDto>> list(
            @RequestParam(value = "bankAccountId", required = false) UUID bankAccountId) {
        return ResponseEntity.ok(service.listStatements(bankAccountId));
    }

    @GetMapping("/{id}")
    @RequirePermission("finance.rapprochement.read")
    public ResponseEntity<BankStatementDto> get(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getStatement(id));
    }

    @GetMapping("/{id}/lines")
    @RequirePermission("finance.rapprochement.read")
    public ResponseEntity<List<BankStatementLineDto>> lines(@PathVariable UUID id) {
        return ResponseEntity.ok(service.listLines(id));
    }

    @PostMapping
    @RequirePermission("finance.rapprochement.create")
    public ResponseEntity<BankStatementDto> create(@Valid @RequestBody BankStatementSaveDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(null, body));
    }

    @PutMapping("/{id}")
    @RequirePermission("finance.rapprochement.update")
    public ResponseEntity<BankStatementDto> update(@PathVariable UUID id, @Valid @RequestBody BankStatementSaveDto body) {
        return ResponseEntity.ok(service.save(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("finance.rapprochement.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.deleteStatement(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequirePermission("finance.rapprochement.create")
    public ResponseEntity<BankStatementDto> importFile(
            @RequestParam("bankAccountId") UUID bankAccountId,
            @RequestParam(value = "periodStart", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate periodStart,
            @RequestParam(value = "periodEnd", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate periodEnd,
            @RequestParam("file") MultipartFile file)
            throws java.io.IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.importStatement(bankAccountId, periodStart, periodEnd, file));
    }

    @PostMapping("/{id}/auto-match")
    @RequirePermission("finance.rapprochement.update")
    public ResponseEntity<BankStatementDto> autoMatchStatement(@PathVariable UUID id) {
        return ResponseEntity.ok(service.autoMatchStatement(id));
    }
}
