package ma.nafura.achats.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.domain.model.AttestationFournisseur;
import ma.nafura.achats.repository.AttestationFournisseurRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class BlocageReglementTest {

    @Mock
    private AttestationFournisseurRepository repository;

    private AttestationFournisseurService service;

    private final UUID tenantId = UUID.randomUUID();
    private final String partnerId = "fournisseur-1";

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new AttestationFournisseurService(repository);
        ReflectionTestUtils.setField(service, "blocageReglementEnabled", true);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void reglementBloqueWhenCnssAndFiscaleExpired() {
        when(repository.findByTenantIdAndPartnerIdOrderByCreatedAtDesc(tenantId, partnerId))
                .thenReturn(List.of(
                        attestation(AttestationFournisseur.TYPE_CNSS, LocalDate.now().minusDays(10)),
                        attestation(AttestationFournisseur.TYPE_FISCALE, LocalDate.now().minusDays(3))));

        assertThat(service.isReglementBloque(partnerId)).isTrue();
        assertThatThrownBy(() -> service.assertReglementAutorise(partnerId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CNSS");
    }

    @Test
    void reglementAutoriseWhenOnlyOneBlockingTypeExpired() {
        when(repository.findByTenantIdAndPartnerIdOrderByCreatedAtDesc(tenantId, partnerId))
                .thenReturn(List.of(
                        attestation(AttestationFournisseur.TYPE_CNSS, LocalDate.now().minusDays(10)),
                        attestation(AttestationFournisseur.TYPE_FISCALE, LocalDate.now().plusDays(90))));

        assertThat(service.isReglementBloque(partnerId)).isFalse();
        service.assertReglementAutorise(partnerId);
    }

    @Test
    void reglementAutoriseWhenBlocageDisabled() {
        ReflectionTestUtils.setField(service, "blocageReglementEnabled", false);
        assertThat(service.isReglementBloque(partnerId)).isFalse();
    }

    private AttestationFournisseur attestation(String type, LocalDate expiration) {
        String status = AttestationFournisseurService.computeStatus(expiration, LocalDate.now());
        return AttestationFournisseur.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .partnerId(partnerId)
                .type(type)
                .dateEmission(expiration.minusYears(1))
                .dateExpiration(expiration)
                .status(status)
                .build();
    }
}
