package ma.nafura.consultation.api.controller;

import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.consultation.api.request.ConsultationCreateDto;
import ma.nafura.consultation.api.request.ImportTreeRequest;
import ma.nafura.consultation.api.request.NoeudCreateDto;
import ma.nafura.consultation.api.request.SetStepRequest;
import ma.nafura.consultation.domain.model.Consultation;
import ma.nafura.consultation.domain.model.ConsultationNoeud;
import ma.nafura.consultation.service.ConsultationNoeudService;
import ma.nafura.consultation.service.ConsultationService;
import ma.nafura.consultation.service.port.BordereauExtractionPort;
import ma.nafura.consultation.service.port.CpsDescriptifExtractionPort;
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
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/consultation/consultations")
@SecuredResource(domain = "consultation", feature = "consultation", resource = "consultation")
public class ConsultationController {

    private final ConsultationService service;
    private final ConsultationNoeudService noeudService;
    private final BordereauExtractionPort extractionPort;
    private final CpsDescriptifExtractionPort descriptifExtractionPort;

    public ConsultationController(
            ConsultationService service,
            ConsultationNoeudService noeudService,
            BordereauExtractionPort extractionPort,
            CpsDescriptifExtractionPort descriptifExtractionPort) {
        this.service = service;
        this.noeudService = noeudService;
        this.extractionPort = extractionPort;
        this.descriptifExtractionPort = descriptifExtractionPort;
    }

    @GetMapping
    @RequirePermission("consultation.read")
    public ResponseEntity<List<Consultation>> list() {
        return ResponseEntity.ok(service.list());
    }

    @GetMapping("/{id}")
    @RequirePermission("consultation.read")
    public ResponseEntity<Consultation> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("consultation.create")
    public ResponseEntity<Consultation> create(@Valid @RequestBody ConsultationCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PostMapping("/{id}/noeuds")
    @RequirePermission("consultation.update")
    public ResponseEntity<ConsultationNoeud> createNoeud(
            @PathVariable UUID id, @Valid @RequestBody NoeudCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noeudService.createNoeud(id, body));
    }

    @PutMapping("/{id}/step")
    @RequirePermission("consultation.update")
    public ResponseEntity<Consultation> setStep(
            @PathVariable UUID id, @Valid @RequestBody SetStepRequest body) {
        return ResponseEntity.ok(service.setStep(id, body.getStep()));
    }

    @PostMapping("/{id}/submit-for-validation")
    @RequirePermission("consultation.update")
    public ResponseEntity<Consultation> submitForValidation(@PathVariable UUID id) {
        return ResponseEntity.ok(service.submitForValidation(id));
    }

    @PostMapping("/{id}/import-tree")
    @RequirePermission("consultation.update")
    public ResponseEntity<Consultation> importTree(
            @PathVariable UUID id, @RequestBody ImportTreeRequest body) {
        return ResponseEntity.ok(service.importTree(id, body));
    }

    /**
     * Upload a bordereau / CPS and let the extraction port build the draft tree.
     * If no extraction adapter is wired, returns 501 so the client falls back to
     * manual {@code import-tree}.
     */
    @PostMapping("/{id}/extract")
    @RequirePermission("consultation.update")
    public ResponseEntity<?> extract(@PathVariable UUID id, @RequestParam("file") MultipartFile file) {
        if (!extractionPort.isAvailable()) {
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of(
                    "status", "EXTRACTION_UNAVAILABLE",
                    "message", "Aucun adaptateur d'extraction actif — utilisez l'import manuel de l'arbre."));
        }
        try {
            ImportTreeRequest tree = extractionPort.extract(
                    file.getBytes(), file.getOriginalFilename(), file.getContentType());
            return ResponseEntity.ok(service.importTree(id, tree));
        } catch (IOException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "READ_ERROR", "message", "Impossible de lire le fichier"));
        }
    }

    /**
     * Second pass: upload the CPS / CCTP and enrich each existing poste with its
     * technical descriptif (matched by code). Requires the tree to already exist
     * (run the bordereau import first). Returns a small match report.
     */
    @PostMapping("/{id}/extract-descriptifs")
    @RequirePermission("consultation.update")
    public ResponseEntity<?> extractDescriptifs(@PathVariable UUID id, @RequestParam("file") MultipartFile file) {
        if (!descriptifExtractionPort.isAvailable()) {
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of(
                    "status", "DESCRIPTIF_EXTRACTION_UNAVAILABLE",
                    "message", "Extraction des descriptifs indisponible sur ce serveur."));
        }
        List<CpsDescriptifExtractionPort.PosteRef> postes = service.collectPosteRefs(id);
        if (postes.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "NO_POSTES",
                    "message", "Importez d'abord le bordereau : aucun poste à enrichir."));
        }
        try {
            List<CpsDescriptifExtractionPort.DescriptifResult> results = descriptifExtractionPort.extractDescriptifs(
                    file.getBytes(), file.getOriginalFilename(), file.getContentType(), postes);
            return ResponseEntity.ok(service.applyDescriptifsFromCps(id, results));
        } catch (IOException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "READ_ERROR", "message", "Impossible de lire le fichier"));
        }
    }

    @PostMapping("/{id}/validate")
    @RequirePermission("consultation.update")
    public ResponseEntity<Consultation> validate(@PathVariable UUID id) {
        return ResponseEntity.ok(service.validate(id));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("consultation.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
