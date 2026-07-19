package ma.nafura.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.consultation.domain.model.ConsultationNoeud;
import ma.nafura.consultation.repository.ConsultationComposantRepository;
import ma.nafura.consultation.repository.ConsultationNoeudRepository;
import ma.nafura.consultation.repository.ConsultationRepository;
import ma.nafura.etudes.service.port.DecompositionSuggestionPort;
import ma.nafura.etudes.service.port.DescriptifResolverPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ConsultationNoeudServiceTest {

    @Mock
    private ConsultationRepository consultationRepository;

    @Mock
    private ConsultationNoeudRepository noeudRepository;

    @Mock
    private ConsultationComposantRepository composantRepository;

    @Mock
    private ConsultationPricingCalculator pricingCalculator;

    @Mock
    private DescriptifResolverPort descriptifResolverPort;

    @Mock
    private DecompositionSuggestionPort decompositionSuggestionPort;

    private ConsultationNoeudService service;

    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new ConsultationNoeudService(
                consultationRepository,
                noeudRepository,
                composantRepository,
                pricingCalculator,
                descriptifResolverPort,
                decompositionSuggestionPort);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void setMode_switchesPosteToDecompose() {
        UUID noeudId = UUID.randomUUID();
        ConsultationNoeud poste = ConsultationNoeud.builder()
                .id(noeudId)
                .tenantId(tenantId)
                .type(ConsultationNoeud.TYPE_POSTE)
                .libelle("Beton")
                .mode(ConsultationNoeud.MODE_FOURNI)
                .build();
        when(noeudRepository.findByIdAndTenantId(noeudId, tenantId)).thenReturn(Optional.of(poste));
        when(noeudRepository.save(any(ConsultationNoeud.class))).thenAnswer(inv -> inv.getArgument(0));
        when(composantRepository.findByTenantIdAndNoeudIdOrderByOrdreAsc(tenantId, noeudId))
                .thenReturn(List.of());

        ConsultationNoeud updated = service.setMode(noeudId, "decompose");

        assertThat(updated.getMode()).isEqualTo(ConsultationNoeud.MODE_DECOMPOSE);
    }

    @Test
    void setMode_rejectsNonPosteNode() {
        UUID noeudId = UUID.randomUUID();
        ConsultationNoeud lot = ConsultationNoeud.builder()
                .id(noeudId)
                .tenantId(tenantId)
                .type(ConsultationNoeud.TYPE_LOT)
                .libelle("Gros oeuvre")
                .build();
        when(noeudRepository.findByIdAndTenantId(noeudId, tenantId)).thenReturn(Optional.of(lot));

        assertThatThrownBy(() -> service.setMode(noeudId, "DECOMPOSE"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void setMode_rejectsInvalidMode() {
        UUID noeudId = UUID.randomUUID();
        ConsultationNoeud poste = ConsultationNoeud.builder()
                .id(noeudId)
                .tenantId(tenantId)
                .type(ConsultationNoeud.TYPE_POSTE)
                .libelle("Beton")
                .build();
        when(noeudRepository.findByIdAndTenantId(noeudId, tenantId)).thenReturn(Optional.of(poste));

        assertThatThrownBy(() -> service.setMode(noeudId, "AUTRE"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
