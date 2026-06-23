package ma.nafura.marches.api.controller;

import ma.nafura.marches.api.dto.MarchesKpiDto;
import ma.nafura.marches.service.MarchesKpiService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/marches/kpis")
@SecuredResource(domain = "marches", feature = "kpis", resource = "kpi")
public class MarchesKpiController {

    private final MarchesKpiService service;

    public MarchesKpiController(MarchesKpiService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("marches.kpis.read")
    public ResponseEntity<MarchesKpiDto> getKpis() {
        return ResponseEntity.ok(service.compute());
    }
}
