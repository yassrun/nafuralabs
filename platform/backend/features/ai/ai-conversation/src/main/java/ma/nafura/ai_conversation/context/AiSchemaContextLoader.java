package ma.nafura.platform.ai.conversation.context;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@ConditionalOnProperty(prefix = "nafura.ai.sql", name = "enabled", havingValue = "true")
public class AiSchemaContextLoader {

    private final ObjectMapper objectMapper;
    private final String schemaPath;
    private AiSchemaContext schemaContext;

    public AiSchemaContextLoader(
        ObjectMapper objectMapper,
        ma.nafura.platform.ai.conversation.config.SqlQueryConfig config
    ) {
        this.objectMapper = objectMapper;
        this.schemaPath = config != null ? config.getSchemaPath() : null;
    }

    @PostConstruct
    public void load() {
        try {
            InputStream in = null;
            if (schemaPath != null && !schemaPath.isBlank()) {
                Resource r = new PathMatchingResourcePatternResolver().getResource(schemaPath);
                if (r.exists()) in = r.getInputStream();
            }
            if (in == null) {
                Resource r = new PathMatchingResourcePatternResolver()
                    .getResource("classpath:ai-schema.generated.json");
                if (r.exists()) in = r.getInputStream();
            }
            if (in == null) {
                schemaContext = new AiSchemaContext(List.of(), objectMapper.createObjectNode());
                return;
            }
            JsonNode root = objectMapper.readTree(in);
            JsonNode tablesNode = root.path("tables");
            List<TableSchema> tables = new ArrayList<>();
            if (tablesNode.isArray()) {
                for (JsonNode n : tablesNode) {
                    tables.add(objectMapper.treeToValue(n, TableSchema.class));
                }
            }
            JsonNode domainIndex = root.path("domainIndex");
            schemaContext = new AiSchemaContext(tables, domainIndex.isMissingNode() ? objectMapper.createObjectNode() : domainIndex);
        } catch (Exception e) {
            schemaContext = new AiSchemaContext(List.of(), objectMapper.createObjectNode());
        }
    }

    public AiSchemaContext getSchemaContext() {
        return schemaContext != null ? schemaContext : new AiSchemaContext(List.of(), objectMapper.createObjectNode());
    }

    public Optional<AiSchemaContext> getSchemaContextOptional() {
        return Optional.ofNullable(schemaContext);
    }
}
