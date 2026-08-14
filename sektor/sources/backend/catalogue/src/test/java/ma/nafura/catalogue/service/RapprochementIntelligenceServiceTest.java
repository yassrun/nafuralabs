package ma.nafura.catalogue.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.catalogue.domain.ouvrage.CatalogArticle;
import ma.nafura.catalogue.repository.CatalogArticleRepository;
import ma.nafura.catalogue.repository.ItemMatchRepository;
import ma.nafura.catalogue.service.RapprochementDeterministeService.CandidatMatch;
import ma.nafura.catalogue.service.port.LlmRapprochementPort;
import ma.nafura.catalogue.service.port.LlmRapprochementPort.Suggestion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RapprochementIntelligenceServiceTest {

    @Mock
    private RapprochementDeterministeService deterministe;

    @Mock
    private LlmRapprochementPort llmPort;

    @Mock
    private CatalogArticleRepository articleRepository;

    @Mock
    private ItemMatchRepository matchRepository;

    private RapprochementLlmMetrics metrics;
    private RapprochementIntelligenceService service;

    @BeforeEach
    void setUp() {
        metrics = new RapprochementLlmMetrics();
        service = new RapprochementIntelligenceService(
                deterministe, llmPort, metrics, articleRepository, matchRepository);
    }

    @Test
    void exact_neDeclenchePasLlm() {
        when(deterministe.rechercher(anyString(), isNull(), isNull(), anyInt()))
                .thenReturn(List.of(match("peinture-acrylique-interieure", "EXACT", "1.0000")));

        List<CandidatMatch> hits = service.rechercher("Peinture acrylique intérieure", null, null, 10);

        assertThat(hits).hasSize(1);
        assertThat(hits.getFirst().methode()).isEqualTo("EXACT");
        verify(llmPort, never()).suggerer(anyString(), anyList(), anyInt());
        assertThat(metrics.llmAppels()).isZero();
        assertThat(metrics.llmSkipsDeterministe()).isEqualTo(1);
    }

    @Test
    void listeVide_appelleLlmSiDispo() {
        when(deterministe.rechercher(anyString(), isNull(), isNull(), anyInt())).thenReturn(List.of());
        when(llmPort.isAvailable()).thenReturn(true);
        when(articleRepository.findByStatutOrderByLibelleAsc("PUBLIE"))
                .thenReturn(List.of(CatalogArticle.builder()
                        .id(UUID.randomUUID())
                        .cleStable("x")
                        .libelle("X")
                        .nature("MATIERE")
                        .uniteCode("U")
                        .statut("PUBLIE")
                        .build()));
        when(llmPort.suggerer(anyString(), anyList(), anyInt()))
                .thenReturn(List.of(new Suggestion("x", "X", "MATIERE", "U", BigDecimal.valueOf(0.6))));

        List<CandidatMatch> hits = service.rechercher("truc inconnu", null, null, 10);

        assertThat(hits).hasSize(1);
        assertThat(hits.getFirst().methode()).isEqualTo("LLM");
        assertThat(metrics.llmAppels()).isEqualTo(1);
        assertThat(metrics.tauxAppelLlm()).isEqualTo(1.0);
    }

    @Test
    void tranche_helper() {
        assertThat(RapprochementIntelligenceService.tranche(List.of())).isFalse();
        assertThat(RapprochementIntelligenceService.tranche(
                        List.of(match("a", "EXACT", "1.0000"))))
                .isTrue();
        assertThat(RapprochementIntelligenceService.tranche(
                        List.of(match("a", "TRIGRAM", "0.5000"))))
                .isFalse();
        assertThat(RapprochementIntelligenceService.tranche(List.of(
                        match("a", "REGLE", "0.9000"), match("b", "TRIGRAM", "0.5000"))))
                .isTrue();
    }

    private static CandidatMatch match(String cle, String methode, String conf) {
        return new CandidatMatch(cle, cle, "MATIERE", "L", methode, new BigDecimal(conf));
    }
}
