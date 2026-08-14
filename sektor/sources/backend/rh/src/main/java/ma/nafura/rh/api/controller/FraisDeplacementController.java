package ma.nafura.rh.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.request.FraisDeplacementCreateDto;
import ma.nafura.rh.api.request.FraisDeplacementRejectDto;
import ma.nafura.rh.api.request.FraisDeplacementUpdateDto;
import ma.nafura.rh.domain.model.FraisDeplacement;
import ma.nafura.rh.service.FraisDeplacementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rh/frais-deplacement")
@SecuredResource(domain = "rh", feature = "frais-deplacement", resource = "frais-deplacement")
public class FraisDeplacementController {

    private final FraisDeplacementService service;

    public FraisDeplacementController(FraisDeplacementService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("rh.frais-deplacement.read")
    public ResponseEntity<List<FraisDeplacement>> list(
            @RequestParam(required = false) String employeId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(service.list(employeId, status));
    }

    @GetMapping("/{id}")
    @RequirePermission("rh.frais-deplacement.read")
    public ResponseEntity<FraisDeplacement> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("rh.frais-deplacement.create")
    public ResponseEntity<FraisDeplacement> create(@Valid @RequestBody FraisDeplacementCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("rh.frais-deplacement.update")
    public ResponseEntity<FraisDeplacement> update(
            @PathVariable String id, @Valid @RequestBody FraisDeplacementUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("rh.frais-deplacement.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    @RequirePermission("rh.frais-deplacement.update")
    public ResponseEntity<FraisDeplacement> submit(@PathVariable String id) {
        return ResponseEntity.ok(service.submit(id));
    }

    @PostMapping("/{id}/approve")
    @RequirePermission("rh.frais-deplacement.update")
    public ResponseEntity<FraisDeplacement> approve(@PathVariable String id) {
        return ResponseEntity.ok(service.approve(id));
    }

    @PostMapping("/{id}/reject")
    @RequirePermission("rh.frais-deplacement.update")
    public ResponseEntity<FraisDeplacement> reject(
            @PathVariable String id, @Valid @RequestBody FraisDeplacementRejectDto body) {
        return ResponseEntity.ok(service.reject(id, body.getMotifRejet()));
    }

    @PostMapping("/{id}/integrer-paie")
    @RequirePermission("rh.frais-deplacement.update")
    public ResponseEntity<FraisDeplacement> integrerPaie(@PathVariable String id) {
        return ResponseEntity.ok(service.integrerPaie(id));
    }
}
