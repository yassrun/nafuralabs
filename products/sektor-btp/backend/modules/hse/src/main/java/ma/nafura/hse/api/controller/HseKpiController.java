package ma.nafura.hse.api.controller;

import java.time.LocalDate;
import ma.nafura.hse.api.dto.HseKpiDto;
import ma.nafura.hse.service.HseKpiService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hse/kpis")
@SecuredResource(domain = "hse", feature = "kpis", resource = "kpi")
public class HseKpiController {

    private final HseKpiService service;

    public HseKpiController(HseKpiService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("hse.kpis.read")
    public ResponseEntity<HseKpiDto> getKpis(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String chantierId) {
        return ResponseEntity.ok(service.compute(from, to, chantierId));
    }
}
