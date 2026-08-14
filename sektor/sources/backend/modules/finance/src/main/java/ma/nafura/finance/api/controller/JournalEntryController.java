package ma.nafura.finance.api.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.JournalEntryDetailDto;
import ma.nafura.finance.api.request.JournalEntryCreateDto;
import ma.nafura.finance.api.request.JournalEntryUpdateDto;
import ma.nafura.finance.service.JournalEntryService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/journal-entries")
@SecuredResource(domain = "finance", feature = "finance", resource = "journal-entry")
public class JournalEntryController {

    private final JournalEntryService service;

    public JournalEntryController(JournalEntryService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.journal-entry.read")
    public ResponseEntity<List<JournalEntryDetailDto>> list(
            @RequestParam(value = "journalCode", required = false) String journalCode,
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate to,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "search", required = false) String search) {
        return ResponseEntity.ok(service.list(journalCode, from, to, status, search));
    }

    @GetMapping("/{id}")
    @RequirePermission("finance.journal-entry.read")
    public ResponseEntity<JournalEntryDetailDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("finance.journal-entry.create")
    public ResponseEntity<JournalEntryDetailDto> create(@Valid @RequestBody JournalEntryCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("finance.journal-entry.update")
    public ResponseEntity<JournalEntryDetailDto> update(
            @PathVariable UUID id, @Valid @RequestBody JournalEntryUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("finance.journal-entry.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/post")
    @RequirePermission("finance.journal-entry.update")
    public ResponseEntity<JournalEntryDetailDto> post(@PathVariable UUID id) {
        return ResponseEntity.ok(service.post(id));
    }
}
