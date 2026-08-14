package ma.nafura.achats.api.controller;

import java.time.LocalDate;
import ma.nafura.achats.api.dto.AchatsKpiDto;
import ma.nafura.achats.service.AchatsKpiService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/achats/kpis")
@SecuredResource(domain = "achats", feature = "kpis", resource = "kpi")
public class AchatsKpiController {

    private final AchatsKpiService service;

    public AchatsKpiController(AchatsKpiService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("achats.kpis.read")
    public ResponseEntity<AchatsKpiDto> getKpis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.compute(from, to));
    }
}
