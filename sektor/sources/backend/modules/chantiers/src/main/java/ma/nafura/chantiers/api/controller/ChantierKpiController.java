package ma.nafura.chantiers.api.controller;

import ma.nafura.chantiers.api.dto.ChantierKpiDto;
import ma.nafura.chantiers.service.ChantierKpiService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chantiers/kpis")
@SecuredResource(domain = "chantiers", feature = "kpis", resource = "kpi")
public class ChantierKpiController {

    private final ChantierKpiService service;

    public ChantierKpiController(ChantierKpiService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.kpis.read")
    public ResponseEntity<ChantierKpiDto> getKpis(@RequestParam(required = false) String societeId) {
        return ResponseEntity.ok(service.compute(societeId));
    }
}
