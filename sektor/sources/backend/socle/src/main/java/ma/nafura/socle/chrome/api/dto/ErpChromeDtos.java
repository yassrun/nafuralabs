package ma.nafura.socle.chrome.api.dto;

import java.util.List;
import java.util.Map;
import ma.nafura.socle.onboarding.api.dto.OnboardingDtos.CompletenessResponse;

public final class ErpChromeDtos {

    private ErpChromeDtos() {}

    public record ChromeAlertDto(
            String id,
            String type,
            String titre,
            String titreKey,
            Map<String, Object> titreParams,
            String detail,
            String urgence,
            String route,
            String date) {}

    public record ChromeSnapshotResponse(CompletenessResponse completeness, List<ChromeAlertDto> alerts) {}
}
