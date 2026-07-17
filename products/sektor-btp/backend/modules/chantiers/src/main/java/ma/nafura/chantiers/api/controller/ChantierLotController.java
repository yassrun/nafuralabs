package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.chantiers.api.dto.ChantierLotTreeResponseDto;
import ma.nafura.chantiers.api.request.ChantierLotCreateDto;
import ma.nafura.chantiers.api.request.ChantierLotTreeRequestDto;
import ma.nafura.chantiers.api.request.ChantierLotUpdateDto;
import ma.nafura.chantiers.domain.model.ChantierLot;
import ma.nafura.chantiers.service.ChantierLotService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/lots")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "chantier-lot")
public class ChantierLotController {

    private final ChantierLotService service;

    public ChantierLotController(ChantierLotService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<ChantierLot>> list(@PathVariable String chantierId) {
        return ResponseEntity.ok(service.listByChantier(chantierId));
    }

    @PostMapping
    @RequirePermission("chantiers.create")
    public ResponseEntity<ChantierLot> create(
            @PathVariable String chantierId, @Valid @RequestBody ChantierLotCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(chantierId, body));
    }

    @PostMapping("/tree")
    @RequirePermission("chantiers.create")
    public ResponseEntity<ChantierLotTreeResponseDto> createTree(
            @PathVariable String chantierId, @Valid @RequestBody ChantierLotTreeRequestDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createTree(chantierId, body));
    }

    @PutMapping("/{lotId}")
    @RequirePermission("chantiers.update")
    public ResponseEntity<ChantierLot> update(
            @PathVariable String chantierId,
            @PathVariable String lotId,
            @Valid @RequestBody ChantierLotUpdateDto body) {
        return ResponseEntity.ok(service.update(chantierId, lotId, body));
    }

    @DeleteMapping("/{lotId}")
    @RequirePermission("chantiers.delete")
    public ResponseEntity<Void> delete(
            @PathVariable String chantierId, @PathVariable String lotId) {
        service.delete(chantierId, lotId);
        return ResponseEntity.noContent().build();
    }
}
