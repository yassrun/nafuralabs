package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.etudes.domain.audit.TransitionEtude;
import ma.nafura.etudes.repository.TransitionEtudeRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TransitionEtudeServiceTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    @Mock private TransitionEtudeRepository repository;

    private TransitionEtudeService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new TransitionEtudeService(repository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
    }

    /** SEKTOR-209/25 — l'exception de marge garde les trois montants qui ont fondé la décision. */
    @Test
    void consignerGain_conserveVenteDebourseEtMarge() {
        service.consignerGain(
                TransitionEtude.ENTITE_DOSSIER,
                "dossier-1",
                "DEVIS_GENERE",
                "GAGNE",
                UUID.randomUUID(),
                "Vente stratégique",
                new BigDecimal("500000.00"),
                new BigDecimal("582600.00"),
                new BigDecimal("-82600.00"));

        ArgumentCaptor<TransitionEtude> entry = ArgumentCaptor.forClass(TransitionEtude.class);
        verify(repository).save(entry.capture());
        assertThat(entry.getValue().getMontantVenteHt()).isEqualByComparingTo("500000.00");
        assertThat(entry.getValue().getDebourseInitialHt()).isEqualByComparingTo("582600.00");
        assertThat(entry.getValue().getMargeHt()).isEqualByComparingTo("-82600.00");
    }

    @Test
    void listerPourEntite_plusRecentEnPremier() {
        TransitionEtude ancienne = TransitionEtude.builder()
                .id(UUID.fromString("11111111-1111-1111-1111-111111111111"))
                .ancienStatut("DRAFT")
                .nouveauStatut("PENDING_ASSIGNMENT")
                .action("SUBMIT_FOR_ASSIGNMENT")
                .acteur("qa@nafuralabs.local")
                .dateTransition(java.time.OffsetDateTime.parse("2026-09-01T10:00:00Z"))
                .build();
        TransitionEtude recente = TransitionEtude.builder()
                .id(UUID.fromString("22222222-2222-2222-2222-222222222222"))
                .ancienStatut("PENDING_ASSIGNMENT")
                .nouveauStatut("ASSIGNED")
                .action("ASSIGN_STUDY")
                .acteur("qa@nafuralabs.local")
                .dateTransition(java.time.OffsetDateTime.parse("2026-09-02T10:00:00Z"))
                .build();
        when(repository.findByTenantIdAndEntiteTypeAndEntiteIdOrderByDateTransitionAsc(
                        TENANT, TransitionEtude.ENTITE_DOSSIER, "dossier-1"))
                .thenReturn(java.util.List.of(ancienne, recente));

        var out = service.listerPourEntite(TransitionEtude.ENTITE_DOSSIER, "dossier-1");

        assertThat(out).hasSize(2);
        assertThat(out.get(0).toStatus()).isEqualTo("ASSIGNED");
        assertThat(out.get(0).fromStatus()).isEqualTo("PENDING_ASSIGNMENT");
        assertThat(out.get(1).toStatus()).isEqualTo("PENDING_ASSIGNMENT");
        assertThat(out.get(0).actor()).isEqualTo("qa@nafuralabs.local");
    }

    @Test
    void consigner_prefersEmailOverUserId() {
        UserContext.setUserId(UUID.fromString("6489c367-0000-4000-8000-000000000001"));
        UserContext.setUserEmail("qa@nafuralabs.local");

        service.consigner(
                TransitionEtude.ENTITE_DOSSIER,
                "dossier-1",
                "DRAFT",
                "PENDING_ASSIGNMENT",
                UUID.randomUUID(),
                null,
                "SUBMIT_FOR_ASSIGNMENT");

        ArgumentCaptor<TransitionEtude> entry = ArgumentCaptor.forClass(TransitionEtude.class);
        verify(repository).save(entry.capture());
        assertThat(entry.getValue().getActeur()).isEqualTo("qa@nafuralabs.local");
    }
}
