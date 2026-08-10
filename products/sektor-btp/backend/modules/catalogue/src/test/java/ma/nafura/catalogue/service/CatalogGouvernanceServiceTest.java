package ma.nafura.catalogue.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.domain.model.CatalogArticle;
import ma.nafura.catalogue.domain.model.CatalogCandidat;
import ma.nafura.catalogue.domain.model.CatalogEdition;
import ma.nafura.catalogue.repository.CatalogArticleRepository;
import ma.nafura.catalogue.repository.CatalogCandidatRepository;
import ma.nafura.catalogue.repository.CatalogEditionRepository;
import ma.nafura.catalogue.repository.CatalogOuvrageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CatalogGouvernanceServiceTest {

    @Mock
    private CatalogCandidatRepository candidatRepository;

    @Mock
    private CatalogArticleRepository articleRepository;

    @Mock
    private CatalogOuvrageRepository ouvrageRepository;

    @Mock
    private CatalogEditionRepository editionRepository;

    private CatalogGouvernanceService service;

    @BeforeEach
    void setUp() {
        service = new CatalogGouvernanceService(
                candidatRepository,
                articleRepository,
                ouvrageRepository,
                editionRepository,
                new CatalogGouvernanceParams());
    }

    @Test
    void sousSeuil_refusePublication() {
        UUID id = UUID.randomUUID();
        CatalogCandidat c = CatalogCandidat.builder()
                .id(id)
                .libellePropose("Enduit spécial")
                .typeObjet("ARTICLE")
                .nbTenantsConfirmants(1)
                .statut("PROPOSE")
                .build();
        when(candidatRepository.findById(id)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.publier(id, "2026.1", "editor"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("sous_seuil");
    }

    @Test
    void eligible_publieArticle() {
        UUID id = UUID.randomUUID();
        CatalogCandidat c = CatalogCandidat.builder()
                .id(id)
                .libellePropose("Peinture acrylique intérieure")
                .nature("MATIERE")
                .uniteCode("L")
                .typeObjet("ARTICLE")
                .nbTenantsConfirmants(7)
                .statut("PROPOSE")
                .build();
        when(candidatRepository.findById(id)).thenReturn(Optional.of(c));
        when(editionRepository.findByCode("2026.1"))
                .thenReturn(Optional.of(CatalogEdition.builder().code("2026.1").statut("PUBLIEE").build()));
        when(articleRepository.existsByCleStable(any())).thenReturn(false);
        when(articleRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(candidatRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CatalogCandidat out = service.publier(id, "2026.1", "editor");
        assertThat(out.getStatut()).isEqualTo("ACCEPTE");
        assertThat(out.getCatalogCleCreee()).isEqualTo("peinture-acrylique-interieure");

        ArgumentCaptor<CatalogArticle> art = ArgumentCaptor.forClass(CatalogArticle.class);
        verify(articleRepository).save(art.capture());
        assertThat(art.getValue().getStatut()).isEqualTo("PUBLIE");
        assertThat(art.getValue().getEditionPublication()).isEqualTo("2026.1");
    }

    @Test
    void listerProposes_filtreSousSeuil() {
        CatalogCandidat sous = CatalogCandidat.builder()
                .id(UUID.randomUUID())
                .libellePropose("Sous seuil")
                .typeObjet("ARTICLE")
                .nbTenantsConfirmants(1)
                .statut("PROPOSE")
                .build();
        CatalogCandidat ok = CatalogCandidat.builder()
                .id(UUID.randomUUID())
                .libellePropose("Eligible")
                .typeObjet("ARTICLE")
                .nbTenantsConfirmants(5)
                .statut("PROPOSE")
                .build();
        when(candidatRepository.findByStatutOrderByNbTenantsConfirmantsDescCreatedAtAsc("PROPOSE"))
                .thenReturn(List.of(ok, sous));

        assertThat(service.listerProposesEligibles()).containsExactly(ok);
        assertThat(service.listerTousProposes()).containsExactly(ok, sous);
    }

    @Test
    void estEligible_selonSeuil() {
        CatalogCandidat sous = CatalogCandidat.builder()
                .typeObjet("ARTICLE")
                .nbTenantsConfirmants(2)
                .build();
        CatalogCandidat ok = CatalogCandidat.builder()
                .typeObjet("ARTICLE")
                .nbTenantsConfirmants(3)
                .build();
        assertThat(service.estEligible(sous)).isFalse();
        assertThat(service.estEligible(ok)).isTrue();
    }
}
