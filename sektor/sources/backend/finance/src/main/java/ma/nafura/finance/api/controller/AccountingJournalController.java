package ma.nafura.finance.api.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.JournalSummaryDto;
import ma.nafura.finance.api.request.AccountingJournalCreateDto;
import ma.nafura.finance.api.request.AccountingJournalUpdateDto;
import ma.nafura.finance.domain.model.AccountingJournal;
import ma.nafura.finance.service.AccountingJournalService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/journals")
@SecuredResource(domain = "finance", feature = "finance", resource = "journal")
public class AccountingJournalController {

    private final AccountingJournalService service;

    public AccountingJournalController(AccountingJournalService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.journal.read")
    public ResponseEntity<List<AccountingJournal>> list() {
        return ResponseEntity.ok(service.list());
    }

    @GetMapping("/summaries")
    @RequirePermission("finance.journal.read")
    public ResponseEntity<List<JournalSummaryDto>> summaries(
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate to) {
        return ResponseEntity.ok(service.summaries(from, to));
    }

    @GetMapping("/{id}")
    @RequirePermission("finance.journal.read")
    public ResponseEntity<AccountingJournal> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("finance.journal.create")
    public ResponseEntity<AccountingJournal> create(@Valid @RequestBody AccountingJournalCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("finance.journal.update")
    public ResponseEntity<AccountingJournal> update(
            @PathVariable UUID id, @Valid @RequestBody AccountingJournalUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("finance.journal.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
