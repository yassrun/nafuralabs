package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import ma.nafura.etudes.domain.model.ComposantDpu;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * Le calcul confronte a l'integralite d'un sous-detail reel.
 *
 * <p>{@link DpuCalculatorSousDetailReelTest} verifie sept cas choisis a la main. Cette classe
 * rejoue les <b>84 ouvrages</b> du meme classeur, extraits mecaniquement par
 * {@code sektor/tools/corpus-ouvrages/extract_sous_details.py}. Chaque ouvrage doit
 * retrouver le total calcule par le classeur de l'entreprise.
 *
 * <p>Ce corpus n'est <b>pas</b> une valeur par defaut : ce sont les prix et rendements d'un
 * tenant. Il vit ici, dans les tests, et nulle part ailleurs — ni seed, ni
 * {@code ParametresEtudeService}. Voir {@code 11-SOURCES-METIER.md}.
 *
 * <p>La tolerance d'un centime vient de l'arrondi : le calculateur arrondit chaque ligne au
 * centime la ou le tableur garde la precision complete. L'ecart maximal constate sur les 84
 * ouvrages est de 0,008 DH.
 */
class DpuCalculatorCorpusReelTest {

    private static final String CORPUS = "corpus/sous-details-gros-oeuvre.json";
    private static final BigDecimal TOLERANCE = new BigDecimal("0.01");

    private final DpuCalculator calculator = new DpuCalculator();

    record CasReel(String famille, String designation, List<ComposantDpu> composants,
                   BigDecimal rendementJournalier, BigDecimal totalAttendu) {
        @Override
        public String toString() {
            return famille + " — " + designation;
        }
    }

    static Stream<CasReel> corpus() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        try (InputStream in = DpuCalculatorCorpusReelTest.class.getClassLoader().getResourceAsStream(CORPUS)) {
            assertThat(in).as("corpus %s absent du classpath de test", CORPUS).isNotNull();
            JsonNode root = mapper.readTree(in);
            List<CasReel> cas = new ArrayList<>();
            for (JsonNode o : root.get("ouvrages")) {
                List<ComposantDpu> composants = new ArrayList<>();
                for (JsonNode c : o.get("composants")) {
                    composants.add(ComposantDpu.builder()
                            .referenceType("LIBRE")
                            .libelle(c.path("designation").asText(null))
                            .unite(c.path("unite").asText(null))
                            .rendement(new BigDecimal(c.get("rendement").asText()))
                            .prixUnitaire(new BigDecimal(c.get("prixUnitaire").asText()))
                            .baseRendement("PAR_JOUR".equals(c.path("baseRendement").asText())
                                    ? ComposantDpu.BASE_PAR_JOUR
                                    : ComposantDpu.BASE_PAR_UNITE)
                            .build());
                }
                cas.add(new CasReel(
                        o.get("famille").asText(),
                        o.get("designation").asText(),
                        composants,
                        o.hasNonNull("rendementJournalier")
                                ? new BigDecimal(o.get("rendementJournalier").asText())
                                : null,
                        new BigDecimal(o.get("totalClasseur").asText())));
            }
            return cas.stream();
        }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("corpus")
    void chaque_ouvrage_retrouve_le_total_du_classeur(CasReel cas) {
        calculator.recomputeLineTotals(cas.composants());
        BigDecimal debourse = calculator.computeDeboursSec(cas.composants(), cas.rendementJournalier());

        assertThat(debourse)
                .as("deboursé de « %s »", cas.designation())
                .isCloseTo(cas.totalAttendu(), within(TOLERANCE));
    }

    /**
     * Garde-fou sur le corpus lui-meme : s'il se vide ou se tronque, les tests parametres
     * passeraient sans rien verifier.
     */
    @Test
    void le_corpus_couvre_bien_le_classeur_entier() throws Exception {
        List<CasReel> cas = corpus().toList();

        assertThat(cas).hasSize(84);
        assertThat(cas.stream().mapToInt(c -> c.composants().size()).sum()).isEqualTo(290);
        assertThat(cas.stream().map(CasReel::famille).distinct()).hasSize(16);
        // Onze ouvrages chiffrent a la journee : c'est la base mixte, elle doit rester couverte.
        assertThat(cas.stream().filter(c -> c.rendementJournalier() != null)).hasSize(11);
    }
}
