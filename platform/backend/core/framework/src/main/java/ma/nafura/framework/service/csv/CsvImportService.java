package ma.nafura.platform.framework.service.csv;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for parsing CSV and mapping rows to entity instances.
 * Used by the generic CRUD import endpoint.
 */
@Service
public class CsvImportService {

    private static final CSVFormat CSV_FORMAT = CSVFormat.DEFAULT
            .builder()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setIgnoreHeaderCase(true)
            .setTrim(true)
            .build();

    /**
     * Parse CSV stream to list of maps (header name -> value per row).
     *
     * @param csvStream UTF-8 CSV input
     * @return list of row maps; empty if no data rows
     */
    public List<Map<String, String>> parse(InputStream csvStream) throws IOException {
        List<Map<String, String>> rows = new ArrayList<>();
        try (InputStreamReader reader = new InputStreamReader(csvStream, StandardCharsets.UTF_8);
             CSVParser parser = new CSVParser(reader, CSV_FORMAT)) {
            List<String> headerNames = parser.getHeaderNames();
            if (headerNames == null || headerNames.isEmpty()) {
                return rows;
            }
            for (CSVRecord record : parser) {
                Map<String, String> row = new LinkedHashMap<>();
                for (String header : headerNames) {
                    String value = record.get(header);
                    row.put(header, value != null ? value.trim() : null);
                }
                rows.add(row);
            }
        }
        return rows;
    }

    /**
     * Map a row to an entity instance using field mapping.
     * CSV column names are mapped to entity field names via fieldMapping; if null, row keys are used as field names.
     * Performs type conversion (string -> number, date, enum, UUID, boolean).
     *
     * @param row          single CSV row (column name -> value)
     * @param entityClass  entity type to instantiate
     * @param fieldMapping CSV column name -> entity field name; if null, row keys used as field names
     * @return new entity instance with fields set
     */
    public <T> T mapToEntity(Map<String, String> row, Class<T> entityClass, Map<String, String> fieldMapping) {
        try {
            T entity = entityClass.getDeclaredConstructor().newInstance();
            Map<String, String> effectiveMapping = fieldMapping != null ? fieldMapping : identityMapping(row);
            for (Map.Entry<String, String> e : effectiveMapping.entrySet()) {
                String csvKey = e.getKey();
                String fieldName = e.getValue();
                String value = row.get(csvKey);
                if (value == null || value.isBlank()) {
                    continue;
                }
                setEntityField(entity, fieldName, value);
            }
            return entity;
        } catch (Exception ex) {
            throw new CsvImportException("Failed to map row to entity: " + ex.getMessage(), ex);
        }
    }

    /**
     * Apply row values to an existing entity (for update). Same as mapToEntity but mutates the given entity.
     * Skips id, tenantId, createdAt, updatedAt by default.
     */
    public <T> void applyToEntity(Map<String, String> row, T entity, Map<String, String> fieldMapping, List<String> fieldsToSkip) {
        Map<String, String> effectiveMapping = fieldMapping != null ? fieldMapping : identityMapping(row);
        List<String> skip = fieldsToSkip != null ? fieldsToSkip : List.of("id", "tenantId", "createdAt", "updatedAt");
        for (Map.Entry<String, String> e : effectiveMapping.entrySet()) {
            String csvKey = e.getKey();
            String fieldName = e.getValue();
            if (skip.contains(fieldName)) {
                continue;
            }
            String value = row.get(csvKey);
            if (value == null || value.isBlank()) {
                continue;
            }
            try {
                setEntityField(entity, fieldName, value);
            } catch (Exception ignored) {
                // skip fields that cannot be set (e.g. read-only)
            }
        }
    }

    /**
     * Validate a row against simple constraints (required, non-empty).
     *
     * @param row         CSV row
     * @param requiredKeys field names (CSV column or entity field) that must be non-blank
     * @return list of error messages; empty if valid
     */
    public List<String> validate(Map<String, String> row, List<String> requiredKeys) {
        List<String> errors = new ArrayList<>();
        if (requiredKeys == null) {
            return errors;
        }
        for (String key : requiredKeys) {
            String value = row.get(key);
            if (value == null || value.isBlank()) {
                errors.add("Missing required field: " + key);
            }
        }
        return errors;
    }

    @SuppressWarnings("unchecked")
    private void setEntityField(Object entity, String fieldName, String value) throws Exception {
        Class<?> clazz = entity.getClass();
        Field field = findField(clazz, fieldName);
        if (field == null) {
            return;
        }
        field.setAccessible(true);
        Class<?> type = field.getType();
        Object converted = convert(value, type, field);
        field.set(entity, converted);
    }

    private Field findField(Class<?> clazz, String fieldName) {
        Class<?> c = clazz;
        while (c != null) {
            try {
                return c.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                c = c.getSuperclass();
            }
        }
        return null;
    }

    private Object convert(String value, Class<?> type, Field field) {
        if (value == null || value.isBlank()) {
            return null;
        }
        if (type == String.class) {
            return value;
        }
        if (type == int.class || type == Integer.class) {
            return Integer.parseInt(value.trim());
        }
        if (type == long.class || type == Long.class) {
            return Long.parseLong(value.trim());
        }
        if (type == double.class || type == Double.class) {
            return Double.parseDouble(value.trim());
        }
        if (type == boolean.class || type == Boolean.class) {
            return parseBoolean(value);
        }
        if (type == UUID.class) {
            return UUID.fromString(value.trim());
        }
        if (type == java.time.LocalDate.class) {
            return LocalDate.parse(value.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
        }
        if (type == java.time.OffsetDateTime.class) {
            return OffsetDateTime.parse(value.trim(), DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        }
        if (type == java.time.LocalDateTime.class) {
            return java.time.LocalDateTime.parse(value.trim(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }
        if (type.isEnum()) {
            @SuppressWarnings("rawtypes")
            Class<? extends Enum> enumClass = (Class<? extends Enum>) type;
            return Enum.valueOf(enumClass, value.trim());
        }
        throw new CsvImportException("Unsupported field type for CSV import: " + type.getSimpleName());
    }

    private static boolean parseBoolean(String value) {
        String v = value.trim().toLowerCase();
        return "true".equals(v) || "1".equals(v) || "yes".equals(v);
    }

    private static Map<String, String> identityMapping(Map<String, String> row) {
        Map<String, String> mapping = new LinkedHashMap<>();
        for (String key : row.keySet()) {
            mapping.put(key, key);
        }
        return mapping;
    }

    public static class CsvImportException extends RuntimeException {
        public CsvImportException(String message) {
            super(message);
        }
        public CsvImportException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
