package ma.nafura.stock.api.controller;

import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.stock.api.dto.StockBalanceViewDto;
import ma.nafura.stock.api.dto.StockValorisationDto;
import ma.nafura.stock.service.StockLedgerService;
import ma.nafura.stock.service.StockSuiviService;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stock/suivi")
@SecuredResource(domain = "stock", feature = "stock", resource = "stock-balance")
public class StockSuiviController {

    private final StockSuiviService stockSuiviService;
    private final StockLedgerService stockLedgerService;

    public StockSuiviController(StockSuiviService stockSuiviService, StockLedgerService stockLedgerService) {
        this.stockSuiviService = stockSuiviService;
        this.stockLedgerService = stockLedgerService;
    }

    @GetMapping("/etat-stock")
    @RequirePermission("stock.stock-balance.read")
    public ResponseEntity<Page<StockBalanceViewDto>> etatStock(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(stockSuiviService.etatStock(page, size));
    }

    @GetMapping("/valorisation")
    @RequirePermission("stock.stock-balance.read")
    public ResponseEntity<StockValorisationDto> valorisation(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOf,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(stockSuiviService.valorisation(asOf, page, size));
    }

    @GetMapping("/alertes")
    @RequirePermission("stock.stock-balance.read")
    public ResponseEntity<Page<StockBalanceViewDto>> alertes(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(stockSuiviService.alertes(page, size));
    }

    @GetMapping("/reconcile")
    @RequirePermission("stock.stock-balance.read")
    public ResponseEntity<StockLedgerService.ReconcileResult> reconcile(
            @RequestParam UUID itemId, @RequestParam UUID locationId) {
        return ResponseEntity.ok(stockLedgerService.reconcile(itemId, locationId));
    }
}
