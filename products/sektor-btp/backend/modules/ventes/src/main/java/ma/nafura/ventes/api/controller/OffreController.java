package ma.nafura.ventes.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.ventes.api.dto.OffreConvertResultDto;
import ma.nafura.ventes.api.request.OffreCreateDto;
import ma.nafura.ventes.api.request.OffreRefusDto;
import ma.nafura.ventes.api.request.OffreUpdateDto;
import ma.nafura.ventes.domain.model.Offre;
import ma.nafura.ventes.service.OffreService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/offres-commerciales")
@SecuredResource(domain = "ventes", feature = "ventes", resource = "offres")
public class OffreController {

    private final OffreService service;

    public OffreController(OffreService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("ventes.offres.read")
    public ResponseEntity<List<Offre>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(status, clientId, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("ventes.offres.read")
    public ResponseEntity<Offre> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("ventes.offres.create")
    public ResponseEntity<Offre> create(@Valid @RequestBody OffreCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("ventes.offres.update")
    public ResponseEntity<Offre> update(@PathVariable UUID id, @Valid @RequestBody OffreUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("ventes.offres.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/send")
    @RequirePermission("ventes.offres.update")
    public ResponseEntity<Offre> send(@PathVariable UUID id) {
        return ResponseEntity.ok(service.send(id));
    }

    @PostMapping("/{id}/accept")
    @RequirePermission("ventes.offres.update")
    public ResponseEntity<Offre> accept(@PathVariable UUID id) {
        return ResponseEntity.ok(service.accept(id));
    }

    @PostMapping("/{id}/refuse")
    @RequirePermission("ventes.offres.update")
    public ResponseEntity<Offre> refuse(@PathVariable UUID id, @Valid @RequestBody OffreRefusDto body) {
        return ResponseEntity.ok(service.refuse(id, body.getMotifRefus()));
    }

    @PostMapping("/{id}/cancel")
    @RequirePermission("ventes.offres.update")
    public ResponseEntity<Offre> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(service.cancel(id));
    }

    @PostMapping("/{id}/convert-to-bcc")
    @RequirePermission("ventes.offres.update")
    public ResponseEntity<OffreConvertResultDto> convertToBcc(@PathVariable UUID id) {
        return ResponseEntity.ok(service.convertToBcc(id));
    }
}
