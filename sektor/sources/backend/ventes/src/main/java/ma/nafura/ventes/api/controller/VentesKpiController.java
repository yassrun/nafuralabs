package ma.nafura.ventes.api.controller;

import java.time.LocalDate;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.ventes.api.dto.VentesKpiDto;
import ma.nafura.ventes.service.VentesKpiService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ventes/kpis")
@SecuredResource(domain = "ventes", feature = "kpis", resource = "kpi")
public class VentesKpiController {

    private final VentesKpiService service;

    public VentesKpiController(VentesKpiService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("ventes.kpis.read")
    public ResponseEntity<VentesKpiDto> getKpis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(service.compute(from, to));
    }
}
