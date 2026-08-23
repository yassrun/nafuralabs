package ma.nafura.catalogue.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.api.IdentiteClasse;
import ma.nafura.catalogue.domain.article.Item;
import ma.nafura.catalogue.domain.ouvrage.CatalogArticle;
import ma.nafura.catalogue.repository.CatalogArticleRepository;
import ma.nafura.catalogue.repository.ItemRepository;
import ma.nafura.catalogue.service.port.capability.LlmRapprochementPort;
import ma.nafura.catalogue.service.port.capability.LlmRapprochementPort.Suggestion;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ExtraireIdentiteServiceTest {

    @Mock private CatalogArticleRepository articleRepository;
    @Mock private ItemRepository itemRepository;
    @Mock private LlmRapprochementPort llm;

    private ExtraireIdentiteService service;
    private final UUID tenantId = UUID.randomUUID();
    private final UUID itemId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new ExtraireIdentiteService(articleRepository, itemRepository, llm);
        when(articleRepository.findByStatutOrderByLibelleAsc("PUBLIE"))
                .thenReturn(List.of(
                        article("peinture-acrylique-interieure", "Peinture acrylique intérieure"),
                        article("ciment-cpj-45", "Ciment CPJ 45")));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void dejaTenant_siIdentiteUniqueEtItemExiste() {
        when(llm.isAvailable()).thenReturn(true);
        when(llm.suggerer(anyString(), anyList(), anyInt()))
                .thenReturn(List.of(suggestion("peinture-acrylique-interieure", "Peinture acrylique intérieure", "0.92")));
        when(itemRepository.findByTenantIdAndCleStable(tenantId, "peinture-acrylique-interieure"))
                .thenReturn(Optional.of(Item.builder()
                        .id(itemId)
                        .cleStable("peinture-acrylique-interieure")
                        .name("Peinture acrylique intérieure")
                        .build()));

        IdentiteClasse classe = service.classer("peinture acrylique blanche", "MATIERE");

        assertThat(classe.seau()).isEqualTo(IdentiteClasse.DEJA_TENANT);
        assertThat(classe.cleStable()).isEqualTo("peinture-acrylique-interieure");
        assertThat(classe.itemId()).isEqualTo(itemId.toString());
    }

    @Test
    void aCreer_siIdentiteUniqueSansItem_jamaisEcrit() {
        when(llm.isAvailable()).thenReturn(true);
        when(llm.suggerer(anyString(), anyList(), anyInt()))
                .thenReturn(List.of(suggestion("ciment-cpj-45", "Ciment CPJ 45", "0.88")));
        when(itemRepository.findByTenantIdAndCleStable(tenantId, "ciment-cpj-45"))
                .thenReturn(Optional.empty());

        IdentiteClasse classe = service.classer("ciment CPJ 45", "MATIERE");

        assertThat(classe.seau()).isEqualTo(IdentiteClasse.A_CREER);
        assertThat(classe.cleStable()).isEqualTo("ciment-cpj-45");
        assertThat(classe.itemId()).isNull();
        verify(itemRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void incertain_siDeuxIdentites_nePrendPasLeMeilleurScore() {
        when(llm.isAvailable()).thenReturn(true);
        when(llm.suggerer(anyString(), anyList(), anyInt()))
                .thenReturn(List.of(
                        suggestion("peinture-acrylique-interieure", "Peinture acrylique intérieure", "0.91"),
                        suggestion("ciment-cpj-45", "Ciment CPJ 45", "0.70")));

        IdentiteClasse classe = service.classer("produit ambigu", "MATIERE");

        assertThat(classe.seau()).isEqualTo(IdentiteClasse.INCERTAIN);
        assertThat(classe.identitesCandidates())
                .containsExactly("peinture-acrylique-interieure", "ciment-cpj-45");
        assertThat(classe.itemId()).isNull();
        verify(itemRepository, never()).findByTenantIdAndCleStable(org.mockito.ArgumentMatchers.any(), anyString());
    }

    @Test
    void llmIndisponible_aCreerSansLike() {
        when(llm.isAvailable()).thenReturn(false);

        IdentiteClasse classe = service.classer("peinture acrylique blanche", "MATIERE");

        assertThat(classe.seau()).isEqualTo(IdentiteClasse.A_CREER);
        verify(llm, never()).suggerer(anyString(), anyList(), anyInt());
    }

    @Test
    void promptIgnoreTinySpec_peintureBlancheNEstPasUneIdentite() {
        when(llm.isAvailable()).thenReturn(true);
        when(llm.suggerer(anyString(), anyList(), anyInt())).thenReturn(List.of());

        service.classer("peinture acrylique blanche", "MATIERE");

        ArgumentCaptor<String> query = ArgumentCaptor.forClass(String.class);
        verify(llm).suggerer(query.capture(), anyList(), anyInt());
        assertThat(query.getValue()).contains("peinture acrylique blanche");
        assertThat(query.getValue()).contains("peinture-acrylique-interieure");
        assertThat(query.getValue()).contains("pas « peinture blanche »");
    }

    private static CatalogArticle article(String cle, String libelle) {
        return CatalogArticle.builder()
                .id(UUID.randomUUID())
                .cleStable(cle)
                .libelle(libelle)
                .nature("MATIERE")
                .uniteCode("L")
                .statut("PUBLIE")
                .build();
    }

    private static Suggestion suggestion(String cle, String libelle, String conf) {
        return new Suggestion(cle, libelle, "MATIERE", "L", new BigDecimal(conf));
    }
}
