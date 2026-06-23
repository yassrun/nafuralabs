package ma.nafura.platform.ai.conversation.context;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.*;
import java.util.stream.Collectors;

public class AiSchemaContext {

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

    public String buildLlmContext(Set<String> userDomains) {
        Set<String> allowed = getAllowedTables(userDomains);
        if (allowed.isEmpty()) return "(No tables available for your permissions.)";
        StringBuilder sb = new StringBuilder();
        for (TableSchema t : tables) {
            if (!allowed.contains(t.getName())) continue;
            sb.append("\nTable: ").append(t.getName());
            if (t.getDescription() != null && !t.getDescription().isEmpty()) {
                sb.append(" — ").append(t.getDescription());
            }
            sb.append("\n  Columns: ");
            if (t.getColumns() != null) {
                sb.append(t.getColumns().stream()
                    .filter(c -> !"tenant_id".equalsIgnoreCase(c.getName()))
                    .map(c -> c.getName() + " (" + c.getType() + ")" + (c.getFk() != null ? " -> " + c.getFk().get("table") : ""))
                    .collect(Collectors.joining(", ")));
            }
            sb.append("\n");
        }
        return sb.toString();
    }
}
