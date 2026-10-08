package ma.nafura.platform.administration.access.api;

import java.util.List;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.api.response.tenant.PermissionGroupResponse;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.authorization.service.PermissionMetadataService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Permission catalog for the role permissions section (platform admin). */
@RestController
@RequestMapping("/api/v1/platform/admin/permissions")
@SecuredResource(module = "tenant", resource = "admin")
@RequiredArgsConstructor
public class PlatformAdminPermissionsController {

    private final PermissionMetadataService permissionMetadata;

    @GetMapping("/catalog")
    @RequirePermission(value = "tenant.roles.read", fullPermission = true)
    public List<PermissionGroupResponse> catalog() {
        return permissionMetadata.getAllPermissions();
    }
}
