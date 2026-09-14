package ma.nafura.platform.collaboration.docmanager.template;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableDescriptor;
import ma.nafura.platform.collaboration.docmanager.config.ThymeleafTemplateConfig;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.thymeleaf.context.Context;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mockStatic;

class IncompleteTenantIdentityTest {
    @Test
    void missingOptionalFieldsDoNotDiscardTheCompanyHeader() {
        TenantIdentityProvider provider = new TenantIdentityProvider() {
            public int order() { return 0; }
            public Map<String, Object> identity(UUID id) { return Map.of("raisonSociale", "QA Local"); }
            public List<TemplateVariableDescriptor> describe() {
                return List.of(
                    new TemplateVariableDescriptor("tenant.raisonSociale", "Société", "string", null),
                    new TemplateVariableDescriptor("tenant.logo", "Logo", "image", null),
                    new TemplateVariableDescriptor("tenant.adresse", "Adresse", "string", null));
            }
        };
        try (MockedStatic<TenantContext> tenant = mockStatic(TenantContext.class)) {
            tenant.when(TenantContext::getTenantId).thenReturn(UUID.randomUUID());
            var resolver = new TemplateVariableResolver(List.of(), List.of(provider));
            Context context = new Context();
            context.setVariables(resolver.resolveForPreview("devis"));
            String html = new ThymeleafTemplateConfig().stringTemplateEngine().process(
                "<div><img th:if=\"${tenant.logo}\" th:src=\"${tenant.logo}\"/>"
                + "<b th:text=\"${tenant.raisonSociale}\"></b>"
                + "<span th:if=\"${tenant.adresse}\" th:text=\"${tenant.adresse}\"></span></div>", context);
            assertThat(html).contains("QA Local").doesNotContain("<img", "<span");
        }
    }
}
