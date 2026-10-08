package ma.nafura.platform.administration.access.roles;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class BusinessContextContractsTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void aContextConsumesThePublishedContract() throws Exception {
        BusinessContextContracts.check(List.of(chantiers(), achats("^1.0.0", "chantiers.chantier", "chantiers.chantier.opened")));
    }

    @Test
    void anUnpublishedEventOrAMissingContextRefusesStartup() throws Exception {
        assertThatThrownBy(() -> BusinessContextContracts.check(List.of(
                chantiers(), achats("^1.0.0", null, "chantiers.chantier.closed"))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("unpublished event");
        assertThatThrownBy(() -> BusinessContextContracts.check(List.of(achats("^1.0.0", null, null))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("missing business context");
    }

    private JsonNode chantiers() throws Exception {
        return json.readTree("""
                {"metadata":{"id":"bc.chantiers","version":"1.2.0"},"spec":{
                  "records":{"chantiers.chantier":"/chantiers/{id}"},
                  "notifications":[{"id":"chantiers.chantier.opened"}],
                  "provides":[{"id":"bc.chantiers","version":"1.2.0",
                    "api":["chantiers.chantier"],"events":["chantiers.chantier.opened"]}]}}
                """);
    }

    private JsonNode achats(String version, String api, String event) throws Exception {
        String apiJson = api == null ? "" : ",\"api\":[\"" + api + "\"]";
        String eventJson = event == null ? "" : ",\"events\":[\"" + event + "\"]";
        return json.readTree("""
                {"metadata":{"id":"bc.achats","version":"1.0.0"},"spec":{
                  "requires":[{"id":"bc.chantiers","version":"%s"%s%s}]}}
                """.formatted(version, apiJson, eventJson));
    }
}
