package ma.nafura.item.api.controller;

import java.util.Arrays;
import java.util.List;
import ma.nafura.item.api.dto.NatureDto;
import ma.nafura.item.domain.Nature;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Référentiel des natures d'article — enum Java, lecture seule.
 */
@RestController
@RequestMapping("/api/v1/article-natures")
@SecuredResource(domain = "item", feature = "item", resource = "item")
public class NatureController {

    @GetMapping
    @RequirePermission("item.item.read")
    public ResponseEntity<List<NatureDto>> list() {
        List<NatureDto> body =
                Arrays.stream(Nature.values())
                        .map(
                                n ->
                                        new NatureDto(
                                                n.name(),
                                                n.getLibelle(),
                                                n.isStockable(),
                                                n.isValorise(),
                                                n.getUomDefaut(),
                                                n.getPosteBudgetDefaut(),
                                                n.getTypeDpu()))
                        .toList();
        return ResponseEntity.ok(body);
    }
}
