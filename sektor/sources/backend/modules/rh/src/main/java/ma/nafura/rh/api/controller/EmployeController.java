package ma.nafura.rh.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.request.EmployeCreateDto;
import ma.nafura.rh.api.request.EmployeUpdateDto;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.service.EmployeService;
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
@RequestMapping("/api/v1/rh/employes")
@SecuredResource(domain = "rh", feature = "employes", resource = "employe")
public class EmployeController {

    private final EmployeService service;

    public EmployeController(EmployeService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("rh.employes.read")
    public ResponseEntity<List<Employe>> list(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) String typeContrat,
            @RequestParam(required = false) String categorie,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(statut, typeContrat, categorie, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("rh.employes.read")
    public ResponseEntity<Employe> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("rh.employes.create")
    public ResponseEntity<Employe> create(@Valid @RequestBody EmployeCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("rh.employes.update")
    public ResponseEntity<Employe> update(@PathVariable String id, @Valid @RequestBody EmployeUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("rh.employes.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
