package ma.nafura.stock.api.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import ma.nafura.stock.api.controller.base.InventoryTxControllerBase;
import ma.nafura.stock.api.dto.InventoryTxDetailDto;
import ma.nafura.stock.api.request.InventoryTxWithLinesCreateDto;
import ma.nafura.stock.api.request.InventoryTxWithLinesUpdateDto;
import ma.nafura.stock.domain.model.InventoryTx;
import ma.nafura.stock.service.InventoryTxService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inventory-txs")
@SecuredResource(domain = "stock", feature = "stock", resource = "inventory-tx")
public class InventoryTxController extends InventoryTxControllerBase {

    private final InventoryTxService inventoryTxService;

    public InventoryTxController(InventoryTxService service) {
        super(service);
        this.inventoryTxService = service;
    }

    @GetMapping(params = "txType")
    @RequirePermission("stock.inventory-tx.read")
    public ResponseEntity<Page<InventoryTx>> listByTxType(
            @RequestParam String txType,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", required = false) String sort) {
        Sort sortObj = sort != null && !sort.isBlank() ? parseSort(sort) : Sort.by(Sort.Direction.DESC, "txDate");
        return ResponseEntity.ok(inventoryTxService.listByTxType(txType, page, size, sortObj));
    }

    @GetMapping("/{id}/detail")
    @RequirePermission("stock.inventory-tx.read")
    public ResponseEntity<InventoryTxDetailDto> getDetail(@PathVariable UUID id) {
        return inventoryTxService
                .getWithLines(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/with-lines")
    @RequirePermission("stock.inventory-tx.create")
    public ResponseEntity<InventoryTxDetailDto> createWithLines(@Valid @RequestBody InventoryTxWithLinesCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryTxService.createWithLines(body));
    }

    @PutMapping("/{id}/with-lines")
    @RequirePermission("stock.inventory-tx.update")
    public ResponseEntity<InventoryTxDetailDto> updateWithLines(
            @PathVariable UUID id, @Valid @RequestBody InventoryTxWithLinesUpdateDto body) {
        return ResponseEntity.ok(inventoryTxService.updateWithLines(id, body));
    }

    @PostMapping("/{id}/submit")
    @RequirePermission("stock.inventory-tx.update")
    public ResponseEntity<InventoryTx> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(inventoryTxService.submit(id));
    }

    @PostMapping("/{id}/validate")
    @RequirePermission("stock.inventory-tx.update")
    public ResponseEntity<InventoryTx> validate(@PathVariable UUID id) {
        return ResponseEntity.ok(inventoryTxService.validate(id));
    }

    @PostMapping("/{id}/cancel")
    @RequirePermission("stock.inventory-tx.update")
    public ResponseEntity<InventoryTx> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(inventoryTxService.cancel(id));
    }

    private Sort parseSort(String sort) {
        String[] parts = sort.split(",");
        if (parts.length == 2) {
            return Sort.by(Sort.Direction.fromString(parts[1]), parts[0]);
        }
        return Sort.by(parts[0]);
    }
}
