package ma.nafura.approbations.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.approbations.api.dto.ApprovalEventDto;
import ma.nafura.approbations.api.dto.ApprovalIntegrityResultDto;
import ma.nafura.approbations.api.dto.ApprovalRequestDto;
import ma.nafura.approbations.api.request.ApprovalActionDto;
import ma.nafura.approbations.api.request.ApprovalRequestSubmitDto;
import ma.nafura.approbations.service.ApprovalEngineService;
import ma.nafura.approbations.service.ApprovalEventService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/approbations/requests")
@SecuredResource(domain = "approbations", feature = "requests", resource = "request")
public class ApprovalRequestController {

    private final ApprovalEngineService engineService;
    private final ApprovalEventService eventService;

    public ApprovalRequestController(ApprovalEngineService engineService, ApprovalEventService eventService) {
        this.engineService = engineService;
        this.eventService = eventService;
    }

    @GetMapping
    @RequirePermission("approbations.requests.read")
    public ResponseEntity<List<ApprovalRequestDto>> list(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(engineService.listRequests(status));
    }

    @GetMapping("/pending/count")
    @RequirePermission("approbations.requests.read")
    public ResponseEntity<Long> countPending() {
        return ResponseEntity.ok(engineService.countPending());
    }

    @GetMapping("/{id}")
    @RequirePermission("approbations.requests.read")
    public ResponseEntity<ApprovalRequestDto> getById(@PathVariable String id) {
        return ResponseEntity.ok(engineService.getRequest(id));
    }

    @PostMapping
    @RequirePermission("approbations.requests.create")
    public ResponseEntity<ApprovalRequestDto> submit(@Valid @RequestBody ApprovalRequestSubmitDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(engineService.submit(body));
    }

    @PostMapping("/{id}/approve")
    @RequirePermission("approbations.requests.update")
    public ResponseEntity<ApprovalRequestDto> approve(
            @PathVariable String id, @RequestBody(required = false) ApprovalActionDto body) {
        return ResponseEntity.ok(engineService.approve(id, body));
    }

    @PostMapping("/{id}/reject")
    @RequirePermission("approbations.requests.update")
    public ResponseEntity<ApprovalRequestDto> reject(
            @PathVariable String id, @RequestBody(required = false) ApprovalActionDto body) {
        return ResponseEntity.ok(engineService.reject(id, body));
    }

    @PostMapping("/{id}/demande-complement")
    @RequirePermission("approbations.requests.update")
    public ResponseEntity<ApprovalRequestDto> demandeComplement(
            @PathVariable String id, @RequestBody(required = false) ApprovalActionDto body) {
        return ResponseEntity.ok(engineService.demandeComplement(id, body));
    }

    @PostMapping("/{id}/commenter")
    @RequirePermission("approbations.requests.update")
    public ResponseEntity<ApprovalRequestDto> commenter(
            @PathVariable String id, @RequestBody(required = false) ApprovalActionDto body) {
        return ResponseEntity.ok(engineService.commenter(id, body));
    }

    @PostMapping("/{id}/deleguer")
    @RequirePermission("approbations.requests.update")
    public ResponseEntity<ApprovalRequestDto> deleguer(
            @PathVariable String id, @RequestBody(required = false) ApprovalActionDto body) {
        return ResponseEntity.ok(engineService.deleguer(id, body));
    }

    @GetMapping("/{id}/events")
    @RequirePermission("approbations.requests.read")
    public ResponseEntity<List<ApprovalEventDto>> listEvents(@PathVariable String id) {
        engineService.getRequest(id);
        return ResponseEntity.ok(eventService.listEvents(id));
    }

    @GetMapping("/{id}/verify-integrity")
    @RequirePermission("approbations.requests.read")
    public ResponseEntity<ApprovalIntegrityResultDto> verifyIntegrity(@PathVariable String id) {
        engineService.getRequest(id);
        return ResponseEntity.ok(eventService.verifyIntegrity(id));
    }

    @GetMapping("/{id}/audit.pdf")
    @RequirePermission("approbations.requests.read")
    public ResponseEntity<Void> auditPdf(@PathVariable String id) {
        engineService.getRequest(id);
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
    }
}
