package ma.nafura.catalogue.api.controller;

import java.util.Arrays;
import java.util.List;
import ma.nafura.catalogue.api.dto.UsageLotDto;
import ma.nafura.catalogue.domain.article.UsageLot;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Référentiel des lots d'usage article — enum Java, lecture seule.
 */
@RestController
@RequestMapping("/api/v1/article-usage-lots")
@SecuredResource(domain = "item", feature = "item", resource = "item")
public class UsageLotController {

    @GetMapping
    @RequirePermission("item.item.read")
    public ResponseEntity<List<UsageLotDto>> list() {
        List<UsageLotDto> body =
                Arrays.stream(UsageLot.values())
                        .map(lot -> new UsageLotDto(lot.name(), lot.getLibelle()))
                        .toList();
        return ResponseEntity.ok(body);
    }
}
