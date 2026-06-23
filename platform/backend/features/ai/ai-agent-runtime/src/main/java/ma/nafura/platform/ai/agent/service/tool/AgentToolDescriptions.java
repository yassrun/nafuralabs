package ma.nafura.platform.ai.agent.service.tool;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import ma.nafura.platform.ai.llm.model.ToolDefinition;
import org.springframework.stereotype.Component;

@Component
public class AgentToolDescriptions {

    private final ObjectMapper objectMapper;

    public AgentToolDescriptions(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<ToolDefinition> all() {
        return List.of(
                tool("search", "Search for entities across domains",
                        schema(
                                List.of(
                                        property("query", "string", "Search query"),
                                        property("entityTypes", "array", "Optional entity types"),
                                        property("limit", "integer", "Maximum result count")
                                ),
                                List.of("query")
                        )),
                tool("navigate", "Resolve a route for pages and records",
                        schema(
                                List.of(
                                        property("target", "string", "Human target label"),
                                        property("entityType", "string", "Entity type"),
                                        property("entityId", "string", "Entity identifier")
                                ),
                                List.of()
                        )),
                tool("list", "List records by entity type with optional filters",
                        schema(
                                List.of(
                                        property("entityType", "string", "Target entity type"),
                                        property("filters", "object", "Filter object"),
                                        property("sort", "string", "Sort field"),
                                        property("direction", "string", "asc or desc"),
                                        property("limit", "integer", "Maximum records")
                                ),
                                List.of("entityType")
                        )),
                tool("summarize", "Summarize a record or an aggregate",
                        schema(
                                List.of(
                                        property("entityType", "string", "Target entity type"),
                                        property("entityId", "string", "Optional entity id"),
                                        property("filters", "object", "Optional filter object")
                                ),
                                List.of("entityType")
                        )),
                tool("dashboard", "Query dashboard KPIs and metrics",
                        schema(
                                List.of(
                                        property("metric", "string", "revenue|invoiceCount|overdueCount|expenses|members|approvals|pendingApprovals"),
                                        property("period", "string", "this-month|last-month|this-year (optional)")
                                ),
                                List.of()
                        )),
                tool("help", "Answer platform usage questions with links",
                        schema(
                                List.of(
                                        property("question", "string", "User question")
                                ),
                                List.of()
                        )),
                tool("action", "Execute action proposals after approval",
                        schema(
                                List.of(
                                        property("operation", "string", "Operation to execute"),
                                        property("entityType", "string", "Entity type"),
                                        property("entityId", "string", "Optional entity id"),
                                        property("data", "object", "Payload for operation")
                                ),
                                List.of("operation", "entityType")
                        ))
        );
    }

    private ToolDefinition tool(String name, String description, JsonNode parameters) {
        return new ToolDefinition(name, description, parameters);
    }

    private JsonNode schema(List<ObjectNode> properties, List<String> required) {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");

        ObjectNode propsNode = objectMapper.createObjectNode();
        for (ObjectNode property : properties) {
            String key = property.path("_key").asText();
            property.remove("_key");
            propsNode.set(key, property);
        }
        schema.set("properties", propsNode);

        ArrayNode requiredNode = objectMapper.createArrayNode();
        for (String field : required) {
            requiredNode.add(field);
        }
        schema.set("required", requiredNode);
        return schema;
    }

    private ObjectNode property(String key, String type, String description) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("_key", key);
        node.put("type", type);
        node.put("description", description);
        return node;
    }
}
