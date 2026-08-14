package ma.nafura.etudes.api.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import ma.nafura.etudes.api.request.MetreLigneUpdateDto;
import ma.nafura.etudes.domain.model.MetreLigne;
import ma.nafura.etudes.service.MetreService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/etudes/metre-lignes")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "metre")
public class MetreLigneController {

    private final MetreService service;

    public MetreLigneController(MetreService service) {
        this.service = service;
    }

    @PutMapping("/{id}")
    @RequirePermission("etudes.update")
    public ResponseEntity<MetreLigne> update(
            @PathVariable UUID id, @Valid @RequestBody MetreLigneUpdateDto body) {
        return ResponseEntity.ok(service.updateLigne(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("etudes.update")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.deleteLigne(id);
        return ResponseEntity.noContent().build();
    }
}
