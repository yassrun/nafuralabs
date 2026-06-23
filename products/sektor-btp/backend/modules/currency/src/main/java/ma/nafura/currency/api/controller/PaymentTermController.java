package ma.nafura.currency.api.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import ma.nafura.currency.api.dto.PaymentTermDetailDto;
import ma.nafura.currency.api.request.PaymentTermCreateDto;
import ma.nafura.currency.api.request.PaymentTermUpdateDto;
import ma.nafura.currency.service.PaymentTermService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payment-terms")
@SecuredResource(domain = "currency", feature = "currency", resource = "payment-term")
public class PaymentTermController {

    private final PaymentTermService service;

    public PaymentTermController(PaymentTermService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("currency.payment-term.read")
    public ResponseEntity<Page<PaymentTermDetailDto>> list(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "sort", required = false) String sort) {
        return ResponseEntity.ok(service.listDetailed(page, size, search, sort));
    }

    @GetMapping("/{id}")
    @RequirePermission("currency.payment-term.read")
    public ResponseEntity<PaymentTermDetailDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getDetailed(id));
    }

    @PostMapping
    @RequirePermission("currency.payment-term.create")
    public ResponseEntity<PaymentTermDetailDto> create(@Valid @RequestBody PaymentTermCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createDetailed(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("currency.payment-term.update")
    public ResponseEntity<PaymentTermDetailDto> update(
            @PathVariable UUID id, @Valid @RequestBody PaymentTermUpdateDto body) {
        return ResponseEntity.ok(service.updateDetailed(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("currency.payment-term.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
