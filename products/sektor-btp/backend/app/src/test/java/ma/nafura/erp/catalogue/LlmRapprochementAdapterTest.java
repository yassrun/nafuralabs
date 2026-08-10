package ma.nafura.erp.catalogue;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.util.List;
import ma.nafura.catalogue.service.port.LlmRapprochementPort.CatalogueSnippet;
import ma.nafura.catalogue.service.port.LlmRapprochementPort.Suggestion;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.StatelessExtractionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LlmRapprochementAdapterTest {

    @Mock
    private StatelessExtractionService extractionService;

    private LlmRapprochementAdapter adapter;
    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        adapter = new LlmRapprochementAdapter(extractionService);
    }

    @Test
    void suggerer_filtreClesInconnues() {
        ObjectNode data = mapper.createObjectNode();
        ArrayNode matches = data.putArray("matches");
        matches.addObject().put("catalogCle", "peinture-acrylique-interieure").put("confiance", 0.72);
        matches.addObject().put("catalogCle", "cle-inventee").put("confiance", 0.99);

        when(extractionService.process(
                        any(), anyString(), anyString(), anyString(), isNull(), anyString(), isNull(), anyInt()))
                .thenReturn(new StatelessExtractionResponse(
                        StatelessExtractionResponse.Outcome.COMPLETED,
                        data,
                        null,
                        null,
                        null,
                        List.of(),
                        null,
                        null,
                        null,
                        null,
                        null));

        List<Suggestion> out = adapter.suggerer(
                "Peinture blanche mur",
                List.of(new CatalogueSnippet(
                        "peinture-acrylique-interieure",
                        "Peinture acrylique intérieure",
                        "MATIERE",
                        "L")),
                5);

        assertThat(out).hasSize(1);
        assertThat(out.getFirst().catalogCle()).isEqualTo("peinture-acrylique-interieure");
        assertThat(out.getFirst().confiance()).isEqualByComparingTo(new BigDecimal("0.7200"));
    }
}
