package ma.nafura.platform.ai.conversation.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import ma.nafura.platform.ai.agent.service.tool.AgentTool;
import ma.nafura.platform.ai.agent.service.tool.AgentToolRequest;
import ma.nafura.platform.ai.agent.service.tool.AgentToolResult;
import ma.nafura.platform.ai.conversation.config.SqlQueryConfig;
import ma.nafura.platform.ai.conversation.context.AiSchemaContext;
import ma.nafura.platform.ai.conversation.context.AiSchemaContextLoader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
@ConditionalOnProperty(prefix = "nafura.ai.sql", name = "enabled", havingValue = "true")
public class SqlQueryTool implements AgentTool {

    private final JdbcTemplate aiReadOnlyJdbcTemplate;
    private final SqlQueryConfig config;
    private final ObjectMapper objectMapper;
    private final AiSchemaContextLoader schemaLoader;

    public SqlQueryTool(
        @Qualifier("aiReadOnlyJdbcTemplate") JdbcTemplate aiReadOnlyJdbcTemplate,
        SqlQueryConfig config,
        ObjectMapper objectMapper,
        @Autowired(required = false) AiSchemaContextLoader schemaLoader
    ) {
        this.aiReadOnlyJdbcTemplate = aiReadOnlyJdbcTemplate;
        this.config = config;
        this.objectMapper = objectMapper;
        this.schemaLoader = schemaLoader;
    }

    @Override
    public String key() {
        return "execute_sql";
    }

    @Override
    public AgentToolResult execute(AgentToolRequest request, AgentExecutionContext context) {
        Map<String, Object> args = request.getArguments();
        if (args == null) args = Map.of();
        String sql = (String) args.get("sql");
        String explanation = (String) args.get("explanation");
        if (sql == null || sql.isBlank()) {
            return AgentToolResult.builder()
                .success(false)
                .message("Missing required parameter: sql")
                .payload(Map.of())
                .build();
        }

        AiSchemaContext schemaContext = schemaLoader != null ? schemaLoader.getSchemaContext() : null;
        Set<String> allowedDomains = getAllowedDomains(context);
        if (schemaContext != null && !allowedDomains.isEmpty()) {
            SqlQueryValidator.checkTablePermissions(
                sql,
                allowedDomains,
                tableName -> schemaContext.getDomainForTable(tableName).orElse(null)
            );
        }

        SqlQueryValidator.validate(sql, config.getMaxSqlLength());

        UUID tenantUuid = null;
        if (context.getTenantId() != null && !context.getTenantId().isBlank()) {
            try {
                tenantUuid = UUID.fromString(context.getTenantId());
            } catch (IllegalArgumentException ignored) {}
        }
        Set<String> tablesWithTenant = schemaContext != null ? schemaContext.getTablesWithTenantId() : Set.of();
        String finalSql = SqlTenantInjector.injectTenantFilter(sql, tenantUuid, tablesWithTenant);

        String limitSql = finalSql.trim().toUpperCase().contains("LIMIT")
            ? finalSql
            : finalSql + (finalSql.trim().endsWith(";") ? "" : " ") + " LIMIT " + (config.getMaxRows() + 1);

        long start = System.currentTimeMillis();
        try {
            List<Map<String, Object>> rows = aiReadOnlyJdbcTemplate.query(limitSql, (rs, rowNum) -> {
                Map<String, Object> row = new LinkedHashMap<>();
                int colCount = rs.getMetaData().getColumnCount();
                for (int i = 1; i <= colCount; i++) {
                    String label = rs.getMetaData().getColumnLabel(i);
                    Object val = rs.getObject(i);
                    row.put(label, val);
                }
                return row;
            });

            boolean truncated = rows.size() > config.getMaxRows();
            if (truncated) {
                rows = rows.subList(0, config.getMaxRows());
            }
            List<String> columns = rows.isEmpty() ? List.of() : new ArrayList<>(rows.get(0).keySet());
            SqlQueryResult result = SqlQueryResult.builder()
                .columns(columns)
                .rows(rows)
                .rowCount(rows.size())
                .truncated(truncated)
                .executionTimeMs(System.currentTimeMillis() - start)
                .explanation(explanation != null ? explanation : "")
                .build();

            return AgentToolResult.builder()
                .success(true)
                .message("OK")
                .payload(objectMapper.convertValue(result, Map.class))
                .build();
        } catch (SqlValidationException e) {
            return AgentToolResult.builder()
                .success(false)
                .message(e.getMessage())
                .payload(Map.of())
                .build();
        } catch (Exception e) {
            return AgentToolResult.builder()
                .success(false)
                .message(e.getMessage() != null ? e.getMessage() : "Query execution failed")
                .payload(Map.of())
                .build();
        }
    }

    private Set<String> getAllowedDomains(AgentExecutionContext context) {
        return Set.of();
    }
}

