package ma.nafura.marches.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.marches.api.request.BpuLigneInputDto;
import ma.nafura.marches.api.request.ContratMarcheCreateDto;
import ma.nafura.marches.api.request.ContratMarcheUpdateDto;
import ma.nafura.marches.api.request.ReceptionDefinitiveDto;
import ma.nafura.marches.api.request.ReceptionProvisoireDto;
import ma.nafura.marches.domain.model.BpuLigne;
import ma.nafura.marches.domain.model.ContratMarche;
import ma.nafura.marches.domain.model.ReceptionMarche;
import ma.nafura.marches.service.ContratMarcheService;
import ma.nafura.marches.service.ReceptionMarcheService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/marches/contrats")
@SecuredResource(domain = "marches", feature = "marches", resource = "contrat-marche")
public class ContratMarcheController {

    private final ContratMarcheService service;
    private final ReceptionMarcheService receptionService;

    public ContratMarcheController(ContratMarcheService service, ReceptionMarcheService receptionService) {
        this.service = service;
        this.receptionService = receptionService;
    }

    @GetMapping
    @RequirePermission("marches.contrat-marche.read")
    public ResponseEntity<List<ContratMarche>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String chantierId,
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {
        String effectiveSearch = search != null && !search.isBlank() ? search : q;
        return ResponseEntity.ok(service.list(status, chantierId, clientId, effectiveSearch));
    }

    @GetMapping("/{id}")
    @RequirePermission("marches.contrat-marche.read")
    public ResponseEntity<ContratMarche> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("marches.contrat-marche.create")
    public ResponseEntity<ContratMarche> create(@Valid @RequestBody ContratMarcheCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("marches.contrat-marche.update")
    public ResponseEntity<ContratMarche> update(
            @PathVariable String id, @Valid @RequestBody ContratMarcheUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("marches.contrat-marche.delete")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/notifier")
    @RequirePermission("marches.contrat-marche.update")
    public ResponseEntity<ContratMarche> notifier(@PathVariable String id) {
        return ResponseEntity.ok(service.notifier(id));
    }

    @PostMapping("/{id}/cloturer")
    @RequirePermission("marches.contrat-marche.update")
    public ResponseEntity<ContratMarche> cloturer(@PathVariable String id) {
        return ResponseEntity.ok(service.cloturer(id));
    }

    @GetMapping("/{id}/lignes")
    @RequirePermission("marches.contrat-marche.read")
    public ResponseEntity<List<BpuLigne>> listLignes(@PathVariable String id) {
        return ResponseEntity.ok(service.listLignes(id));
    }

    @PostMapping("/{id}/lignes")
    @RequirePermission("marches.contrat-marche.update")
    public ResponseEntity<BpuLigne> addLigne(
            @PathVariable String id, @Valid @RequestBody BpuLigneInputDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addLigne(id, body));
    }

    @PostMapping("/{id}/reception-provisoire")
    @RequirePermission("marches.reception.create")
    public ResponseEntity<ReceptionMarche> receptionProvisoire(
            @PathVariable String id, @RequestBody(required = false) ReceptionProvisoireDto body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(receptionService.receptionProvisoire(id, body));
    }

    @PostMapping("/{id}/reception-definitive")
    @RequirePermission("marches.reception.create")
    public ResponseEntity<ReceptionMarche> receptionDefinitive(
            @PathVariable String id, @RequestBody(required = false) ReceptionDefinitiveDto body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(receptionService.receptionDefinitive(id, body));
    }
}
