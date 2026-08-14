package ma.nafura.approbations.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.approbations.api.request.DelegationApprobationCreateDto;
import ma.nafura.approbations.api.request.DelegationApprobationUpdateDto;
import ma.nafura.approbations.domain.model.DelegationApprobation;
import ma.nafura.approbations.service.DelegationApprobationService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
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
@RequestMapping("/api/v1/approbations/delegations")
@SecuredResource(domain = "approbations", feature = "delegations", resource = "delegation")
public class DelegationApprobationController {

    private final DelegationApprobationService service;

    public DelegationApprobationController(DelegationApprobationService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("approbations.delegations.read")
    public ResponseEntity<List<DelegationApprobation>> list(@RequestParam(required = false) String userId) {
        return ResponseEntity.ok(service.list(userId));
    }

    @GetMapping("/{id}")
    @RequirePermission("approbations.delegations.read")
    public ResponseEntity<DelegationApprobation> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("approbations.delegations.create")
    public ResponseEntity<DelegationApprobation> create(@Valid @RequestBody DelegationApprobationCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("approbations.delegations.update")
    public ResponseEntity<DelegationApprobation> update(
            @PathVariable UUID id, @Valid @RequestBody DelegationApprobationUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("approbations.delegations.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
