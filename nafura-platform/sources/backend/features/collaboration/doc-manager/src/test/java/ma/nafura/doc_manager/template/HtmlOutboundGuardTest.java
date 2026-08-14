package ma.nafura.platform.collaboration.docmanager.template;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * A browser-based renderer follows every URL in the page. Left open, a template is a way to reach
 * internal services from inside the cluster and to leak document contents outwards.
 */
class HtmlOutboundGuardTest {

    @Test
    void acceptsSelfContainedDocuments() {
        String html = """
            <html><head><style>body { color: #111 }</style></head>
            <body><img src="data:image/png;base64,AAAA" alt=""/><a href="#total">Total</a></body></html>
            """;

        assertThat(HtmlOutboundGuard.findRemoteReferences(html)).isEmpty();
    }

    @Test
    void rejectsCloudMetadataEndpoint() {
        String html = "<img src=\"http://169.254.169.254/latest/meta-data/\"/>";

        assertThatThrownBy(() -> HtmlOutboundGuard.requireSelfContained(html))
                .isInstanceOf(TemplateRenderException.class)
                .hasMessageContaining("169.254.169.254");
    }

    @Test
    void rejectsPrivateNetworkAndExternalHosts() {
        assertThat(HtmlOutboundGuard.findRemoteReferences("<img src=\"http://10.0.0.5/x.png\"/>"))
                .isNotEmpty();
        assertThat(HtmlOutboundGuard.findRemoteReferences("<img src=\"https://exemple.ma/logo.png\"/>"))
                .isNotEmpty();
        assertThat(HtmlOutboundGuard.findRemoteReferences("<img src=\"//exemple.ma/logo.png\"/>"))
                .isNotEmpty();
    }

    @Test
    void rejectsRemoteCssReferences() {
        assertThat(HtmlOutboundGuard.findRemoteReferences(
                        "<style>body { background: url('https://exemple.ma/bg.png') }</style>"))
                .isNotEmpty();
        assertThat(HtmlOutboundGuard.findRemoteReferences(
                        "<style>@import \"https://fonts.example/x.css\";</style>"))
                .isNotEmpty();
    }

    @Test
    void rejectsRelativePathsThatCannotResolve() {
        // The renderer receives a standalone document: a relative path resolves to nothing and
        // would silently print a broken image.
        assertThat(HtmlOutboundGuard.findRemoteReferences("<img src=\"/assets/logo.png\"/>"))
                .isNotEmpty();
    }
}
