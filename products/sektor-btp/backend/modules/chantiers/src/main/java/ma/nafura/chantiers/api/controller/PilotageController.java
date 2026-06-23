package ma.nafura.chantiers.api.controller;

import java.time.YearMonth;
import java.util.List;
import ma.nafura.chantiers.api.dto.CashFlowProjectionMoisDto;
import ma.nafura.chantiers.api.dto.PilotageMargeRowDto;
import ma.nafura.chantiers.service.CashFlowProjectionService;
import ma.nafura.chantiers.service.PilotageMargeService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pilotage")
@SecuredResource(domain = "chantiers", feature = "pilotage", resource = "pilotage")
public class PilotageController {

    private final CashFlowProjectionService cashFlowService;
    private final PilotageMargeService margeService;

    public PilotageController(CashFlowProjectionService cashFlowService, PilotageMargeService margeService) {
        this.cashFlowService = cashFlowService;
        this.margeService = margeService;
    }

    @GetMapping("/cash-flow-projection")
    @RequirePermission("chantiers.pilotage.read")
    public ResponseEntity<List<CashFlowProjectionMoisDto>> cashFlowProjection(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) String societeId) {
        return ResponseEntity.ok(
                cashFlowService.project(YearMonth.parse(from), YearMonth.parse(to), societeId));
    }

    @GetMapping("/marges")
    @RequirePermission("chantiers.pilotage.read")
    public ResponseEntity<List<PilotageMargeRowDto>> marges(
            @RequestParam(required = false) String societeId) {
        return ResponseEntity.ok(margeService.listMarges(societeId));
    }
}
