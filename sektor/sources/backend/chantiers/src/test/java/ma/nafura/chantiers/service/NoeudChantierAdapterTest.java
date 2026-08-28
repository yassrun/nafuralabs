package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NoeudChantierAdapterTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String CHANTIER = "ch-1";
    private static final String LOT = "lot-2";
    private static final String POSTE = "poste-2-3";

    @Mock private PosteBudgetaireRepository posteRepository;
    @Mock private ChantierLotRepository lotRepository;

    private NoeudChantierAdapter adapter;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        adapter = new NoeudChantierAdapter(posteRepository, lotRepository);
        when(lotRepository.findByIdAndTenantId(LOT, TENANT))
                .thenReturn(Optional.of(ChantierLot.builder().id(LOT).chantierId(CHANTIER).code("2").build()));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void interne_refuse() {
        when(posteRepository.findByIdAndTenantId(POSTE, TENANT))
                .thenReturn(Optional.of(PosteBudgetaire.builder()
                        .id(POSTE).lotId(LOT).code("2.3").nature(NatureLigne.INTERNE).build()));
        assertThatThrownBy(() -> adapter.requirePosteVendu(CHANTIER, POSTE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(NoeudChantierAdapter.ERR_NOEUD_INTERNE);
    }

    @Test
    void horsChantier_refuse() {
        when(posteRepository.findByIdAndTenantId(POSTE, TENANT))
                .thenReturn(Optional.of(PosteBudgetaire.builder()
                        .id(POSTE).lotId(LOT).code("2.3").nature(NatureLigne.VENDU).build()));
        when(lotRepository.findByIdAndTenantId(LOT, TENANT))
                .thenReturn(Optional.of(ChantierLot.builder().id(LOT).chantierId("autre").code("2").build()));
        assertThatThrownBy(() -> adapter.requirePosteVendu(CHANTIER, POSTE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(NoeudChantierAdapter.ERR_NOEUD_HORS_CHANTIER);
    }

    @Test
    void venduDuChantier_ok() {
        when(posteRepository.findByIdAndTenantId(POSTE, TENANT))
                .thenReturn(Optional.of(PosteBudgetaire.builder()
                        .id(POSTE).lotId(LOT).code("2.3").nature(NatureLigne.VENDU).build()));
        adapter.requirePosteVendu(CHANTIER, POSTE);
    }
}
