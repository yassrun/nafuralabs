package ma.nafura.partner.api.controller;

import java.util.List;
import java.util.UUID;
import ma.nafura.partner.domain.model.PartnerContact;
import ma.nafura.partner.service.PartnerContactService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/partners")
@SecuredResource(domain = "partner", feature = "partner-contact", resource = "partner-contact")
public class PartnerContactController {

    private final PartnerContactService service;

    public PartnerContactController(PartnerContactService service) {
        this.service = service;
    }

    @GetMapping("/{partnerId}/contacts")
    @RequirePermission("partner.partner-contact.read")
    public ResponseEntity<List<PartnerContact>> listForPartner(@PathVariable UUID partnerId) {
        return ResponseEntity.ok(service.listForPartner(partnerId));
    }
}
