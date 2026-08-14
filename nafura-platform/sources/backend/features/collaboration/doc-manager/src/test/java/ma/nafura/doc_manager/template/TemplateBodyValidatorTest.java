package ma.nafura.platform.collaboration.docmanager.template;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Template bodies are evaluated in SpringEL, which reaches the whole JVM. These tests pin what
 * must never make it into the database.
 */
class TemplateBodyValidatorTest {

    @Test
    void rejectsRuntimeExecution() {
        assertThatThrownBy(() -> TemplateBodyValidator.validate(
                        "<div th:text=\"${T(java.lang.Runtime).getRuntime().exec('calc')}\"></div>"))
                .isInstanceOf(TemplateRenderException.class)
                .hasMessageContaining("interdits");
    }

    @Test
    void rejectsInstantiationAndBeanAccess() {
        assertThat(TemplateBodyValidator.findViolations(
                        "<p th:text=\"${new java.io.File('/etc/passwd')}\"></p>"))
                .isNotEmpty();
        assertThat(TemplateBodyValidator.findViolations("<p th:text=\"${@dataSource.toString()}\"></p>"))
                .isNotEmpty();
    }

    @Test
    void rejectsClassLoaderEscapes() {
        assertThat(TemplateBodyValidator.findViolations("<p th:text=\"${''.class.forName('x')}\"></p>"))
                .isNotEmpty();
        assertThat(TemplateBodyValidator.findViolations("<p th:text=\"${obj.getClass().name}\"></p>"))
                .isNotEmpty();
    }

    @Test
    void rejectsActiveMarkup() {
        assertThat(TemplateBodyValidator.findViolations("<script>alert(1)</script>")).isNotEmpty();
        assertThat(TemplateBodyValidator.findViolations("<iframe src=\"x\"></iframe>")).isNotEmpty();
        assertThat(TemplateBodyValidator.findViolations("<img onerror=\"alert(1)\"/>")).isNotEmpty();
        assertThat(TemplateBodyValidator.findViolations("<a href=\"javascript:alert(1)\">x</a>"))
                .isNotEmpty();
    }

    @Test
    void rejectsFileInclusion() {
        assertThat(TemplateBodyValidator.findViolations(
                        "<div th:replace=\"file:/etc/passwd :: body\"></div>"))
                .isNotEmpty();
    }

    @Test
    void acceptsAnOrdinaryDocumentTemplate() {
        String body = """
            <div class="hdr">
              <div th:utext="${fragments.HEADER_DEFAULT}"></div>
              <h1>Facture <span th:text="${entity.numero}">FAC-001</span></h1>
            </div>
            <table>
              <tr th:each="l : ${entity.lignes}">
                <td th:text="${l.designation}"></td>
                <td th:text="${#numbers.formatDecimal(l.totalHt, 1, 2)}"></td>
              </tr>
            </table>
            <p th:if="${entity.modePaiement}" th:text="${entity.modePaiement}"></p>
            """;

        assertThatCode(() -> TemplateBodyValidator.validate(body)).doesNotThrowAnyException();
        assertThat(TemplateBodyValidator.findViolations(body)).isEmpty();
    }

    @Test
    void acceptsBlankBodyWithoutComplaining() {
        // Emptiness is handled by the render service with its own message.
        assertThat(TemplateBodyValidator.findViolations(null)).isEmpty();
        assertThat(TemplateBodyValidator.findViolations("  ")).isEmpty();
    }
}
