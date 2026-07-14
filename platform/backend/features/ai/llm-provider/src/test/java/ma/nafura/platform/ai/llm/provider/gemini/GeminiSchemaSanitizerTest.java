package ma.nafura.platform.ai.llm.provider.gemini;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import static org.assertj.core.api.Assertions.assertThat;

class GeminiSchemaSanitizerTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private final GeminiProvider provider =
            new GeminiProvider(WebClient.builder().build(), "test-key", "https://example.invalid", "gemini-test");

    @Test
    void convertsNullableTypeUnionsToSingleTypePlusNullable() throws Exception {
        JsonNode schema = mapper.readTree("""
            {
              "type": "object",
              "properties": {
                "code": { "type": ["string", "null"], "title": "Code" },
                "quantite": { "type": ["number", "null"] }
              }
            }
            """);

        JsonNode sanitized = provider.sanitizeGeminiParameters(schema);

        assertThat(sanitized.path("properties").path("code").path("type").asText()).isEqualTo("string");
        assertThat(sanitized.path("properties").path("code").path("nullable").asBoolean()).isTrue();
        assertThat(sanitized.path("properties").path("code").has("title")).isFalse();
        assertThat(sanitized.path("properties").path("quantite").path("type").asText()).isEqualTo("number");
        assertThat(sanitized.path("properties").path("quantite").path("nullable").asBoolean()).isTrue();
    }

    @Test
    void sanitizesNestedArrayItems() throws Exception {
        JsonNode schema = mapper.readTree("""
            {
              "type": "object",
              "properties": {
                "lots": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "designation": { "type": ["string", "null"] },
                      "postes": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "code": { "type": ["string", "null"] }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            """);

        JsonNode sanitized = provider.sanitizeGeminiParameters(schema);
        JsonNode posteCode = sanitized
                .path("properties").path("lots").path("items")
                .path("properties").path("postes").path("items")
                .path("properties").path("code");

        assertThat(posteCode.path("type").asText()).isEqualTo("string");
        assertThat(posteCode.path("nullable").asBoolean()).isTrue();
    }
}
