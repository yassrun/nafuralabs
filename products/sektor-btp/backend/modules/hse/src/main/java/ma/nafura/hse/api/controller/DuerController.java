package ma.nafura.hse.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.hse.api.request.DuerCreateDto;
import ma.nafura.hse.api.request.DuerRisqueCreateDto;
import ma.nafura.hse.api.request.DuerRisquesReplaceDto;
import ma.nafura.hse.domain.model.Duer;
import ma.nafura.hse.domain.model.DuerRisque;
import ma.nafura.hse.service.DuerService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hse/duer")
@SecuredResource(domain = "hse", feature = "duer", resource = "duer")
public class DuerController {

    private final DuerService service;

    public DuerController(DuerService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("hse.duer.read")
    public ResponseEntity<List<Duer>> list(
            @RequestParam(required = false) String chantierId,
            @RequestParam(required = false) String societeId) {
        return ResponseEntity.ok(service.list(chantierId, societeId));
    }

    @PostMapping
    @RequirePermission("hse.duer.create")
    public ResponseEntity<Duer> create(@Valid @RequestBody DuerCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @GetMapping("/{id}/risques")
    @RequirePermission("hse.duer.read")
    public ResponseEntity<List<DuerRisque>> listRisques(@PathVariable String id) {
        return ResponseEntity.ok(service.listRisques(id));
    }

    @PostMapping("/{id}/risques")
    @RequirePermission("hse.duer.update")
    public ResponseEntity<DuerRisque> addRisque(
            @PathVariable String id, @Valid @RequestBody DuerRisqueCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addRisque(id, body));
    }

    @PutMapping("/{id}/risques")
    @RequirePermission("hse.duer.update")
    public ResponseEntity<Void> replaceRisques(
            @PathVariable String id, @Valid @RequestBody DuerRisquesReplaceDto body) {
        service.replaceRisques(id, body.getRisques());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf")
    @RequirePermission("hse.duer.read")
    public ResponseEntity<Void> pdf(@PathVariable String id) {
        service.getById(id);
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }
}
