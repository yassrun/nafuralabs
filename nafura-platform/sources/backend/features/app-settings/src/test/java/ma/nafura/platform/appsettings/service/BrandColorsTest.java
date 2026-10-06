package ma.nafura.platform.appsettings.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class BrandColorsTest {

    @Test
    void normalize_expandsShortHex() {
        assertThat(BrandColors.normalize("#aB1", BrandColors.DEFAULT_PRIMARY)).isEqualTo("#aabb11");
    }

    @Test
    void normalizeOrNull_rejectsInvalid() {
        assertThat(BrandColors.normalizeOrNull("red")).isNull();
        assertThat(BrandColors.normalizeOrNull("#112233")).isEqualTo("#112233");
    }

    @Test
    void of_fallsBackToDefaults() {
        BrandColors colors = BrandColors.of(null, "not-a-color", "#ABC");
        assertThat(colors.primary()).isEqualTo(BrandColors.DEFAULT_PRIMARY);
        assertThat(colors.secondary()).isEqualTo(BrandColors.DEFAULT_SECONDARY);
        assertThat(colors.accent()).isEqualTo("#aabbcc");
    }
}
