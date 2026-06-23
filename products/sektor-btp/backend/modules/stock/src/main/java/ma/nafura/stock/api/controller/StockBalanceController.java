package ma.nafura.stock.api.controller;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.stock.api.controller.base.StockBalanceControllerBase;
import ma.nafura.stock.api.dto.ItemQuantityAggregateDto;
import ma.nafura.stock.domain.model.StockBalance;
import ma.nafura.stock.service.StockBalanceService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stock-balances")
@SecuredResource(domain = "stock", feature = "stock", resource = "stock-balance")
public class StockBalanceController extends StockBalanceControllerBase {

    public StockBalanceController(StockBalanceService service) {
        super(service);
    }

    @GetMapping(params = {"warehouseId", "itemId"})
    @RequirePermission("stock.stock-balance.read")
    public ResponseEntity<Page<StockBalance>> listByWarehouseAndItem(
            @RequestParam UUID warehouseId,
            @RequestParam UUID itemId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(service.listFiltered(warehouseId, itemId, page, size));
    }

    @GetMapping(params = "warehouseId")
    @RequirePermission("stock.stock-balance.read")
    public ResponseEntity<Page<StockBalance>> listByWarehouse(
            @RequestParam UUID warehouseId,
            @RequestParam(value = "itemId", required = false) UUID itemId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(service.listFiltered(warehouseId, itemId, page, size));
    }

    @GetMapping(params = "itemId")
    @RequirePermission("stock.stock-balance.read")
    public ResponseEntity<Page<StockBalance>> listByItem(
            @RequestParam UUID itemId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(service.listFiltered(null, itemId, page, size));
    }

    @GetMapping("/aggregate-by-item")
    @RequirePermission("stock.stock-balance.read")
    public ResponseEntity<List<ItemQuantityAggregateDto>> aggregateByItem(
            @RequestParam("itemIds") String itemIds) {
        List<UUID> ids =
                Arrays.stream(itemIds.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(UUID::fromString)
                        .collect(Collectors.toList());
        return ResponseEntity.ok(service.aggregateQuantityByItemIds(ids));
    }
}
