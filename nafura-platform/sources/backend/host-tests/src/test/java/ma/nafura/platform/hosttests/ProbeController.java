package ma.nafura.platform.hosttests;

import java.util.List;
import java.util.Map;

import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Business context fixture (bc.probe): permissions probe.items.item.{read,create}, no role check. */
@RestController
@RequestMapping("/api/v1/probe/items")
@SecuredResource(domain = "probe", feature = "items", resource = "item")
class ProbeController {

    @GetMapping
    List<String> list() {
        return List.of("probe");
    }

    @PostMapping
    Map<String, String> create() {
        return Map.of("status", "created");
    }
}
