package ma.nafura.stock.api.controller;

import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.stock.api.dto.StockKpiDto;
import ma.nafura.stock.service.StockKpiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stock/kpis")
@SecuredResource(domain = "stock", feature = "kpis", resource = "kpi")
public class StockKpiController {

    private final StockKpiService service;

    public StockKpiController(StockKpiService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("stock.kpis.read")
    public ResponseEntity<StockKpiDto> getKpis() {
        return ResponseEntity.ok(service.compute());
    }
}
