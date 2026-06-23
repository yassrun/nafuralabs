package ma.nafura.platform.documents.docextractor.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.documents.docextractor.api.response.ExtractedRecordDto;
import ma.nafura.platform.documents.docextractor.service.DocTypeDefinitionService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;

/**
 * Service for exporting extracted records to Excel format.
 * Dynamically creates columns based on JSON schema and flattens array data.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExtractionExportService {
    
    private final ObjectMapper objectMapper;
    private final DocTypeDefinitionService docTypeDefinitionService;
    
    /**
     * Export records to Excel format.
     * Dynamically creates columns based on JSON schema and flattens array data.
     * 
     * @param records The records to export
     * @param domainKey Domain key for filename and schema lookup
     * @param docTypeKey Document type key for filename and schema lookup
     * @param docTypeVersion Document type version for filename
     * @return ExcelExportResult containing the Excel bytes and filename
     * @throws IOException if there's an error writing the Excel file
     */
    public ExcelExportResult exportToExcel(
            List<ExtractedRecordDto> records,
            String domainKey,
            String docTypeKey,
            Integer docTypeVersion) throws IOException {
        
        // Get DocTypeDefinition to access JSON schema
        var docTypeDefinition = docTypeDefinitionService.getActive(domainKey, docTypeKey);
        JsonNode schema = docTypeDefinition.jsonSchema();
        
        // Extract column definitions from schema
        List<ColumnDefinition> columns = extractColumnsFromSchema(schema);
        
        // Flatten records (expand arrays into separate rows)
        List<Map<String, Object>> flattenedRows = flattenRecords(records, schema);
        
        // Create Excel workbook
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Records");
        
        // Create header row
        Row headerRow = sheet.createRow(0);
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        // Add headers
        for (int i = 0; i < columns.size(); i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns.get(i).getLabel());
            cell.setCellStyle(headerStyle);
        }
        
        // Add data rows
        int rowNum = 1;
        for (Map<String, Object> rowData : flattenedRows) {
            Row row = sheet.createRow(rowNum++);
            for (int i = 0; i < columns.size(); i++) {
                ColumnDefinition colDef = columns.get(i);
                Object value = rowData.get(colDef.getPath());
                Cell cell = row.createCell(i);
                setCellValue(cell, value, colDef.getType());
            }
        }
        
        // Auto-size columns
        for (int i = 0; i < columns.size(); i++) {
            sheet.autoSizeColumn(i);
        }
        
        // Write workbook to byte array
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();
        
        byte[] excelBytes = outputStream.toByteArray();
        String filename = String.format("%s_%s_v%d.xlsx", domainKey, docTypeKey, docTypeVersion);
        
        return new ExcelExportResult(excelBytes, filename);
    }
    
    /**
     * Extract column definitions from JSON schema.
     */
    private List<ColumnDefinition> extractColumnsFromSchema(JsonNode schema) {
        List<ColumnDefinition> columns = new ArrayList<>();
        JsonNode properties = schema.path("properties");
        
        if (properties.isObject()) {
            extractColumnsRecursive(properties, "", columns);
        }
        
        return columns;
    }
    
    /**
     * Recursively extract columns from schema properties, flattening nested objects.
     */
    private void extractColumnsRecursive(JsonNode properties, String prefix, List<ColumnDefinition> columns) {
        properties.fields().forEachRemaining(entry -> {
            String key = entry.getKey();
            JsonNode prop = entry.getValue();
            String path = prefix.isEmpty() ? key : prefix + "_" + key;
            String label = prefix.isEmpty() ? key : prefix + " " + key;
            
            String type = prop.path("type").asText("string");
            
            if ("array".equals(type)) {
                // For arrays, extract columns from items schema
                JsonNode items = prop.path("items");
                if (items.isObject() && items.path("type").asText().equals("object")) {
                    JsonNode itemProperties = items.path("properties");
                    extractColumnsRecursive(itemProperties, key, columns);
                }
            } else if ("object".equals(type)) {
                // For nested objects, recursively extract properties
                JsonNode nestedProperties = prop.path("properties");
                extractColumnsRecursive(nestedProperties, key, columns);
            } else {
                // Primitive type - add as column
                String title = prop.path("title").asText(key);
                columns.add(new ColumnDefinition(path, title, type));
            }
        });
    }
    
    /**
     * Flatten records by expanding arrays into separate rows.
     */
    private List<Map<String, Object>> flattenRecords(List<ExtractedRecordDto> records, JsonNode schema) {
        List<Map<String, Object>> flattened = new ArrayList<>();
        String arrayField = findFirstArrayField(schema);
        
        for (ExtractedRecordDto record : records) {
            JsonNode dataJson = objectMapper.valueToTree(record.getDataJson());
            
            if (arrayField != null && dataJson.has(arrayField) && dataJson.get(arrayField).isArray()) {
                // Expand array into multiple rows
                JsonNode array = dataJson.get(arrayField);
                Map<String, Object> parentData = extractParentData(dataJson, arrayField);
                
                for (JsonNode item : array) {
                    Map<String, Object> row = new LinkedHashMap<>(parentData);
                    flattenJsonNode(item, arrayField, row);
                    flattened.add(row);
                }
            } else {
                // No array or array is empty - single row
                Map<String, Object> row = new LinkedHashMap<>();
                flattenJsonNode(dataJson, "", row);
                flattened.add(row);
            }
        }
        
        return flattened;
    }
    
    /**
     * Find the first array field in the schema.
     */
    private String findFirstArrayField(JsonNode schema) {
        JsonNode properties = schema.path("properties");
        if (properties.isObject()) {
            for (Iterator<Map.Entry<String, JsonNode>> it = properties.fields(); it.hasNext(); ) {
                Map.Entry<String, JsonNode> entry = it.next();
                if ("array".equals(entry.getValue().path("type").asText())) {
                    return entry.getKey();
                }
            }
        }
        return null;
    }
    
    /**
     * Extract parent data (non-array fields) from JSON.
     */
    private Map<String, Object> extractParentData(JsonNode dataJson, String excludeField) {
        Map<String, Object> parentData = new LinkedHashMap<>();
        dataJson.fields().forEachRemaining(entry -> {
            if (!entry.getKey().equals(excludeField)) {
                String key = entry.getKey();
                JsonNode value = entry.getValue();
                if (value.isValueNode()) {
                    parentData.put(key, getValue(value));
                } else if (value.isObject()) {
                    flattenJsonNode(value, key, parentData);
                }
            }
        });
        return parentData;
    }
    
    /**
     * Flatten a JSON node into a map with dot-notation keys.
     */
    private void flattenJsonNode(JsonNode node, String prefix, Map<String, Object> result) {
        if (node.isValueNode()) {
            result.put(prefix, getValue(node));
        } else if (node.isObject()) {
            node.fields().forEachRemaining(entry -> {
                String key = entry.getKey();
                JsonNode value = entry.getValue();
                String path = prefix.isEmpty() ? key : prefix + "_" + key;
                if (value.isValueNode()) {
                    result.put(path, getValue(value));
                } else if (value.isObject()) {
                    flattenJsonNode(value, path, result);
                }
            });
        }
    }
    
    /**
     * Get Java value from JsonNode.
     */
    private Object getValue(JsonNode node) {
        if (node.isNull()) return null;
        if (node.isBoolean()) return node.asBoolean();
        if (node.isInt()) return node.asInt();
        if (node.isLong()) return node.asLong();
        if (node.isDouble()) return node.asDouble();
        if (node.isTextual()) return node.asText();
        return node.toString();
    }
    
    /**
     * Set cell value based on type.
     */
    private void setCellValue(Cell cell, Object value, String type) {
        if (value == null) {
            cell.setBlank();
            return;
        }
        
        if (value instanceof Number) {
            cell.setCellValue(((Number) value).doubleValue());
        } else if (value instanceof Boolean) {
            cell.setCellValue((Boolean) value);
        } else {
            cell.setCellValue(value.toString());
        }
    }
    
    /**
     * Column definition.
     */
    private static class ColumnDefinition {
        private final String path;
        private final String label;
        private final String type;
        
        public ColumnDefinition(String path, String label, String type) {
            this.path = path;
            this.label = label;
            this.type = type;
        }
        
        public String getPath() {
            return path;
        }
        
        public String getLabel() {
            return label;
        }
        
        public String getType() {
            return type;
        }
    }
    
    /**
     * Result class containing Excel export data.
     */
    public static class ExcelExportResult {
        private final byte[] excelBytes;
        private final String filename;
        
        public ExcelExportResult(byte[] excelBytes, String filename) {
            this.excelBytes = excelBytes;
            this.filename = filename;
        }
        
        public byte[] getExcelBytes() {
            return excelBytes;
        }
        
        public String getFilename() {
            return filename;
        }
    }
}

