package ma.nafura.platform.collaboration.docmanager.template;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Several product modules register an {@link EntityDataProvider}. Resolution must pick the one
 * declaring support for the requested type — before this, a single provider was field-injected
 * and a second module silently broke rendering.
 */
class TemplateVariableResolverProviderTest {

    private static final String DEVIS = "devis";
    private static final String FACTURE = "facture_client";

    private TemplateVariableResolver resolverWith(EntityDataProvider... providers) {
        return new TemplateVariableResolver(List.of(providers), List.of());
    }

    @Test
    void picksProviderDeclaringSupportForType() {
        TemplateVariableResolver resolver = resolverWith(
                new StubProvider(DEVIS, "from-devis"),
                new StubProvider(FACTURE, "from-facture"));

        assertThat(resolver.providerFor(FACTURE))
                .get()
                .extracting(p -> p.getEntityData(FACTURE, UUID.randomUUID()).get("source"))
                .isEqualTo("from-facture");
    }

    @Test
    void firstMatchWinsWhenTwoProvidersOverlap() {
        TemplateVariableResolver resolver = resolverWith(
                new StubProvider(DEVIS, "first"),
                new StubProvider(DEVIS, "second"));

        assertThat(resolver.providerFor(DEVIS))
                .get()
                .extracting(p -> p.getEntityData(DEVIS, UUID.randomUUID()).get("source"))
                .isEqualTo("first");
    }

    @Test
    void emptyWhenNoProviderSupportsType() {
        TemplateVariableResolver resolver = resolverWith(new StubProvider(DEVIS, "x"));

        assertThat(resolver.providerFor("bon_de_commande")).isEmpty();
    }

    @Test
    void emptyWhenTypeIsNullOrBlank() {
        TemplateVariableResolver resolver = resolverWith(new StubProvider(DEVIS, "x"));

        assertThat(resolver.providerFor(null)).isEmpty();
        assertThat(resolver.providerFor("  ")).isEmpty();
    }

    @Test
    void emptyWhenNoProviderRegistered() {
        assertThat(resolverWith().providerFor(DEVIS)).isEmpty();
    }

    private record StubProvider(String supportedType, String source) implements EntityDataProvider {

        @Override
        public boolean supports(String entityType) {
            return supportedType.equals(entityType);
        }

        @Override
        public Map<String, Object> getEntityData(String entityType, UUID entityId) {
            return Map.of("source", source);
        }
    }
}
