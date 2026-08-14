package ma.nafura.socle.onboarding.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.socle.onboarding.api.dto.OnboardingDtos.CompletenessResponse;
import ma.nafura.socle.onboarding.api.dto.OnboardingDtos.CompletenessSectionDto;
import ma.nafura.socle.onboarding.repository.TenantOnboardingMetaRepository;
import ma.nafura.platform.appsettings.repository.TenantSettingRepository;
import ma.nafura.platform.configuration.sysconfig.repository.NumberingSequenceRepository;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.sektor.socle.port.CatalogueOnboardingPort;
import ma.nafura.sektor.socle.port.FinanceOnboardingPort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OnboardingCompletenessService {

    private final TenantOnboardingMetaRepository metaRepository;
    private final TenantSettingRepository tenantSettingRepository;
    private final FinanceOnboardingPort financeOnboardingPort;
    private final NumberingSequenceRepository numberingSequenceRepository;
    private final CatalogueOnboardingPort catalogueOnboardingPort;
    private final TenantMembershipRepository membershipRepository;

    public CompletenessResponse compute(UUID tenantId) {
        List<CompletenessSectionDto> sections = new ArrayList<>();

        // Rappel post-onboarding (non bloquant) : ICE réel, placeholder exclu.
        boolean identity = tenantSettingRepository
            .findByTenantIdAndSettingKey(tenantId, "onboarding.societe.ice")
            .map(s -> s.getValue() != null
                && !s.getValue().isBlank()
                && !OnboardingAgentParserService.PLACEHOLDER_ICE.equals(s.getValue()))
            .orElse(false);
        sections.add(new CompletenessSectionDto("identity", "Identité société", identity, 15));

        boolean preset = metaRepository.findById(tenantId)
            .map(m -> m.getPresetAppliedAt() != null)
            .orElse(false);
        sections.add(new CompletenessSectionDto("preset", "Configuration initiale", preset, 25));

        boolean chart = financeOnboardingPort.hasChart(tenantId);
        sections.add(new CompletenessSectionDto("chart", "Plan comptable", chart, 15));

        boolean numbering = numberingSequenceRepository.countByTenantId(tenantId) >= 3;
        sections.add(new CompletenessSectionDto("numbering", "Numérotation", numbering, 10));

        boolean articles = catalogueOnboardingPort.hasArticles(tenantId);
        sections.add(new CompletenessSectionDto("articles", "Articles BTP", articles, 10));

        long members = membershipRepository.countByTenantId(tenantId);
        boolean team = members >= 2;
        sections.add(new CompletenessSectionDto("team", "Équipe invitée", team, 10));

        int totalWeight = sections.stream().mapToInt(CompletenessSectionDto::weight).sum();
        int earned = sections.stream()
            .filter(CompletenessSectionDto::complete)
            .mapToInt(CompletenessSectionDto::weight)
            .sum();
        int score = totalWeight == 0 ? 0 : Math.round((earned * 100f) / totalWeight);

        return new CompletenessResponse(score, sections);
    }
}
