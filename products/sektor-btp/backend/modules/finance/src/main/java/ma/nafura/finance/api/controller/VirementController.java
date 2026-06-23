package ma.nafura.finance.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.VirementDto;
import ma.nafura.finance.api.request.VirementInterneCreateDto;
import ma.nafura.finance.api.request.VirementRemiseCreateDto;
import ma.nafura.finance.service.VirementService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/virements")
@SecuredResource(domain = "finance", feature = "finance", resource = "virement")
public class VirementController {

    private final VirementService service;

    public VirementController(VirementService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.virement.read")
    public ResponseEntity<List<VirementDto>> list(
            @RequestParam(value = "type", required = false, defaultValue = "REMISE") String type,
            @RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(service.list(type, status));
    }

    @GetMapping("/{id}")
    @RequirePermission("finance.virement.read")
    public ResponseEntity<VirementDto> get(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping("/internes")
    @RequirePermission("finance.virement.create")
    public ResponseEntity<VirementDto> createInterne(@Valid @RequestBody VirementInterneCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createInterne(body));
    }

    @PostMapping
    @RequirePermission("finance.virement.create")
    public ResponseEntity<VirementDto> createRemise(@Valid @RequestBody VirementRemiseCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createRemise(body));
    }

    @PostMapping("/{id}/valider")
    @RequirePermission("finance.virement.update")
    public ResponseEntity<VirementDto> valider(@PathVariable UUID id) {
        return ResponseEntity.ok(service.validerInterne(id));
    }

    @PostMapping("/{id}/annuler")
    @RequirePermission("finance.virement.update")
    public ResponseEntity<VirementDto> annuler(@PathVariable UUID id) {
        return ResponseEntity.ok(service.annulerInterne(id));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("finance.virement.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.deleteInterne(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/generate-xml")
    @RequirePermission("finance.virement.update")
    public ResponseEntity<VirementDto> generateXml(
            @PathVariable UUID id, @RequestParam(value = "banque", required = false) String banque) {
        return ResponseEntity.ok(service.generateXml(id, banque));
    }

    @PostMapping("/{id}/marquer-envoye")
    @RequirePermission("finance.virement.update")
    public ResponseEntity<VirementDto> marquerEnvoye(@PathVariable UUID id) {
        return ResponseEntity.ok(service.marquerEnvoye(id));
    }

    @GetMapping(value = "/{id}/xml", produces = MediaType.APPLICATION_XML_VALUE)
    @RequirePermission("finance.virement.read")
    public ResponseEntity<String> downloadXml(@PathVariable UUID id) {
        VirementDto dto = service.getById(id);
        if (dto.getGeneratedXml() == null || dto.getGeneratedXml().isBlank()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto.getGeneratedXml());
    }
}
