package ma.nafura.platform.ai.conversation.tool;

import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SqlQueryValidator {

    private static final Pattern TABLE_PATTERN = Pattern.compile(
        "(?i)(?:FROM|JOIN)\\s+([a-z_][a-z0-9_]*)",
        Pattern.CASE_INSENSITIVE
    );

    private static final String[] FORBIDDEN = {
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE",
        "GRANT", "REVOKE", "EXECUTE", "CALL", "COPY", "SET", "LOCK", "COMMENT"
    };

    public static void validate(String sql, int maxSqlLength) {
        if (sql == null || sql.isBlank()) {
            throw new SqlValidationException("SQL must not be empty");
        }
        String trimmed = sql.trim();
        if (trimmed.length() > maxSqlLength) {
            throw new SqlValidationException("SQL exceeds maximum length of " + maxSqlLength);
        }
        String upper = trimmed.toUpperCase();
        if (!upper.startsWith("SELECT")) {
            throw new SqlValidationException("Only SELECT queries are allowed");
        }
        for (String keyword : FORBIDDEN) {
            if (upper.contains(keyword)) {
                throw new SqlValidationException("Forbidden keyword: " + keyword);
            }
        }
        if (trimmed.contains(";")) {
            throw new SqlValidationException("Semicolons are not allowed (single statement only)");
        }
        if (trimmed.contains("--") || trimmed.contains("/*")) {
            throw new SqlValidationException("SQL comments are not allowed");
        }
        if (!upper.contains("FROM")) {
            throw new SqlValidationException("Query must contain a FROM clause");
        }
        if (upper.contains("PG_CATALOG") || upper.contains("INFORMATION_SCHEMA")
            || upper.contains("PG_")) {
            throw new SqlValidationException("System catalogs are not allowed");
        }
    }

    public static void checkTablePermissions(
        String sql,
        Set<String> allowedDomains,
        java.util.function.Function<String, String> tableToDomain
    ) {
        Set<String> tables = extractTableNames(sql);
        for (String table : tables) {
            String domain = tableToDomain.apply(table);
            if (domain != null && !allowedDomains.contains(domain)) {
                throw new SqlValidationException("Access denied to table: " + table + " (domain: " + domain + ")");
            }
        }
    }

    public static Set<String> extractTableNames(String sql) {
        Set<String> names = new java.util.HashSet<>();
        Matcher m = TABLE_PATTERN.matcher(sql);
        while (m.find()) {
            names.add(m.group(1).toLowerCase());
        }
        return names;
    }
}
