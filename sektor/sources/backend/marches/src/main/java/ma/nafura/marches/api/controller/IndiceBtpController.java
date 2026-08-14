package ma.nafura.marches.api.controller;

import java.util.List;
import ma.nafura.marches.domain.model.IndiceBtp;
import ma.nafura.marches.service.IndiceBtpService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/marches/indices-btp")
@SecuredResource(domain = "marches", feature = "marches", resource = "indice-btp")
public class IndiceBtpController {

    private final IndiceBtpService service;

    public IndiceBtpController(IndiceBtpService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("marches.indice-btp.read")
    public ResponseEntity<List<IndiceBtp>> list(@RequestParam String periode) {
        return ResponseEntity.ok(service.listByPeriode(periode));
    }

    @PostMapping("/import-csv")
    @RequirePermission("marches.indice-btp.update")
    public ResponseEntity<Void> importCsv() {
        service.importCsvStub();
        return ResponseEntity.noContent().build();
    }
}
