package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.activite.ActiviteRattachement;
import ma.nafura.chantiers.repository.ActiviteRattachementRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** AC-8 / AC-11 — couverture réelle ; vide si aucune activité. */
@ExtendWith(MockitoExtension.class)
class ActiviteCouvertureServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock private ActiviteRattachementRepository repository;
    private ActiviteCouvertureService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new ActiviteCouvertureService(repository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void sansRattachement_listeVide() {
        when(repository.findByTenantIdAndPosteId(TENANT, "poste-1")).thenReturn(List.of());
        when(repository.findByTenantIdAndLotIdAndPosteIdIsNull(TENANT, "poste-1")).thenReturn(List.of());

        assertThat(service.activitesCouvrant("poste-1")).isEmpty();
    }

    @Test
    void avecRattachement_retourneActivite() {
        when(repository.findByTenantIdAndPosteId(TENANT, "poste-1"))
                .thenReturn(List.of(ActiviteRattachement.builder()
                        .id("r1")
                        .activiteId("act-coffrage")
                        .posteId("poste-1")
                        .build()));
        when(repository.findByTenantIdAndLotIdAndPosteIdIsNull(TENANT, "poste-1")).thenReturn(List.of());

        assertThat(service.activitesCouvrant("poste-1")).containsExactly("act-coffrage");
    }
}
