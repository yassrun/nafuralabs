package ma.nafura.rh.api.controller;

import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.dto.RhKpiDto;
import ma.nafura.rh.service.RhKpiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rh/kpis")
@SecuredResource(domain = "rh", feature = "kpis", resource = "kpi")
public class RhKpiController {

    private final RhKpiService service;

    public RhKpiController(RhKpiService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("rh.kpis.read")
    public ResponseEntity<RhKpiDto> getKpis() {
        return ResponseEntity.ok(service.compute());
    }
}
