package ma.nafura.platform.framework.service.csv;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Service for exporting entities to CSV.
 * Uses UTF-8 with BOM for Excel compatibility.
 */
@Service
public class CsvExportService {

    private static final byte[] UTF8_BOM = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};

    /**
     * Generate CSV from entities with given column (field) names.
     * First row is header; then one row per entity. Values are stringified.
     *
     * @param entities list of entities to export
     * @param columns  field names to export (order defines column order)
     * @return CSV bytes with UTF-8 BOM
     */
    public byte[] export(List<?> entities, List<String> columns) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(UTF8_BOM);
        try (OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
             CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(columns.toArray(new String[0])).build())) {
            for (Object entity : entities) {
                Object[] values = new Object[columns.size()];
                for (int i = 0; i < columns.size(); i++) {
                    values[i] = readProperty(entity, columns.get(i));
                }
                printer.printRecord((Object[]) toStringArray(values));
            }
        }
        return out.toByteArray();
    }

    /**
     * Stream CSV to the given output stream (UTF-8 with BOM).
     */
    public void exportToStream(List<?> entities, List<String> columns, java.io.OutputStream out) throws IOException {
        out.write(UTF8_BOM);
        try (OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
             CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(columns.toArray(new String[0])).build())) {
            for (Object entity : entities) {
                Object[] values = new Object[columns.size()];
                for (int i = 0; i < columns.size(); i++) {
                    values[i] = readProperty(entity, columns.get(i));
                }
                printer.printRecord((Object[]) toStringArray(values));
            }
        }
    }

    private static String[] toStringArray(Object[] values) {
        String[] arr = new String[values.length];
        for (int i = 0; i < values.length; i++) {
            arr[i] = values[i] == null ? "" : values[i].toString();
        }
        return arr;
    }

    private static Object readProperty(Object entity, String property) {
        if (entity == null || property == null || property.isBlank()) {
            return null;
        }
        String suffix = property.substring(0, 1).toUpperCase() + property.substring(1);
        List<String> methodCandidates = List.of("get" + suffix, "is" + suffix);
        for (String methodName : methodCandidates) {
            try {
                Method method = entity.getClass().getMethod(methodName);
                if (method.getParameterCount() == 0) {
                    return method.invoke(entity);
                }
            } catch (Exception ignored) {
                // try next
            }
        }
        Class<?> type = entity.getClass();
        while (type != null) {
            try {
                Field field = type.getDeclaredField(property);
                field.setAccessible(true);
                return field.get(entity);
            } catch (Exception ignored) {
                type = type.getSuperclass();
            }
        }
        return null;
    }
}
