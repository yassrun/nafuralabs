package ma.nafura.platform.ai.conversation.context;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AiSchemaContextTest {

    @Test
    void buildLlmContext_coreOnly_includesChantiersWithLabelColumn() {
        TableSchema chantiers = new TableSchema();
        chantiers.setName("chantiers");
        chantiers.setDomain("chantiers");
        chantiers.setCategory("core");
        chantiers.setDescription("Construction projects");
        chantiers.setAliases(List.of("chantier", "projet"));
        chantiers.setHints(List.of("ex: SELECT code, label FROM chantiers"));
        TableSchema.ColumnSchema label = new TableSchema.ColumnSchema();
        label.setName("label");
        label.setType("text");
        label.setDescription("project name (UI: name)");
        chantiers.setColumns(List.of(label));

        TableSchema extended = new TableSchema();
        extended.setName("chantier_lots");
        extended.setDomain("chantiers");
        extended.setCategory("extended");
        extended.setColumns(List.of());

        AiSchemaContext ctx = new AiSchemaContext(List.of(chantiers, extended), new ObjectMapper().createObjectNode());
        String prompt = ctx.buildLlmContext(Set.of(), 15);

        assertTrue(prompt.contains("chantier, projet → chantiers"));
        assertTrue(prompt.contains("label(text)=project name (UI: name)"));
        assertTrue(prompt.contains("chantiers"));
        assertTrue(prompt.contains("tenant_id auto-filtered"));
        assertTrue(!prompt.contains("chantier_lots"), "extended table omitted without domain focus");
    }

    @Test
    void buildLlmContext_withDomainFocus_includesExtendedTables() {
        TableSchema core = new TableSchema();
        core.setName("chantiers");
        core.setDomain("chantiers");
        core.setCategory("core");
        core.setColumns(List.of());

        TableSchema extended = new TableSchema();
        extended.setName("situations_travaux");
        extended.setDomain("chantiers");
        extended.setCategory("extended");
        extended.setColumns(List.of());

        AiSchemaContext ctx = new AiSchemaContext(List.of(core, extended), new ObjectMapper().createObjectNode());
        String prompt = ctx.buildLlmContext(Set.of("chantiers"), 15);

        assertTrue(prompt.contains("situations_travaux"));
    }
}
