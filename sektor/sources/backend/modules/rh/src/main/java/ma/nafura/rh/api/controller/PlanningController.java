package ma.nafura.rh.api.controller;

import java.time.LocalDate;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.dto.PlanningResultDto;
import ma.nafura.rh.service.PlanningReadService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rh/planning")
@SecuredResource(domain = "rh", feature = "planning", resource = "planning")
public class PlanningController {

    private final PlanningReadService service;

    public PlanningController(PlanningReadService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("rh.pointage.read")
    public ResponseEntity<PlanningResultDto> list(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String chantierId,
            @RequestParam(required = false) String employeId) {
        return ResponseEntity.ok(service.read(from, to, chantierId, employeId));
    }
}
