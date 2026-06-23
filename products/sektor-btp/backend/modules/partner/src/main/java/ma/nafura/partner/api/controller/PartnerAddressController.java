package ma.nafura.partner.api.controller;

import java.util.List;
import java.util.UUID;
import ma.nafura.partner.domain.model.PartnerAddress;
import ma.nafura.partner.service.PartnerAddressService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/partners")
@SecuredResource(domain = "partner", feature = "partner-address", resource = "partner-address")
public class PartnerAddressController {

    private final PartnerAddressService service;

    public PartnerAddressController(PartnerAddressService service) {
        this.service = service;
    }

    @GetMapping("/{partnerId}/addresses")
    @RequirePermission("partner.partner-address.read")
    public ResponseEntity<List<PartnerAddress>> listForPartner(@PathVariable UUID partnerId) {
        return ResponseEntity.ok(service.listForPartner(partnerId));
    }
}
