package ma.nafura.achats.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.achats.api.dto.ConsultationAchatDto;
import ma.nafura.achats.api.request.ConsultationAchatCreateDto;
import ma.nafura.achats.api.request.ConsultationAchatPanierDto;
import ma.nafura.achats.api.request.ConsultationDestinataireCreateDto;
import ma.nafura.achats.api.request.ConsultationDestinatairesSaveDto;
import ma.nafura.achats.api.request.ConsultationDevisImportDto;
import ma.nafura.achats.service.ConsultationAchatService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/consultations-achat")
@SecuredResource(domain = "achats", feature = "achats", resource = "consultation")
public class ConsultationAchatController {

    private final ConsultationAchatService service;

    public ConsultationAchatController(ConsultationAchatService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("achats.consultation.read")
    public ResponseEntity<List<ConsultationAchatDto>> list(
            @RequestParam(required = false) String lien,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) UUID fournisseurId,
            @RequestParam(required = false) UUID articleId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(service.list(lien, statut, fournisseurId, articleId, search));
    }

    @GetMapping("/{id}")
    @RequirePermission("achats.consultation.read")
    public ResponseEntity<ConsultationAchatDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("achats.consultation.create")
    public ResponseEntity<ConsultationAchatDto> create(@Valid @RequestBody ConsultationAchatCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PostMapping("/{id}/destinataires")
    @RequirePermission("achats.consultation.create")
    public ResponseEntity<ConsultationAchatDto> addDestinataire(
            @PathVariable UUID id, @Valid @RequestBody ConsultationDestinataireCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addDestinataire(id, body));
    }

    @PutMapping("/{id}/destinataires")
    @RequirePermission("achats.consultation.create")
    public ResponseEntity<ConsultationAchatDto> saveDestinataires(
            @PathVariable UUID id, @RequestBody ConsultationDestinatairesSaveDto body) {
        return ResponseEntity.ok(service.saveDestinataires(id, body));
    }

    @PatchMapping("/{id}/panier")
    @RequirePermission("achats.consultation.create")
    public ResponseEntity<ConsultationAchatDto> addToPanier(
            @PathVariable UUID id, @RequestBody ConsultationAchatPanierDto body) {
        return ResponseEntity.ok(service.addToPanier(id, body));
    }

    @PostMapping("/{id}/envoyer")
    @RequirePermission("achats.consultation.create")
    public ResponseEntity<ConsultationAchatDto> envoyer(@PathVariable UUID id) {
        return ResponseEntity.ok(service.envoyer(id));
    }

    @PostMapping("/{id}/devis")
    @RequirePermission("achats.consultation.create")
    public ResponseEntity<ConsultationAchatDto> importDevis(
            @PathVariable UUID id, @RequestBody ConsultationDevisImportDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.importDevis(id, body));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> onBadRequest(IllegalArgumentException ex) {
        String code = ex.getMessage() != null ? ex.getMessage() : "bad_request";
        HttpStatus status = "consultation.introuvable".equals(code)
                        || "consultation.fournisseur.introuvable".equals(code)
                ? HttpStatus.NOT_FOUND
                : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(Map.of("code", code));
    }
}
