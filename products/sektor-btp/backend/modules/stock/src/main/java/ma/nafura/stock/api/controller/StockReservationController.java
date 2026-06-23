package ma.nafura.stock.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.stock.api.request.StockReservationCreateDto;
import ma.nafura.stock.api.request.StockReservationUpdateDto;
import ma.nafura.stock.domain.model.StockReservation;
import ma.nafura.stock.service.StockReservationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stock-reservations")
@SecuredResource(domain = "stock", feature = "stock", resource = "stock-reservation")
public class StockReservationController {

    private final StockReservationService service;

    public StockReservationController(StockReservationService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("stock.stock-reservation.read")
    public ResponseEntity<List<StockReservation>> list(
            @RequestParam(required = false) String chantierId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(service.list(chantierId, status));
    }

    @GetMapping("/{id}")
    @RequirePermission("stock.stock-reservation.read")
    public ResponseEntity<StockReservation> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @RequirePermission("stock.stock-reservation.create")
    public ResponseEntity<StockReservation> create(@Valid @RequestBody StockReservationCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PutMapping("/{id}")
    @RequirePermission("stock.stock-reservation.update")
    public ResponseEntity<StockReservation> update(
            @PathVariable UUID id, @Valid @RequestBody StockReservationUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("stock.stock-reservation.delete")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/release")
    @RequirePermission("stock.stock-reservation.update")
    public ResponseEntity<StockReservation> release(@PathVariable UUID id) {
        return ResponseEntity.ok(service.release(id));
    }
}
