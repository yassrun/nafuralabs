package ma.nafura.erp.etudes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.service.port.EtudeClientPort;
import ma.nafura.partner.domain.model.Partner;
import ma.nafura.partner.domain.model.PartnerRoleType;
import ma.nafura.partner.repository.PartnerRepository;
import ma.nafura.partner.repository.PartnerRoleRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PartnerClientAdapterTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID PARTNER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private PartnerRoleRepository roleRepository;

    private PartnerClientAdapter adapter;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        adapter = new PartnerClientAdapter(partnerRepository, roleRepository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void requireClientRole_ok() {
        Partner partner = Partner.builder()
                .id(PARTNER_ID)
                .tenantId(TENANT)
                .code("CLI-001")
                .raisonSociale("OCP Promotion SA")
                .build();
        when(partnerRepository.findByIdAndTenantId(PARTNER_ID, TENANT)).thenReturn(Optional.of(partner));
        when(roleRepository.existsByTenantIdAndPartnerIdAndRole(TENANT, PARTNER_ID, PartnerRoleType.CLIENT))
                .thenReturn(true);

        EtudeClientPort.ClientSnapshot snap = adapter.requireClientRole(PARTNER_ID.toString());

        assertThat(snap.id()).isEqualTo(PARTNER_ID);
        assertThat(snap.code()).isEqualTo("CLI-001");
        assertThat(snap.raisonSociale()).isEqualTo("OCP Promotion SA");
    }

    @Test
    void requireClientRole_idInvalide() {
        assertThatThrownBy(() -> adapter.requireClientRole("cli-001"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.client.id_invalide");
    }

    @Test
    void requireClientRole_introuvable() {
        when(partnerRepository.findByIdAndTenantId(PARTNER_ID, TENANT)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adapter.requireClientRole(PARTNER_ID.toString()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.client.introuvable");
    }

    @Test
    void requireClientRole_roleInvalide() {
        Partner partner = Partner.builder()
                .id(PARTNER_ID)
                .tenantId(TENANT)
                .code("F-001")
                .raisonSociale("Fournisseur")
                .build();
        when(partnerRepository.findByIdAndTenantId(PARTNER_ID, TENANT)).thenReturn(Optional.of(partner));
        when(roleRepository.existsByTenantIdAndPartnerIdAndRole(TENANT, PARTNER_ID, PartnerRoleType.CLIENT))
                .thenReturn(false);

        assertThatThrownBy(() -> adapter.requireClientRole(PARTNER_ID.toString()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.client.role_invalide");
    }

    @Test
    void resolve_blank_estVide() {
        assertThat(adapter.resolve(null)).isEmpty();
        assertThat(adapter.resolve("  ")).isEmpty();
    }
}
