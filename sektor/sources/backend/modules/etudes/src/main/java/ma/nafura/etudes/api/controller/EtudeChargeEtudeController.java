package ma.nafura.etudes.api.controller;

import java.util.List;
import ma.nafura.etudes.api.dto.ChargeEtudeCandidatDto;
import ma.nafura.etudes.service.ChargeEtudeService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Candidats chargé d'étude (rôle {@code BTP_INGENIEUR}) — sans exiger {@code tenant.roles.read}.
 */
@RestController
@RequestMapping("/api/v1/etudes")
@SecuredResource(domain = "etudes", feature = "etudes", resource = "dossier")
public class EtudeChargeEtudeController {

    private final ChargeEtudeService chargeEtudeService;

    public EtudeChargeEtudeController(ChargeEtudeService chargeEtudeService) {
        this.chargeEtudeService = chargeEtudeService;
    }

    @GetMapping("/ingenieurs")
    @RequirePermission("etude.read")
    public ResponseEntity<List<ChargeEtudeCandidatDto>> listIngenieurs() {
        return ResponseEntity.ok(chargeEtudeService.listIngenieurs());
    }
}
