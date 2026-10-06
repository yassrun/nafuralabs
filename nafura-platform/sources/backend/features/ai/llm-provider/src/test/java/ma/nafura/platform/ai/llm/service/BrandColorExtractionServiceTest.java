package ma.nafura.platform.ai.llm.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.platform.appsettings.api.response.BrandColorExtractionResponse;
import ma.nafura.platform.appsettings.repository.TenantAssetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class BrandColorExtractionServiceTest {

    private BrandColorExtractionService service;

    @BeforeEach
    void setUp() {
        service = new BrandColorExtractionService(
            mock(TenantAssetRepository.class),
            new ObjectMapper(),
            mock(LlmService.class));
    }

    @Test
    void parse_acceptsValidPalette() throws Exception {
        BrandColorExtractionResponse response = service.parse("""
            {
              "candidates": ["#112233", "#AABBCC", "#ddeeff", "#ffffff"],
              "suggested": {
                "primary": "#112233",
                "secondary": "#AABBCC",
                "accent": "#DDEEFF"
              }
            }
            """);
        assertThat(response.suggested().primary()).isEqualTo("#112233");
        assertThat(response.suggested().secondary()).isEqualTo("#aabbcc");
        assertThat(response.suggested().accent()).isEqualTo("#ddeeff");
        assertThat(response.candidates()).contains("#112233", "#aabbcc", "#ddeeff");
    }

    @Test
    void parse_stripsMarkdownFence() throws Exception {
        BrandColorExtractionResponse response = service.parse("""
            ```json
            {"candidates":["#111111","#222222","#333333"],"suggested":{"primary":"#111111","secondary":"#222222","accent":"#333333"}}
            ```
            """);
        assertThat(response.suggested().primary()).isEqualTo("#111111");
        assertThat(response.candidates()).hasSizeGreaterThanOrEqualTo(3);
    }
}
