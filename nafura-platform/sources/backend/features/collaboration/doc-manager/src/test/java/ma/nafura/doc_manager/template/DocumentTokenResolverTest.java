package ma.nafura.platform.collaboration.docmanager.template;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Text typed in the customisation screen must never reach the expression engine. These tests pin
 * that boundary: allowed tokens become spans, everything else is inert.
 */
class DocumentTokenResolverTest {

    @Test
    void rewritesAllowedTokensAsSpans() {
        String html = DocumentTokenResolver.toFragmentHtml("ICE {{tenant.ice}} — RC {{tenant.rc}}");

        assertThat(html)
                .isEqualTo("ICE <span th:text=\"${tenant.ice}\"></span> — RC "
                        + "<span th:text=\"${tenant.rc}\"></span>");
    }

    @Test
    void leavesUnknownTokensVisibleInsteadOfSwallowingThem() {
        String html = DocumentTokenResolver.toFragmentHtml("Secret {{tenant.password}}");

        assertThat(html).isEqualTo("Secret {{tenant.password}}");
        assertThat(DocumentTokenResolver.unknownTokens("Secret {{tenant.password}}"))
                .containsExactly("tenant.password");
    }

    @Test
    void escapesMarkupSoATenantCannotInjectHtml() {
        String html = DocumentTokenResolver.toFragmentHtml("<script>alert(1)</script>");

        assertThat(html).doesNotContain("<script").contains("&lt;script&gt;");
    }

    @Test
    void neutralisesExpressionSyntaxTypedAsText() {
        String html = DocumentTokenResolver.toFragmentHtml(
                "${T(java.lang.Runtime).getRuntime().exec('calc')}");

        assertThat(html).doesNotContain("${");
        assertThat(html).contains("T(java.lang.Runtime)");
    }

    @Test
    void neutralisesEveryThymeleafExpressionPrefix() {
        for (String prefix : new String[] {"$", "#", "*", "@", "~"}) {
            assertThat(DocumentTokenResolver.toFragmentHtml(prefix + "{beans.x}"))
                    .as("prefix %s", prefix)
                    .doesNotContain(prefix + "{");
        }
    }

    @Test
    void keepsLoneSpecialCharactersReadable() {
        // A price like "100 $" or a reference "#42" must not be mangled.
        assertThat(DocumentTokenResolver.toFragmentHtml("Total 100 $ réf #42"))
                .isEqualTo("Total 100 $ réf #42");
    }

    @Test
    void turnsNewlinesIntoLineBreaks() {
        assertThat(DocumentTokenResolver.toFragmentHtml("ligne 1\nligne 2"))
                .isEqualTo("ligne 1<br/>ligne 2");
    }

    @Test
    void returnsEmptyForBlankInput() {
        assertThat(DocumentTokenResolver.toFragmentHtml(null)).isEmpty();
        assertThat(DocumentTokenResolver.toFragmentHtml("   ")).isEmpty();
    }

    @Test
    void constrainsColoursToHexLiterals() {
        assertThat(DocumentTokenResolver.safeColor("#A1B2C3", "#000")).isEqualTo("#a1b2c3");
        assertThat(DocumentTokenResolver.safeColor("red; background:url(x)", "#000"))
                .isEqualTo("#000");
        assertThat(DocumentTokenResolver.safeColor(null, "#000")).isEqualTo("#000");
    }
}
