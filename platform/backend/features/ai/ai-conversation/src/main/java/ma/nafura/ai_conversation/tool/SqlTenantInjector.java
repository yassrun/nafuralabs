package ma.nafura.platform.ai.conversation.tool;

import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Injects tenant_id filter into SQL (MVP approach).
 * For production, use RLS with SET LOCAL app.current_tenant_id instead.
 */
public final class SqlTenantInjector {

    private static final Pattern TABLE_OR_ALIAS = Pattern.compile(
        "(?i)(?:FROM|JOIN)\\s+([a-z_][a-z0-9_]*)(?:\\s+([a-z_][a-z0-9_]*))?",
        Pattern.CASE_INSENSITIVE
    );

    public static String injectTenantFilter(String sql, UUID tenantId, Set<String> tablesWithTenantId) {
        if (tenantId == null || tablesWithTenantId == null || tablesWithTenantId.isEmpty()) {
            return sql;
        }
        String tid = "'" + tenantId + "'";
        Matcher m = TABLE_OR_ALIAS.matcher(sql);
        StringBuilder sb = new StringBuilder();
        int last = 0;
        java.util.List<String> conditions = new java.util.ArrayList<>();
        while (m.find()) {
            String tableOrAlias = m.group(2) != null && !m.group(2).isEmpty() ? m.group(2) : m.group(1);
            String tableName = m.group(1).toLowerCase();
            if (tablesWithTenantId.contains(tableName)) {
                conditions.add(tableOrAlias + ".tenant_id = " + tid);
            }
            last = m.end();
        }
        if (conditions.isEmpty()) {
            return sql;
        }
        String whereClause = " WHERE " + String.join(" AND ", conditions);
        String upper = sql.toUpperCase();
        int whereIdx = upper.indexOf(" WHERE ");
        if (whereIdx >= 0) {
            return sql.substring(0, whereIdx + 7) + String.join(" AND ", conditions) + " AND " + sql.substring(whereIdx + 7);
        }
        int groupIdx = upper.indexOf(" GROUP ");
        int orderIdx = upper.indexOf(" ORDER ");
        int limitIdx = upper.indexOf(" LIMIT ");
        int insertAt = sql.length();
        if (limitIdx >= 0) insertAt = Math.min(insertAt, limitIdx);
        if (orderIdx >= 0) insertAt = Math.min(insertAt, orderIdx);
        if (groupIdx >= 0) insertAt = Math.min(insertAt, groupIdx);
        return sql.substring(0, insertAt).trim() + whereClause + " " + sql.substring(insertAt).trim();
    }
}
