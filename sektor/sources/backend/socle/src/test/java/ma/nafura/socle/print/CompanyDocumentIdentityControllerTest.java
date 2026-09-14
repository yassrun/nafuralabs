package ma.nafura.socle.print;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.appsettings.domain.model.TenantSetting;
import ma.nafura.platform.appsettings.repository.TenantSettingRepository;
import ma.nafura.platform.collaboration.docmanager.template.DefaultTenantIdentityProvider;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class CompanyDocumentIdentityControllerTest {
    @Test
    void writesOnlyToTheAuthenticatedTenantAndUsesExistingCompanyKeys() {
        var repository = mock(TenantSettingRepository.class);
        var fallback = mock(DefaultTenantIdentityProvider.class);
        var controller = new CompanyDocumentIdentityController(repository,
                new SektorTenantIdentityProvider(repository), fallback);
        UUID tenantId = UUID.randomUUID();
        when(repository.findByTenantId(tenantId)).thenReturn(List.of());
        when(repository.findByTenantIdAndSettingKey(tenantId, "company.raisonSociale"))
                .thenReturn(Optional.empty());
        when(fallback.identity(tenantId)).thenReturn(Map.of("raisonSociale", "Existing name"));
        try (var context = mockStatic(TenantContext.class)) {
            context.when(TenantContext::getTenantId).thenReturn(tenantId);
            controller.save(Map.of("raisonSociale", "  Entreprise  "));
        }
        var row = ArgumentCaptor.forClass(TenantSetting.class);
        verify(repository).save(row.capture());
        assertThat(row.getValue().getTenantId()).isEqualTo(tenantId);
        assertThat(row.getValue().getSettingKey()).isEqualTo("company.raisonSociale");
        assertThat(row.getValue().getValue()).isEqualTo("Entreprise");
    }

    @Test
    void rejectsArbitrarySettingsAndTenantIdsBeforeWriting() {
        var repository = mock(TenantSettingRepository.class);
        var controller = new CompanyDocumentIdentityController(repository,
                new SektorTenantIdentityProvider(repository), mock(DefaultTenantIdentityProvider.class));
        assertThatThrownBy(() -> controller.save(Map.of("tenantId", UUID.randomUUID().toString())))
                .isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(repository);
    }
}
