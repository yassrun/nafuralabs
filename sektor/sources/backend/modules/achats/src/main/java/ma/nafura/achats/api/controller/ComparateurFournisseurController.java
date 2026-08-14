package ma.nafura.achats.api.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.achats.api.dto.ComparateurOffreDto;
import ma.nafura.achats.service.ComparateurFournisseurService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalogue-fournisseur/comparateur")
@SecuredResource(domain = "achats", feature = "achats", resource = "catalogue-fournisseur")
public class ComparateurFournisseurController {

    private final ComparateurFournisseurService service;

    public ComparateurFournisseurController(ComparateurFournisseurService service) {
        this.service = service;
    }

    /**
     * Compare les offres catalogue pour un article à une date.
     * Tri par prix normalisé ; lignes périmées incluses et marquées.
     */
    @GetMapping
    @RequirePermission("achats.catalogue-fournisseur.read")
    public ResponseEntity<?> comparer(
            @RequestParam UUID articleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate date) {
        try {
            List<ComparateurOffreDto> offres = service.comparer(articleId, date);
            return ResponseEntity.ok(offres);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("code", ex.getMessage()));
        }
    }
}
