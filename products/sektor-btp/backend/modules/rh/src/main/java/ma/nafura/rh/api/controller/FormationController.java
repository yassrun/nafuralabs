package ma.nafura.rh.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.request.FormationCreateDto;
import ma.nafura.rh.api.request.FormationUpdateDto;
import ma.nafura.rh.domain.model.Formation;
import ma.nafura.rh.service.FormationService;
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
@RequestMapping("/api/v1/rh/formations")
@SecuredResource(domain = "rh", feature = "formations", resource = "formation")
public class FormationController {

    private final FormationService service;

    public FormationController(FormationService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("rh.formations.read")
    public ResponseEntity<List<Formation>> list(
            @RequestParam(required = false) String employeId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(employeId, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("rh.formations.read")
    public ResponseEntity<Formation> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("rh.formations.create")
    public ResponseEntity<Formation> create(@Valid @RequestBody FormationCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("rh.formations.update")
    public ResponseEntity<Formation> update(@PathVariable String id, @Valid @RequestBody FormationUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("rh.formations.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
