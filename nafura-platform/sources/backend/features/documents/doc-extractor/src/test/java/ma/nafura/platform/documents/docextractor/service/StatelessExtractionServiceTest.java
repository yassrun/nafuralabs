package ma.nafura.platform.documents.docextractor.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmRequest;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.service.LlmService;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import ma.nafura.platform.documents.docextractor.plan.GridPlanExecutor;
import ma.nafura.platform.documents.docextractor.plan.GridProbe;
import ma.nafura.platform.documents.docextractor.plan.PlanCache;
import ma.nafura.platform.documents.docextractor.plan.PlanResolver;
import ma.nafura.platform.documents.docextractor.plan.PlanValidator;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class StatelessExtractionServiceTest {

    private static final String ITEMS_SCHEMA = """
            {
              "type":"object",
              "properties":{
                "items":{
                  "type":"array",
                  "items":{
                    "type":"object",
                    "properties":{
                      "name":{"type":"string"},
                      "qty":{"type":"string"}
                    }
                  }
                }
              }
            }
            """;

    private static final String XLSX_MIME =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private LlmService llmService;
    private StatelessExtractionService service;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        llmService = mock(LlmService.class);
        PlanCache cache = new PlanCache();
        service = new StatelessExtractionService(
                llmService,
                new SchemaValidator(objectMapper),
                objectMapper,
                new PlanResolver(new PlanValidator(), cache),
                new GridProbe(),
                new GridPlanExecutor(objectMapper)
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

    @Test
    void gridSpreadsheetUsesHeuristicPlanWithoutCallingLlm() throws Exception {
        byte[] xlsx = xlsx(new String[][] {
                {"name", "qty"},
                {"Widget", "2"}
        });

        StatelessExtractionResponse response = service.process(
                xlsx, "items.xlsx", XLSX_MIME, ITEMS_SCHEMA, null, null, "tenant-a");

        assertThat(response.outcome()).isEqualTo(StatelessExtractionResponse.Outcome.COMPLETED);
        assertThat(response.data().path("items")).hasSize(1);
        assertThat(response.data().path("items").path(0).path("name").asText()).isEqualTo("Widget");
        assertThat(response.requestId()).isEqualTo("plan:heuristic");
        verifyNoInteractions(llmService);
    }

    @Test
    void gridCompileDoesNotSendRowValuesToLlm() throws Exception {
        byte[] xlsx = xlsx(new String[][] {
                {"Libelle", "Quantite"},
                {"SECRET-VALUE-99", "7"}
        });
        LlmResponse llmResponse = planLlm("""
                {"columns":[{"index":0,"field":"name"},{"index":1,"field":"qty"}],"arrayPaths":["items"],"anchors":[],"depivot":"RESERVED","hierarchy":"NONE"}
                """);
        when(llmService.callLlm(any(), any()))
                .thenReturn(CompletableFuture.completedFuture(llmResponse));

        StatelessExtractionResponse response = service.process(
                xlsx, "items.xlsx", XLSX_MIME, ITEMS_SCHEMA, null, null, "tenant-a");

        assertThat(response.outcome()).isEqualTo(StatelessExtractionResponse.Outcome.COMPLETED);
        assertThat(response.data().path("items").path(0).path("name").asText()).isEqualTo("SECRET-VALUE-99");
        assertThat(response.requestId()).isEqualTo("plan:ia");

        ArgumentCaptor<LlmRequest> request = ArgumentCaptor.forClass(LlmRequest.class);
        ArgumentCaptor<LlmCallContext> context = ArgumentCaptor.forClass(LlmCallContext.class);
        verify(llmService, times(1)).callLlm(request.capture(), context.capture());
        assertThat(request.getValue().getPrompt()).doesNotContain("SECRET-VALUE-99");
        assertThat(request.getValue().getPrompt()).contains("Libelle");
        assertThat(context.getValue().getActionKey()).isEqualTo("compile-plan");
    }

    @Test
    void gridWithoutAcceptedPlanIsNotFlattenedForDataLlm() throws Exception {
        byte[] xlsx = xlsx(new String[][] {
                {"Libelle", "Quantite"},
                {"SECRET-VALUE-99", "7"}
        });
        LlmResponse empty = planLlm("{}");
        when(llmService.callLlm(any(), any()))
                .thenReturn(CompletableFuture.completedFuture(empty));

        StatelessExtractionResponse response = service.process(
                xlsx, "items.xlsx", XLSX_MIME, ITEMS_SCHEMA, null, null, "tenant-a");

        assertThat(response.outcome()).isEqualTo(StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE);
        assertThat(response.issues()).extracting(issue -> issue.code())
                .containsExactly("PLAN_UNRESOLVED");

        ArgumentCaptor<LlmCallContext> context = ArgumentCaptor.forClass(LlmCallContext.class);
        ArgumentCaptor<LlmRequest> request = ArgumentCaptor.forClass(LlmRequest.class);
        verify(llmService, times(2)).callLlm(request.capture(), context.capture());
        assertThat(context.getAllValues()).extracting(LlmCallContext::getActionKey)
                .containsExactly("compile-plan", "compile-plan-vision");
        assertThat(request.getAllValues()).allSatisfy(r ->
                assertThat(r.getPrompt()).doesNotContain("SECRET-VALUE-99"));
    }

    private static LlmResponse planLlm(String content) {
        LlmResponse llmResponse = new LlmResponse();
        llmResponse.setRequestId("plan-1");
        llmResponse.setProvider("test");
        llmResponse.setModel("test");
        llmResponse.setContent(content);
        llmResponse.setCreatedAt(Instant.now());
        return llmResponse;
    }

    private static byte[] xlsx(String[][] cells) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("S");
            for (int r = 0; r < cells.length; r++) {
                Row row = sheet.createRow(r);
                for (int c = 0; c < cells[r].length; c++) {
                    row.createCell(c).setCellValue(cells[r][c]);
                }
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }
}
