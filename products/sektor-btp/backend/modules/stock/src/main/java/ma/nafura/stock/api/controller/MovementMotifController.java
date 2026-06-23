package ma.nafura.stock.api.controller;

import java.util.List;
import java.util.UUID;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.stock.api.request.MovementMotifCreateDto;
import ma.nafura.stock.api.request.MovementMotifUpdateDto;
import ma.nafura.stock.domain.model.MovementMotif;
import ma.nafura.stock.service.MovementMotifService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/motifs")
@SecuredResource(domain = "stock", feature = "stock", resource = "movement-motif")
public class MovementMotifController
        extends CrudController<UUID, MovementMotif, MovementMotifCreateDto, MovementMotifUpdateDto> {

    private final MovementMotifService service;

    public MovementMotifController(MovementMotifService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, MovementMotif, MovementMotifCreateDto, MovementMotifUpdateDto> getService() {
        return service;
    }

    @GetMapping(params = "txType")
    public ResponseEntity<List<MovementMotif>> listByTxType(@RequestParam("txType") String txType) {
        return ResponseEntity.ok(service.listAll(txType));
    }
}
