package ma.nafura.finance.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.TradeEffectDto;
import ma.nafura.finance.api.request.TradeEffectCreateDto;
import ma.nafura.finance.service.TradeEffectService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/effets")
@SecuredResource(domain = "finance", feature = "finance", resource = "effet")
public class EffetCommerceController {

    private final TradeEffectService service;

    public EffetCommerceController(TradeEffectService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.effet.read")
    public ResponseEntity<List<TradeEffectDto>> list(@RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(service.list(status));
    }

    @PostMapping
    @RequirePermission("finance.effet.create")
    public ResponseEntity<TradeEffectDto> create(@Valid @RequestBody TradeEffectCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PostMapping("/{id}/remise-encaissement")
    @RequirePermission("finance.effet.update")
    public ResponseEntity<TradeEffectDto> remiseEncaissement(@PathVariable UUID id) {
        return ResponseEntity.ok(service.remiseEncaissement(id));
    }

    @PostMapping("/{id}/escompte")
    @RequirePermission("finance.effet.update")
    public ResponseEntity<TradeEffectDto> escompte(
            @PathVariable UUID id, @RequestParam(value = "frais", required = false) java.math.BigDecimal frais) {
        return ResponseEntity.ok(service.escompte(id, frais));
    }

    @PostMapping("/{id}/impaye")
    @RequirePermission("finance.effet.update")
    public ResponseEntity<TradeEffectDto> impaye(@PathVariable UUID id) {
        return ResponseEntity.ok(service.impaye(id));
    }
}
