package ma.nafura.marches.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.marches.api.request.ReserveReceptionCreateDto;
import ma.nafura.marches.domain.model.ReserveReception;
import ma.nafura.marches.service.ReceptionMarcheService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/marches")
@SecuredResource(domain = "marches", feature = "marches", resource = "reception")
public class ReceptionMarcheController {

    private final ReceptionMarcheService service;

    public ReceptionMarcheController(ReceptionMarcheService service) {
        this.service = service;
    }

    @GetMapping("/receptions/{id}/reserves")
    @RequirePermission("marches.reception.read")
    public ResponseEntity<List<ReserveReception>> listReserves(@PathVariable String id) {
        return ResponseEntity.ok(service.listReserves(id));
    }

    @PostMapping("/receptions/{id}/reserves")
    @RequirePermission("marches.reception.create")
    public ResponseEntity<ReserveReception> createReserve(
            @PathVariable String id, @Valid @RequestBody ReserveReceptionCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createReserve(id, body));
    }

    @PostMapping("/reserves/{id}/lever")
    @RequirePermission("marches.reception.update")
    public ResponseEntity<ReserveReception> leverReserve(@PathVariable String id) {
        return ResponseEntity.ok(service.leverReserve(id));
    }
}
