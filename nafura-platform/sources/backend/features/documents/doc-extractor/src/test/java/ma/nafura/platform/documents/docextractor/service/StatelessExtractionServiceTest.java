package ma.nafura.platform.documents.docextractor.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.service.LlmService;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class StatelessExtractionServiceTest {

    private LlmService llmService;
    private StatelessExtractionService service;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        llmService = mock(LlmService.class);
        service = new StatelessExtractionService(
                llmService,
                new SchemaValidator(objectMapper),
                objectMapper
        );
    }

    @Test
    void rejectsInvalidInlineSchemaWithoutCallingLlm() {
        StatelessExtractionResponse response = service.process(
                "a,b\n1,2".getBytes(),
                "rows.csv",
                "text/csv",
                "{\"type\":\"array\"}",
                null,
                null,
                "tenant"
        );

        assertThat(response.outcome()).isEqualTo(StatelessExtractionResponse.Outcome.REJECTED);
        assertThat(response.issues()).extracting(issue -> issue.code())
                .containsExactly("INVALID_INLINE_SCHEMA");
        verifyNoInteractions(llmService);
    }

    @Test
    void requiresSchemaWithoutStartingProposalImplicitly() {
        StatelessExtractionResponse response = service.process(
                "a,b\n1,2".getBytes(),
                "rows.csv",
                "text/csv",
                null,
                null,
                null,
                "tenant"
        );

        assertThat(response.outcome()).isEqualTo(StatelessExtractionResponse.Outcome.REJECTED);
        assertThat(response.issues()).extracting(issue -> issue.code())
                .containsExactly("SCHEMA_REQUIRED");
        verifyNoInteractions(llmService);
    }

    @Test
    void returnsReviewRequiredWhenOneRequiredValueIsMissing() {
        LlmResponse llmResponse = new LlmResponse();
        llmResponse.setRequestId("request-1");
        llmResponse.setProvider("gemini");
        llmResponse.setModel("test");
        llmResponse.setContent("{}");
        llmResponse.setCreatedAt(Instant.now());
        when(llmService.callLlm(any(), any()))
                .thenReturn(CompletableFuture.completedFuture(llmResponse));

        StatelessExtractionResponse response = service.process(
                "invoice_number\n".getBytes(),
                "invoice.csv",
                "text/csv",
                """
                {
                  "type":"object",
                  "properties":{"invoiceNumber":{"type":"string"}},
                  "required":["invoiceNumber"]
                }
                """,
                null,
                null,
                "tenant"
        );

        assertThat(response.outcome()).isEqualTo(StatelessExtractionResponse.Outcome.REVIEW_REQUIRED);
        assertThat(response.issues()).singleElement().satisfies(issue -> {
            assertThat(issue.path()).isEqualTo("invoiceNumber");
            assertThat(issue.code()).isEqualTo("MISSING_REQUIRED");
        });
    }
}
