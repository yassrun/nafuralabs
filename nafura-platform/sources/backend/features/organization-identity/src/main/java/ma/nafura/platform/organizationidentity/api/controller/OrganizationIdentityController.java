package ma.nafura.platform.organizationidentity.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.organizationidentity.api.dto.OrganizationIdentityDto;
import ma.nafura.platform.organizationidentity.service.OrganizationIdentityService;

@RestController
@RequestMapping("/api/v1/organization/identity")
public class OrganizationIdentityController {

    private final OrganizationIdentityService service;

    public OrganizationIdentityController(OrganizationIdentityService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission(value = "tenant.settings.read", fullPermission = true)
    public ResponseEntity<OrganizationIdentityDto> get() {
        return ResponseEntity.ok(service.get());
    }

    @PutMapping
    @RequirePermission(value = "tenant.settings.write", fullPermission = true)
    public ResponseEntity<OrganizationIdentityDto> save(@RequestBody OrganizationIdentityDto payload) {
        return ResponseEntity.ok(service.save(payload));
    }
}
