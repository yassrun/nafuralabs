package ma.nafura.partner.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import ma.nafura.partner.api.controller.base.PartnerControllerBase;
import ma.nafura.partner.api.request.PartnerRoleAssignDto;
import ma.nafura.partner.domain.model.Partner;
import ma.nafura.partner.domain.model.PartnerRole;
import ma.nafura.partner.domain.model.PartnerRoleType;
import ma.nafura.partner.service.PartnerService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/partners")
@SecuredResource(domain = "partner", feature = "partner", resource = "partner")
public class PartnerController extends PartnerControllerBase {

    public PartnerController(PartnerService service) {
        super(service);
    }

    @GetMapping(params = "role")
    public ResponseEntity<Page<Partner>> listByRole(
            @RequestParam PartnerRoleType role,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", required = false) String sort) {
        Sort sortObj = sort != null && !sort.isBlank() ? parseSort(sort) : null;
        return ResponseEntity.ok(service.listByRole(role, page, size, sortObj));
    }

    @GetMapping("/{id}/roles")
    @RequirePermission("partner.partner.read")
    public ResponseEntity<List<PartnerRole>> listRoles(@PathVariable UUID id) {
        return ResponseEntity.ok(service.listRoles(id));
    }

    @PostMapping("/{id}/roles")
    @RequirePermission("partner.partner.update")
    public ResponseEntity<PartnerRole> addRole(
            @PathVariable UUID id, @Valid @RequestBody PartnerRoleAssignDto body) {
        return ResponseEntity.ok(service.addRole(id, body.getRole()));
    }

    @DeleteMapping("/{id}/roles/{role}")
    @RequirePermission("partner.partner.update")
    public ResponseEntity<Void> removeRole(@PathVariable UUID id, @PathVariable PartnerRoleType role) {
        service.removeRole(id, role);
        return ResponseEntity.noContent().build();
    }

    private Sort parseSort(String sort) {
        String[] parts = sort.split(",");
        if (parts.length == 2) {
            return Sort.by(Sort.Direction.fromString(parts[1]), parts[0]);
        }
        return Sort.by(parts[0]);
    }
}
