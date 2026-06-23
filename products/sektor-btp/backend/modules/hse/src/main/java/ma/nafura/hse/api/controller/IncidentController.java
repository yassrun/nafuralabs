package ma.nafura.hse.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.hse.api.dto.CnssDatDeclarationResultDto;
import ma.nafura.hse.api.request.IncidentCreateDto;
import ma.nafura.hse.api.request.IncidentUpdateDto;
import ma.nafura.hse.domain.model.Incident;
import ma.nafura.hse.service.IncidentService;
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
@RequestMapping("/api/v1/hse/incidents")
@SecuredResource(domain = "hse", feature = "incidents", resource = "incident")
public class IncidentController {

    private final IncidentService service;

    public IncidentController(IncidentService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("hse.incidents.read")
    public ResponseEntity<List<Incident>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String gravite,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(status, gravite, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("hse.incidents.read")
    public ResponseEntity<Incident> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("hse.incidents.create")
    public ResponseEntity<Incident> create(@Valid @RequestBody IncidentCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("hse.incidents.update")
    public ResponseEntity<Incident> update(@PathVariable String id, @Valid @RequestBody IncidentUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("hse.incidents.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/investiguer")
    @RequirePermission("hse.incidents.update")
    public ResponseEntity<Incident> investiguer(@PathVariable String id) {
        return ResponseEntity.ok(service.investiguer(id));
    }

    @PostMapping("/{id}/clore")
    @RequirePermission("hse.incidents.update")
    public ResponseEntity<Incident> clore(@PathVariable String id) {
        return ResponseEntity.ok(service.clore(id));
    }

    @PostMapping("/{id}/declarer-cnss-dat")
    @RequirePermission("hse.incidents.update")
    public ResponseEntity<CnssDatDeclarationResultDto> declarerCnssDat(@PathVariable String id) {
        return ResponseEntity.ok(service.declarerCnssDat(id));
    }
}
