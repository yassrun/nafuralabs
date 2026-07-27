package ma.nafura.erp.onboarding;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.CompletenessResponse;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.CompletenessSectionDto;
import ma.nafura.erp.onboarding.domain.TenantOnboardingMeta;
import ma.nafura.erp.onboarding.repository.TenantOnboardingMetaRepository;
import ma.nafura.erp.onboarding.service.OnboardingCompletenessService;
import ma.nafura.finance.repository.ChartOfAccountRepository;
import ma.nafura.item.repository.ItemRepository;
import ma.nafura.platform.appsettings.domain.model.TenantSetting;
import ma.nafura.platform.appsettings.repository.TenantSettingRepository;
import ma.nafura.platform.configuration.sysconfig.repository.NumberingSequenceRepository;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OnboardingCompletenessServiceTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock
    private TenantOnboardingMetaRepository metaRepository;

    @Mock
    private TenantSettingRepository tenantSettingRepository;

    @Mock
    private ChartOfAccountRepository chartOfAccountRepository;

    @Mock
    private NumberingSequenceRepository numberingSequenceRepository;

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private TenantMembershipRepository membershipRepository;

    private OnboardingCompletenessService service;

    @BeforeEach
    void setUp() {
        service = new OnboardingCompletenessService(
            metaRepository,
            tenantSettingRepository,
            chartOfAccountRepository,
            numberingSequenceRepository,
            itemRepository,
            membershipRepository
        );
    }

    @Test
    void skipOnboardingRemainsFunctionalWithoutIce() {
        stubIce(null);
        stubPresetApplied(true);
        when(chartOfAccountRepository.countByTenantId(TENANT)).thenReturn(90L);
        when(numberingSequenceRepository.countByTenantId(TENANT)).thenReturn(6L);
        when(itemRepository.countByTenantId(TENANT)).thenReturn(8L);
        when(membershipRepository.countByTenantId(TENANT)).thenReturn(1L);

        CompletenessResponse response = service.compute(TENANT);

        assertThat(section(response, "identity").complete()).isFalse();
        assertThat(section(response, "preset").complete()).isTrue();
        assertThat(section(response, "chart").complete()).isTrue();
        assertThat(section(response, "numbering").complete()).isTrue();
        assertThat(section(response, "articles").complete()).isTrue();
        // Le score reste incitatif (rappel), pas bloquant.
        assertThat(response.score()).isGreaterThan(50);
    }

    @Test
    void placeholderIceDoesNotCountAsIdentityComplete() {
        stubIce("000000000000000");
        stubPresetApplied(false);
        when(chartOfAccountRepository.countByTenantId(TENANT)).thenReturn(0L);
        when(numberingSequenceRepository.countByTenantId(TENANT)).thenReturn(0L);
        when(itemRepository.countByTenantId(TENANT)).thenReturn(0L);
        when(membershipRepository.countByTenantId(TENANT)).thenReturn(1L);

        CompletenessResponse response = service.compute(TENANT);

        assertThat(section(response, "identity").complete()).isFalse();
    }

    @Test
    void realIceCountsAsIdentityComplete() {
        stubIce("123456789012345");
        stubPresetApplied(true);
        when(chartOfAccountRepository.countByTenantId(TENANT)).thenReturn(90L);
        when(numberingSequenceRepository.countByTenantId(TENANT)).thenReturn(6L);
        when(itemRepository.countByTenantId(TENANT)).thenReturn(8L);
        when(membershipRepository.countByTenantId(TENANT)).thenReturn(3L);

        CompletenessResponse response = service.compute(TENANT);

        assertThat(section(response, "identity").complete()).isTrue();
        assertThat(section(response, "team").complete()).isTrue();
        assertThat(response.score()).isEqualTo(100);
    }

    private void stubIce(String value) {
        Optional<TenantSetting> setting = value == null
            ? Optional.empty()
            : Optional.of(TenantSetting.builder()
                .tenantId(TENANT)
                .settingKey("onboarding.societe.ice")
                .value(value)
                .build());
        when(tenantSettingRepository.findByTenantIdAndSettingKey(eq(TENANT), any())).thenReturn(setting);
    }

    private void stubPresetApplied(boolean applied) {
        Optional<TenantOnboardingMeta> meta = applied
            ? Optional.of(TenantOnboardingMeta.builder()
                .tenantId(TENANT)
                .presetAppliedAt(OffsetDateTime.now())
                .build())
            : Optional.empty();
        when(metaRepository.findById(TENANT)).thenReturn(meta);
    }

    private static CompletenessSectionDto section(CompletenessResponse response, String id) {
        return response.sections().stream()
            .filter(s -> s.id().equals(id))
            .findFirst()
            .orElseThrow();
    }
}
