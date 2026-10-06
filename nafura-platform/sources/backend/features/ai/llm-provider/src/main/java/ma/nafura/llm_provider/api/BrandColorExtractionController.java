package ma.nafura.platform.ai.llm.api;

import ma.nafura.platform.ai.llm.service.BrandColorExtractionService;
import ma.nafura.platform.appsettings.api.response.BrandColorExtractionResponse;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Brand palette extraction from the org logo. Path stays under app-settings branding
 * so the UI contract is stable; implementation lives in {@code cap.ai}.
 */
@RestController
@RequestMapping("/api/v1/app-settings/branding")
public class BrandColorExtractionController {

    private final BrandColorExtractionService brandColorExtractionService;

    public BrandColorExtractionController(BrandColorExtractionService brandColorExtractionService) {
        this.brandColorExtractionService = brandColorExtractionService;
    }

    @PostMapping("/extract-colors")
    @RequirePermission(value = "tenant.settings.write", fullPermission = true)
    public ResponseEntity<BrandColorExtractionResponse> extractBrandColors() {
        return ResponseEntity.ok(brandColorExtractionService.extractFromLogo());
    }
}
