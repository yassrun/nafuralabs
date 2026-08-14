package ma.nafura.catalogue.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import ma.nafura.catalogue.domain.model.CatalogArticle;
import ma.nafura.catalogue.service.RapprochementDeterministeService.CandidatMatch;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class RapprochementDeterministeServiceTest {

    private RapprochementDeterministeService service;
    private List<CatalogArticle> corpus;

    @BeforeEach
    void setUp() {
        service = new RapprochementDeterministeService(null, null);
        corpus = List.of(
                article("peinture-acrylique-interieure", "Peinture acrylique intérieure"),
                article("ciment-cpj-45", "Ciment CPJ 45"),
                article("sable-dune", "Sable de dune"));
    }

    @Test
    void scenarioReference_peintureBlancheVersAcrylique() {
        List<CandidatMatch> hits = service.rechercherSurCorpus(
                "Peinture blanche mur intérieur", corpus, Set.of(), 10);
        assertThat(hits).isNotEmpty();
        assertThat(hits.getFirst().catalogCle()).isEqualTo("peinture-acrylique-interieure");
        assertThat(hits.getFirst().methode()).isIn("REGLE", "TRIGRAM", "EXACT");
        assertThat(hits.getFirst().confiance().doubleValue()).isGreaterThan(0.5);
        assertThat(hits.getFirst().methode()).isNotEqualTo("LLM");
    }

    @Test
    void rejete_nonRepropose() {
        List<CandidatMatch> hits = service.rechercherSurCorpus(
                "Peinture blanche mur intérieur",
                corpus,
                Set.of("peinture-acrylique-interieure"),
                10);
        assertThat(hits).noneMatch(h -> "peinture-acrylique-interieure".equals(h.catalogCle()));
    }

    @Test
    void exact_prioritaire() {
        List<CandidatMatch> hits =
                service.rechercherSurCorpus("Peinture acrylique intérieure", corpus, Set.of(), 10);
        assertThat(hits.getFirst().methode()).isEqualTo("EXACT");
        assertThat(hits.getFirst().confiance()).isEqualByComparingTo("1.0000");
    }

    @Test
    void perf_listeCourte_10k_sous200ms() {
        List<CatalogArticle> big = new ArrayList<>(10_000);
        for (int i = 0; i < 10_000; i++) {
            big.add(article("art-" + i, "Article technique numero " + i + " variante beta"));
        }
        big.set(1234, article("peinture-acrylique-interieure", "Peinture acrylique intérieure"));

        long t0 = System.nanoTime();
        List<CandidatMatch> hits =
                service.rechercherSurCorpus("Peinture blanche mur intérieur", big, Set.of(), 10);
        long ms = (System.nanoTime() - t0) / 1_000_000L;

        assertThat(hits).isNotEmpty();
        assertThat(hits.size()).isLessThanOrEqualTo(10);
        assertThat(ms)
                .as("liste courte 10 sur 10k doit rester sous 200 ms (mesuré %d ms)", ms)
                .isLessThan(200L);
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
}
