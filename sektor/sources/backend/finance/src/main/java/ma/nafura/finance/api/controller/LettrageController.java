package ma.nafura.finance.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.finance.api.dto.LettrageAutoMatchDto;
import ma.nafura.finance.api.dto.LettrageCandidateDto;
import ma.nafura.finance.api.dto.LettrageDetailDto;
import ma.nafura.finance.api.request.LettrageAutoMatchRequestDto;
import ma.nafura.finance.api.request.LettrageCreateDto;
import ma.nafura.finance.service.LettrageService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/lettrage")
@SecuredResource(domain = "finance", feature = "finance", resource = "lettrage")
public class LettrageController {

    private final LettrageService service;

    public LettrageController(LettrageService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.lettrage.read")
    public ResponseEntity<List<LettrageDetailDto>> list() {
        return ResponseEntity.ok(service.list());
    }

    @GetMapping("/non-lettrees")
    @RequirePermission("finance.lettrage.read")
    public ResponseEntity<List<LettrageCandidateDto>> nonLettrees(
            @RequestParam("account") String account,
            @RequestParam(value = "partnerId", required = false) String partnerId) {
        return ResponseEntity.ok(service.listNonLettrees(account, partnerId));
    }

    @PostMapping
    @RequirePermission("finance.lettrage.create")
    public ResponseEntity<LettrageDetailDto> create(@Valid @RequestBody LettrageCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PostMapping("/auto-match")
    @RequirePermission("finance.lettrage.create")
    public ResponseEntity<LettrageAutoMatchDto> autoMatch(@Valid @RequestBody LettrageAutoMatchRequestDto body) {
        return ResponseEntity.ok(service.autoMatch(body));
    }

    @DeleteMapping("/{code}")
    @RequirePermission("finance.lettrage.delete")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        service.deleteByCode(code);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/{code}/export.csv", produces = "text/csv")
    @RequirePermission("finance.lettrage.read")
    public ResponseEntity<String> exportCsv(@PathVariable String code) {
        String csv = service.exportCsv(code);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"lettrage-" + code + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
