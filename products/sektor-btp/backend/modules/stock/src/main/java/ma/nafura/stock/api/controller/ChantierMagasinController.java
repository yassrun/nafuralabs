package ma.nafura.stock.api.controller;

import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.stock.api.dto.MagasinChantierDto;
import ma.nafura.stock.service.MagasinChantierReadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chantiers")
@SecuredResource(domain = "stock", feature = "stock", resource = "stock-balance")
public class ChantierMagasinController {

    private final MagasinChantierReadService readService;

    public ChantierMagasinController(MagasinChantierReadService readService) {
        this.readService = readService;
    }

    @GetMapping("/{id}/magasin")
    @RequirePermission("stock.stock-balance.read")
    public ResponseEntity<MagasinChantierDto> getMagasin(@PathVariable("id") String id) {
        return ResponseEntity.ok(readService.getMagasin(id));
    }
}
