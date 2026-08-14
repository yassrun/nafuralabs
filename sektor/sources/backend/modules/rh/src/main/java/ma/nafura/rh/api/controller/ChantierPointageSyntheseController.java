package ma.nafura.rh.api.controller;

import java.time.LocalDate;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.dto.ChantierPointageSyntheseDto;
import ma.nafura.rh.service.PointageService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/pointages")
@SecuredResource(domain = "rh", feature = "pointage", resource = "pointage-synthese")
public class ChantierPointageSyntheseController {

    private final PointageService service;

    public ChantierPointageSyntheseController(PointageService service) {
        this.service = service;
    }

    @GetMapping("/synthese")
    @RequirePermission("rh.pointage.read")
    public ResponseEntity<ChantierPointageSyntheseDto> synthese(
            @PathVariable String chantierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.syntheseChantier(chantierId, from, to));
    }
}
