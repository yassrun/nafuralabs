package ma.nafura.platform.ai.conversation.context;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AiSchemaContextTest {

    @Test
    void buildLlmContext_coreOnly_includesItemsWithLabelColumn() {
        TableSchema items = new TableSchema();
        items.setName("items");
        items.setDomain("catalog");
        items.setCategory("core");
        items.setDescription("Catalog entities");
        items.setAliases(List.of("item", "entity"));
        items.setHints(List.of("ex: SELECT code, label FROM items"));
        TableSchema.ColumnSchema label = new TableSchema.ColumnSchema();
        label.setName("label");
        label.setType("text");
        label.setDescription("display name (UI: name)");
        items.setColumns(List.of(label));

        TableSchema extended = new TableSchema();
        extended.setName("item_variants");
        extended.setDomain("catalog");
        extended.setCategory("extended");
        extended.setColumns(List.of());

        AiSchemaContext ctx = new AiSchemaContext(List.of(items, extended), new ObjectMapper().createObjectNode());
        String prompt = ctx.buildLlmContext(Set.of(), 15);

        assertTrue(prompt.contains("item, entity → items"));
        assertTrue(prompt.contains("label(text)=display name (UI: name)"));
        assertTrue(prompt.contains("items"));
        assertTrue(prompt.contains("tenant_id auto-filtered"));
        assertTrue(!prompt.contains("item_variants"), "extended table omitted without domain focus");
    }

    @Test
    void buildLlmContext_withDomainFocus_includesExtendedTables() {
        TableSchema core = new TableSchema();
        core.setName("items");
        core.setDomain("catalog");
        core.setCategory("core");
        core.setColumns(List.of());

        TableSchema extended = new TableSchema();
        extended.setName("item_variants");
        extended.setDomain("catalog");
        extended.setCategory("extended");
        extended.setColumns(List.of());

        AiSchemaContext ctx = new AiSchemaContext(List.of(core, extended), new ObjectMapper().createObjectNode());
        String prompt = ctx.buildLlmContext(Set.of("catalog"), 15);

        assertTrue(prompt.contains("item_variants"));
    }
}
