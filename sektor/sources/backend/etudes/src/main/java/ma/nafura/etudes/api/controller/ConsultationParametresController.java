package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.util.Map;
import ma.nafura.etudes.api.request.ConsultationParametresDto;
import ma.nafura.etudes.service.ParametresEtudeService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/etudes/parametres/consultation")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dossier")
public class ConsultationParametresController {

    private final ParametresEtudeService parametres;

    public ConsultationParametresController(ParametresEtudeService parametres) {
        this.parametres = parametres;
    }

    @GetMapping
    @RequirePermission("etude.read")
    public ResponseEntity<ConsultationParametresDto> get() {
        ConsultationParametresDto dto = new ConsultationParametresDto();
        dto.setMode(parametres.consultationMode());
        dto.setMinimum(parametres.consultationMinimum());
        return ResponseEntity.ok(dto);
    }

    @PutMapping
    @RequirePermission("etude.update")
    public ResponseEntity<ConsultationParametresDto> put(@Valid @RequestBody ConsultationParametresDto body) {
        parametres.setConsultation(body.getMode(), body.getMinimum());
        return get();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> onBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(Map.of("code", ex.getMessage() != null ? ex.getMessage() : "bad_request"));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> onConflict(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("code", ex.getMessage() != null ? ex.getMessage() : "conflict"));
    }
}
