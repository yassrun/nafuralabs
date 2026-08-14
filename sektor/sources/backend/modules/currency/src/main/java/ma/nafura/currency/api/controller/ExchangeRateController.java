package ma.nafura.currency.api.controller;

import java.util.List;
import ma.nafura.currency.api.controller.base.ExchangeRateControllerBase;
import ma.nafura.currency.domain.model.ExchangeRate;
import ma.nafura.currency.service.ExchangeRateService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for ExchangeRate entity.
 * Generated once — safe for manual edits.
 */
@RestController
@RequestMapping("/api/v1/exchange-rates")
@SecuredResource(domain = "currency", feature = "currency", resource = "exchange-rate")
public class ExchangeRateController extends ExchangeRateControllerBase {

    public ExchangeRateController(ExchangeRateService service) {
        super(service);
    }

    @PostMapping("/import-bam")
    @RequirePermission("currency.exchange-rate.create")
    public ResponseEntity<List<ExchangeRate>> importFromBam() {
        return ResponseEntity.ok(service.importFromBam());
    }
}
