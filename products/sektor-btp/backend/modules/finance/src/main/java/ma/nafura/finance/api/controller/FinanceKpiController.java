package ma.nafura.finance.api.controller;

import ma.nafura.finance.api.dto.FinanceKpiDto;
import ma.nafura.finance.service.FinanceKpiService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/finance/kpis")
@SecuredResource(domain = "finance", feature = "kpis", resource = "kpi")
public class FinanceKpiController {

    private final FinanceKpiService service;

    public FinanceKpiController(FinanceKpiService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.kpis.read")
    public ResponseEntity<FinanceKpiDto> getKpis() {
        return ResponseEntity.ok(service.compute());
    }
}
