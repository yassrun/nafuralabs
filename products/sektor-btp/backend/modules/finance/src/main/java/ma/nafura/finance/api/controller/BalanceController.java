package ma.nafura.finance.api.controller;

import java.time.LocalDate;
import ma.nafura.finance.api.dto.BalanceResponseDto;
import ma.nafura.finance.service.BalanceService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/balance")
@SecuredResource(domain = "finance", feature = "finance", resource = "balance")
public class BalanceController {

    private final BalanceService service;

    public BalanceController(BalanceService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("finance.balance.read")
    public ResponseEntity<BalanceResponseDto> getBalance(
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate to,
            @RequestParam(value = "classe", required = false) Integer accountClass,
            @RequestParam(value = "type", required = false) String accountType,
            @RequestParam(value = "axeAnalytique", required = false) String analyticalAxis) {
        return ResponseEntity.ok(service.compute(from, to, accountClass, accountType, analyticalAxis));
    }
}
