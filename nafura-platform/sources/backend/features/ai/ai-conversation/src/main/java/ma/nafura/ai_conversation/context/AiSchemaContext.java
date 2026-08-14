package ma.nafura.platform.ai.conversation.context;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.*;
import java.util.stream.Collectors;

public class AiSchemaContext {

    private static final String CATEGORY_CORE = "core";

    private final List<TableSchema> tables;
    private final Map<String, String> tableToDomain;
    private final Map<String, Set<String>> domainToTables;
    private final Set<String> tablesWithTenantId;

    public AiSchemaContext(List<TableSchema> tables, JsonNode domainIndex) {
        this.tables = tables != null ? List.copyOf(tables) : List.of();
        this.tableToDomain = new HashMap<>();
        this.domainToTables = new HashMap<>();
        Set<String> withTenant = new HashSet<>();
        for (TableSchema t : this.tables) {
            tableToDomain.put(t.getName().toLowerCase(), t.getDomain());
            domainToTables.computeIfAbsent(t.getDomain(), k -> new HashSet<>()).add(t.getName());
            boolean hasTenant = t.getColumns() != null && t.getColumns().stream()
                .anyMatch(c -> "tenant_id".equalsIgnoreCase(c.getName()));
            if (hasTenant) {
                withTenant.add(t.getName().toLowerCase());
            }
        }
        this.tablesWithTenantId = Set.copyOf(withTenant);
    }

    public List<TableSchema> getTables() {
        return tables;
    }

    public List<TableSchema> getTablesByDomain(String domain) {
        return tables.stream()
            .filter(t -> domain.equals(t.getDomain()))
            .toList();
    }

    public Optional<TableSchema> getTableByName(String tableName) {
        if (tableName == null) return Optional.empty();
        return tables.stream()
            .filter(t -> tableName.equalsIgnoreCase(t.getName()))
            .findFirst();
    }

    public Optional<String> getDomainForTable(String tableName) {
        return Optional.ofNullable(tableToDomain.get(tableName != null ? tableName.toLowerCase() : null));
    }

    public Set<String> getAllowedTables(Set<String> userDomains) {
        if (userDomains == null || userDomains.isEmpty()) return Set.of();
        return userDomains.stream()
            .flatMap(d -> domainToTables.getOrDefault(d, Set.of()).stream())
            .collect(Collectors.toSet());
    }

    public boolean tableHasTenantId(String tableName) {
        return tableName != null && tablesWithTenantId.contains(tableName.toLowerCase());
    }

    public Set<String> getTablesWithTenantId() {
        return new HashSet<>(tablesWithTenantId);
    }

    public String buildLlmContext(Set<String> focusDomains) {
        return buildLlmContext(focusDomains, 15);
    }

    /**
     * Compact schema for LLM prompts — optimized for token cost.
     * When focusDomains is empty: core tables only.
     * When focusDomains is set: core + matching domain tables (capped).
     */
    public String buildLlmContext(Set<String> focusDomains, int maxTables) {
        List<TableSchema> selected = selectTablesForPrompt(focusDomains, maxTables);
        if (selected.isEmpty()) {
            return "(No tables available — ai-schema.generated.json may be missing or empty.)";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Term → table:\n");
        for (TableSchema t : selected) {
            if (t.getAliases() != null && !t.getAliases().isEmpty()) {
                sb.append("  ").append(String.join(", ", t.getAliases()))
                    .append(" → ").append(t.getName()).append('\n');
            }
        }

        sb.append("\nTables (PostgreSQL, tenant_id auto-filtered — do not add tenant_id yourself):\n");
        for (TableSchema t : selected) {
            sb.append("• ").append(t.getName());
            if (t.getDescription() != null && !t.getDescription().isBlank()) {
                sb.append(" — ").append(t.getDescription().trim());
            }
            sb.append('\n');
            sb.append("  cols: ");
            if (t.getColumns() != null) {
                sb.append(t.getColumns().stream()
                    .filter(c -> !"tenant_id".equalsIgnoreCase(c.getName()))
                    .map(this::formatColumnForPrompt)
                    .collect(Collectors.joining(", ")));
            }
            sb.append('\n');
            if (t.getHints() != null) {
                for (String hint : t.getHints()) {
                    if (hint != null && !hint.isBlank()) {
                        sb.append("  ").append(hint.trim()).append('\n');
                    }
                }
            }
        }
        return sb.toString();
    }

    List<TableSchema> selectTablesForPrompt(Set<String> focusDomains, int maxTables) {
        int cap = maxTables > 0 ? maxTables : 15;
        LinkedHashSet<TableSchema> selected = new LinkedHashSet<>();

        for (TableSchema t : tables) {
            if (CATEGORY_CORE.equalsIgnoreCase(nullToEmpty(t.getCategory()))) {
                selected.add(t);
            }
        }

        if (focusDomains != null && !focusDomains.isEmpty()) {
            for (TableSchema t : tables) {
                if (focusDomains.contains(t.getDomain())) {
                    selected.add(t);
                }
            }
        }

        if (selected.isEmpty()) {
            // Fallback when no category marked: first N tables (legacy schemas)
            return tables.stream().limit(cap).toList();
        }

        return selected.stream().limit(cap).toList();
    }

    private String formatColumnForPrompt(TableSchema.ColumnSchema column) {
        StringBuilder col = new StringBuilder(column.getName());
        if (column.getType() != null && !column.getType().isBlank()) {
            col.append('(').append(column.getType()).append(')');
        }
        if (column.getDescription() != null && !column.getDescription().isBlank()) {
            col.append('=').append(column.getDescription().trim());
        } else if (column.getFk() != null && column.getFk().get("table") != null) {
            col.append("→").append(column.getFk().get("table"));
        }
        return col.toString();
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
