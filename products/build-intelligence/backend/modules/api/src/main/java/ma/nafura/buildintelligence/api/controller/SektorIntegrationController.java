package ma.nafura.buildintelligence.api.controller;

import lombok.RequiredArgsConstructor;
import ma.nafura.buildintelligence.api.security.BiReadAccess;
import ma.nafura.buildintelligence.api.security.BiWriteAccess;
import ma.nafura.buildintelligence.catalog.domain.WorkItem;
import ma.nafura.buildintelligence.integrations.sektor.SektorIntegrationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/build-intelligence/integrations/sektor")
@RequiredArgsConstructor
public class SektorIntegrationController {

    private final SektorIntegrationService sektorIntegrationService;

    @GetMapping("/etudes/search")
    @BiReadAccess
    public List<WorkItem> search(@RequestParam String q) {
        return sektorIntegrationService.searchForEtudes(q);
    }

    @PostMapping("/etudes/import/{workItemId}")
    @BiWriteAccess
    public Map<String, Object> proposeImport(
            @PathVariable UUID workItemId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return sektorIntegrationService.proposeImportToEtudes(workItemId, subject(jwt));
    }

    private static String subject(Jwt jwt) {
        return jwt != null && jwt.getSubject() != null ? jwt.getSubject() : "SYSTEM";
    }
}
