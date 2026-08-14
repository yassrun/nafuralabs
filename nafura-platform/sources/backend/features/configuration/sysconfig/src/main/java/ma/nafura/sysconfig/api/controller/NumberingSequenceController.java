package ma.nafura.platform.configuration.sysconfig.api.controller;

import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.configuration.sysconfig.api.controller.base.NumberingSequenceControllerBase;
import ma.nafura.platform.configuration.sysconfig.service.NumberingSequenceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for NumberingSequence entity.
 * Generated once — add custom endpoints here.
 */
@RestController
@RequestMapping("/api/v1/numbering-sequences")
@SecuredResource(domain = "settings", feature = "sysconfig", resource = "numbering-sequence")
public class NumberingSequenceController extends NumberingSequenceControllerBase {

    public NumberingSequenceController(NumberingSequenceService service) {
        super(service);
    }

    @GetMapping("/preview")
    public Map<String, String> preview(
        @RequestParam String prefix,
        @RequestParam(required = false) String separator,
        @RequestParam(required = false) String yearFormat,
        @RequestParam Integer padLength,
        @RequestParam Long currentNumber
    ) {
        String value = service.preview(prefix, separator, yearFormat, padLength, currentNumber);
        return Map.of("preview", value);
    }

    @PostMapping("/{id}/generate")
    public Map<String, String> generate(@PathVariable UUID id) {
        String number = service.generateNext(id);
        return Map.of("number", number);
    }
}


