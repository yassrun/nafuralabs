package ma.nafura.erp.onboarding.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.CompletenessResponse;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.CompletenessSectionDto;
import ma.nafura.erp.onboarding.repository.TenantOnboardingMetaRepository;
import ma.nafura.finance.repository.ChartOfAccountRepository;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.platform.appsettings.repository.TenantSettingRepository;
import ma.nafura.platform.configuration.sysconfig.repository.NumberingSequenceRepository;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.item.repository.ItemRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OnboardingCompletenessService {

    private final TenantOnboardingMetaRepository metaRepository;
    private final TenantSettingRepository tenantSettingRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final NumberingSequenceRepository numberingSequenceRepository;
    private final ItemRepository itemRepository;
    private final ChantierRepository chantierRepository;
    private final TenantMembershipRepository membershipRepository;

    public CompletenessResponse compute(UUID tenantId) {
        List<CompletenessSectionDto> sections = new ArrayList<>();

        boolean identity = tenantSettingRepository
            .findByTenantIdAndSettingKey(tenantId, "onboarding.societe.ice")
            .map(s -> s.getValue() != null && !s.getValue().isBlank())
            .orElse(false);
        sections.add(new CompletenessSectionDto("identity", "Identité société", identity, 15));

        boolean preset = metaRepository.findById(tenantId)
            .map(m -> m.getPresetAppliedAt() != null)
            .orElse(false);
        sections.add(new CompletenessSectionDto("preset", "Configuration initiale", preset, 25));

        boolean chart = chartOfAccountRepository.countByTenantId(tenantId) > 0;
        sections.add(new CompletenessSectionDto("chart", "Plan comptable", chart, 15));

        boolean numbering = numberingSequenceRepository.countByTenantId(tenantId) >= 3;
        sections.add(new CompletenessSectionDto("numbering", "Numérotation", numbering, 10));

        boolean articles = itemRepository.countByTenantId(tenantId) > 0;
        sections.add(new CompletenessSectionDto("articles", "Articles BTP", articles, 10));

        boolean chantier = chantierRepository.countByTenantId(tenantId) > 0;
        sections.add(new CompletenessSectionDto("chantier", "Premier chantier", chantier, 15));

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
