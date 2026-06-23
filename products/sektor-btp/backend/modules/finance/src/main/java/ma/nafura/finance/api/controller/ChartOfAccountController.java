package ma.nafura.finance.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.request.ChartOfAccountCreateDto;
import ma.nafura.finance.api.request.ChartOfAccountUpdateDto;
import ma.nafura.finance.domain.model.ChartOfAccount;
import ma.nafura.finance.service.ChartOfAccountService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chart-of-accounts")
@SecuredResource(domain = "finance", feature = "finance", resource = "chart-of-account")
public class ChartOfAccountController {

    private final ChartOfAccountService service;

    public ChartOfAccountController(ChartOfAccountService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.chart-of-account.read")
    public ResponseEntity<List<ChartOfAccount>> list() {
        return ResponseEntity.ok(service.list());
    }

    @GetMapping("/{id}")
    @RequirePermission("finance.chart-of-account.read")
    public ResponseEntity<ChartOfAccount> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("finance.chart-of-account.create")
    public ResponseEntity<ChartOfAccount> create(@Valid @RequestBody ChartOfAccountCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("finance.chart-of-account.update")
    public ResponseEntity<ChartOfAccount> update(
            @PathVariable UUID id, @Valid @RequestBody ChartOfAccountUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("finance.chart-of-account.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset")
    @RequirePermission("finance.chart-of-account.update")
    public ResponseEntity<List<ChartOfAccount>> reset() {
        return ResponseEntity.ok(service.resetToSeed());
    }
}
