package ma.nafura.partner.api.controller;

import java.util.List;
import java.util.UUID;
import ma.nafura.partner.domain.model.PartnerBankAccount;
import ma.nafura.partner.service.PartnerBankAccountService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/partners")
@SecuredResource(domain = "partner", feature = "partner-bank-account", resource = "partner-bank-account")
public class PartnerBankAccountController {

    private final PartnerBankAccountService service;

    public PartnerBankAccountController(PartnerBankAccountService service) {
        this.service = service;
    }

    @GetMapping("/{partnerId}/bank-accounts")
    @RequirePermission("partner.partner-bank-account.read")
    public ResponseEntity<List<PartnerBankAccount>> listForPartner(@PathVariable UUID partnerId) {
        return ResponseEntity.ok(service.listForPartner(partnerId));
    }
}
