package ma.nafura.rh.api.controller;

import jakarta.validation.Valid;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.rh.api.dto.PointageBatchConflictDto;
import ma.nafura.rh.api.dto.PointageBatchDto;
import ma.nafura.rh.api.request.PointageBatchCreateDto;
import ma.nafura.rh.service.PointageBatchDuplicateException;
import ma.nafura.rh.service.PointageBatchService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rh/pointage-batches")
@SecuredResource(domain = "rh", feature = "pointage", resource = "pointage-batch")
public class PointageBatchController {

    private final PointageBatchService service;

    public PointageBatchController(PointageBatchService service) {
        this.service = service;
    }

    @PostMapping
    @RequirePermission("rh.pointage.create")
    public ResponseEntity<PointageBatchDto> create(@Valid @RequestBody PointageBatchCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(body));
    }

    @PostMapping("/{id}/valider")
    @RequirePermission("rh.pointage.update")
    public ResponseEntity<PointageBatchDto> valider(@PathVariable String id) {
        return ResponseEntity.ok(service.valider(id));
    }

    @ExceptionHandler(PointageBatchDuplicateException.class)
    public ResponseEntity<PointageBatchConflictDto> handleDuplicate(PointageBatchDuplicateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getConflict());
    }
}
