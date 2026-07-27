package ma.nafura.erp.onboarding;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.AgentParseResponse;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.ApplyPresetRequest;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.SocietePresetDto;
import ma.nafura.erp.onboarding.service.OnboardingAgentParserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class OnboardingAgentParserServiceTest {

    private OnboardingAgentParserService service;

    @BeforeEach
    void setUp() {
        service = new OnboardingAgentParserService();
    }

    @Test
    void normalizeAppliesSektorDefaultsWhenProfileMissing() {
        ApplyPresetRequest request = new ApplyPresetRequest(
            new SocietePresetDto("Atlas Construction", null, null),
            null, null, null, null, false
        );

        ApplyPresetRequest normalized = service.normalize(request);

        assertThat(normalized.societe().nom()).isEqualTo("Atlas Construction");
        assertThat(normalized.societe().ice()).isNull();
        assertThat(normalized.societe().forme()).isEqualTo(OnboardingAgentParserService.DEFAULT_FORME);
        assertThat(normalized.secteur()).isEqualTo(OnboardingAgentParserService.DEFAULT_SECTEUR);
        assertThat(normalized.taille()).isEqualTo(OnboardingAgentParserService.DEFAULT_TAILLE);
        assertThat(normalized.marches()).isEqualTo(OnboardingAgentParserService.DEFAULT_MARCHES);
        assertThat(normalized.compta()).isEqualTo(OnboardingAgentParserService.DEFAULT_COMPTA);
    }

    @Test
    void normalizeKeepsProvidedProfileAndNormalizesSynonyms() {
        ApplyPresetRequest request = new ApplyPresetRequest(
            new SocietePresetDto("Atlas TP", "123456789012345", "SA"),
            "travaux publics", "200+", "privé", "cabinet", true
        );

        ApplyPresetRequest normalized = service.normalize(request);

        assertThat(normalized.societe().ice()).isEqualTo("123456789012345");
        assertThat(normalized.societe().forme()).isEqualTo("SA");
        assertThat(normalized.secteur()).isEqualTo("TP");
        assertThat(normalized.taille()).isEqualTo("XL");
        assertThat(normalized.marches()).isEqualTo("PRIVE");
        assertThat(normalized.compta()).isEqualTo("EXTERNE");
        assertThat(normalized.forceReset()).isTrue();
    }

    @Test
    void normalizeIceRejectsPlaceholderAndInvalidValues() {
        assertThat(OnboardingAgentParserService.normalizeIce(null)).isNull();
        assertThat(OnboardingAgentParserService.normalizeIce("")).isNull();
        assertThat(OnboardingAgentParserService.normalizeIce("000000000000000")).isNull();
        assertThat(OnboardingAgentParserService.normalizeIce("1234")).isNull();
        assertThat(OnboardingAgentParserService.normalizeIce("123456789012345")).isEqualTo("123456789012345");
    }

    @Test
    void buildPresetFromAnswersUsesDefaultsWithoutPlaceholderIce() {
        ApplyPresetRequest preset = service.buildPresetFromAnswers(Map.of());

        assertThat(preset.societe().nom()).isEqualTo("Ma société");
        assertThat(preset.societe().ice()).isNull();
        assertThat(preset.secteur()).isEqualTo(OnboardingAgentParserService.DEFAULT_SECTEUR);
        assertThat(preset.taille()).isEqualTo(OnboardingAgentParserService.DEFAULT_TAILLE);
        assertThat(preset.marches()).isEqualTo(OnboardingAgentParserService.DEFAULT_MARCHES);
        assertThat(preset.compta()).isEqualTo(OnboardingAgentParserService.DEFAULT_COMPTA);
    }

    @Test
    void parseQuestion1ExtractsIceAndCompanyName() {
        AgentParseResponse response = service.parseQuestion1("Atlas Construction SARL ice 123456789012345", Map.of());

        assertThat(response.extracted().get("nom")).isEqualTo("Atlas Construction");
        assertThat(response.extracted().get("ice")).isEqualTo("123456789012345");
        assertThat(response.extracted().get("forme")).isEqualTo("SARL");
    }

    @Test
    void parseQuestion1WithoutIceReturnsNullIce() {
        AgentParseResponse response = service.parseQuestion1("Atlas Construction", Map.of());

        assertThat(response.extracted().get("ice")).isNull();
        assertThat(response.extracted().get("nom")).isEqualTo("Atlas Construction");
    }
}
