package ma.nafura.rh.api.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.dto.PointageDto;
import ma.nafura.rh.api.request.PointageUpdateDto;
import ma.nafura.rh.service.PointageService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rh/pointages")
@SecuredResource(domain = "rh", feature = "pointage", resource = "pointage")
public class PointageController {

    private final PointageService service;

    public PointageController(PointageService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("rh.pointage.read")
    public ResponseEntity<List<PointageDto>> list(
            @RequestParam(required = false) String chantierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.list(chantierId, date, from, to));
    }

    @GetMapping("/by-employe")
    @RequirePermission("rh.pointage.read")
    public ResponseEntity<List<PointageDto>> listByEmploye(
            @RequestParam String employeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.listByEmploye(employeId, from, to));
    }

    @PutMapping("/{id}")
    @RequirePermission("rh.pointage.update")
    public ResponseEntity<PointageDto> update(@PathVariable String id, @Valid @RequestBody PointageUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }
}
