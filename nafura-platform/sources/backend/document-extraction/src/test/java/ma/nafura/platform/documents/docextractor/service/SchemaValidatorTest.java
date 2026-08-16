package ma.nafura.platform.documents.docextractor.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.platform.documents.docextractor.api.response.DoubtNature;
import ma.nafura.platform.documents.docextractor.api.response.ExtractionValidationDto;
import ma.nafura.platform.documents.docextractor.api.response.FieldIssueKind;
import ma.nafura.platform.documents.docextractor.api.response.ValidationState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SchemaValidatorTest {

    private SchemaValidator validator;

    @BeforeEach
    void setUp() {
        validator = new SchemaValidator(new ObjectMapper());
    }

    @Test
    void validWhenAllRequiredPresent() {
        String schema = """
            {
              "type": "object",
              "required": ["fournisseurs"],
              "properties": {
                "fournisseurs": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "required": ["raisonSociale"],
                    "properties": {
                      "raisonSociale": { "type": "string" },
                      "ice": { "type": ["string", "null"] }
                    }
                  }
                }
              }
            }
            """;
        String data = """
            {
              "fournisseurs": [
                { "raisonSociale": "ACME Maroc", "ice": "123" },
                { "raisonSociale": "Beta SARL" }
              ]
            }
            """;
        String uiSchema = "{ \"importPolicy\": \"PARTIAL\" }";

        ExtractionValidationDto result = validator.validate(data, schema, uiSchema);

        assertEquals(ValidationState.VALID, result.state());
        assertTrue(result.issues().isEmpty());
        assertEquals("PARTIAL", result.importPolicy());
    }

    @Test
    void incompleteWhenRequiredMissingOnRow() {
        String schema = """
            {
              "type": "object",
              "properties": {
                "fournisseurs": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "required": ["raisonSociale"],
                    "properties": {
                      "raisonSociale": { "type": ["string", "null"] }
                    }
                  }
                }
              }
            }
            """;
        String data = """
            {
              "fournisseurs": [
                { "raisonSociale": "OK" },
                { "raisonSociale": null }
              ]
            }
            """;

        ExtractionValidationDto result = validator.validate(data, schema, null);

        assertEquals(ValidationState.INCOMPLETE, result.state());
        assertEquals(1, result.issues().stream().filter(i -> i.kind() == FieldIssueKind.MISSING_REQUIRED).count());
        assertEquals(1, result.issues().get(0).rowIndex());
        assertEquals(DoubtNature.SOURCE_GAP, result.issues().get(0).nature());
    }

    @Test
    void invalidWhenEmptyPayload() {
        ExtractionValidationDto result = validator.validate("", "{}", null);
        assertEquals(ValidationState.INVALID, result.state());
        assertEquals(DoubtNature.EXTRACTION, result.issues().get(0).nature());
    }

    @Test
    void extractionNatureWhenJsonUnreadable() {
        ExtractionValidationDto result = validator.validate("{", "{}", null);
        assertEquals(ValidationState.INVALID, result.state());
        assertEquals(FieldIssueKind.TYPE_MISMATCH, result.issues().get(0).kind());
        assertEquals(DoubtNature.EXTRACTION, result.issues().get(0).nature());
    }
}
