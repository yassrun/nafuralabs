package ma.nafura.rh.api.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.dto.HeureSupplementaireSyntheseDto;
import ma.nafura.rh.api.request.HeureSupplementaireCreateDto;
import ma.nafura.rh.domain.model.HeureSupplementaire;
import ma.nafura.rh.service.HeureSupplementaireService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rh/heures-sup")
@SecuredResource(domain = "rh", feature = "heures-sup", resource = "heure-supplementaire")
public class HeureSupplementaireController {

    private final HeureSupplementaireService service;

    public HeureSupplementaireController(HeureSupplementaireService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("rh.heures-sup.read")
    public ResponseEntity<List<HeureSupplementaire>> list(
            @RequestParam(required = false) String employeId,
            @RequestParam(required = false) String mois) {
        return ResponseEntity.ok(service.list(employeId, mois));
    }

    @PostMapping
    @RequirePermission("rh.heures-sup.create")
    public ResponseEntity<HeureSupplementaire> create(@Valid @RequestBody HeureSupplementaireCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PostMapping("/{id}/valider")
    @RequirePermission("rh.heures-sup.valider")
    public ResponseEntity<HeureSupplementaire> valider(@PathVariable String id) {
        return ResponseEntity.ok(service.valider(id));
    }

    @GetMapping("/synthese")
    @RequirePermission("rh.heures-sup.read")
    public ResponseEntity<HeureSupplementaireSyntheseDto> synthese(
            @RequestParam String employeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.synthese(employeId, from, to));
    }
}
