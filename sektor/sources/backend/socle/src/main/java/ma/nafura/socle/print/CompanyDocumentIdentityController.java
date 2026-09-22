package ma.nafura.socle.print;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.organizationidentity.api.dto.OrganizationIdentityDto;
import ma.nafura.platform.organizationidentity.service.OrganizationIdentityService;

/**
 * @deprecated Prefer {@code /api/v1/organization/identity}. Kept as a thin proxy for
 * existing Sektor UI during the platform lift.
 */
@Deprecated
@RestController
@RequestMapping("/api/v1/socle/company-document-identity")
public class CompanyDocumentIdentityController {

    private final OrganizationIdentityService identityService;

    public CompanyDocumentIdentityController(OrganizationIdentityService identityService) {
        this.identityService = identityService;
    }

    @GetMapping
    @RequirePermission(value = "tenant.settings.read", fullPermission = true)
    public Map<String, String> get() {
        return identityService.get().toMap();
    }

    @PutMapping
    @RequirePermission(value = "tenant.settings.write", fullPermission = true)
    public Map<String, String> save(@RequestBody Map<String, String> payload) {
        return identityService.save(OrganizationIdentityDto.fromMap(payload)).toMap();
    }
}
