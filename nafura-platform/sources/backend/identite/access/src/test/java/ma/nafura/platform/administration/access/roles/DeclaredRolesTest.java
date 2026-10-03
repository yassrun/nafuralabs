package ma.nafura.platform.administration.access.roles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class DeclaredRolesTest {

    private final ObjectMapper json = new ObjectMapper();

    private JsonNode achats() throws Exception {
        return json.readTree("""
            {"metadata":{"id":"bc.achats"},"spec":{
              "permissions":[{"id":"achats.commande.read"},{"id":"achats.commande.create"}],
              "defaultRoles":[{"code":"ACHETEUR","label":"Acheteur","permissions":["achats.commande.read","achats.commande.create"]}]}}
            """);
    }

    private JsonNode ventes() throws Exception {
        return json.readTree("""
            {"metadata":{"id":"bc.ventes"},"spec":{
              "permissions":[{"id":"ventes.devis.read"}],
              "defaultRoles":[{"code":"VENDEUR","permissions":["ventes.devis.read"]}]}}
            """);
    }

    private JsonNode app(String contexts, String roles) throws Exception {
        return json.readTree("{\"metadata\":{\"id\":\"app.demo\"},\"spec\":{\"businessContexts\":" + contexts
                + ",\"roles\":" + roles + "}}");
    }

    @Test
    void expandsCrossBcRolesIntoPermissions() throws Exception {
        Map<String, DeclaredRoles.Role> roles = DeclaredRoles.resolve(
                app("[\"bc.achats\",\"bc.ventes\"]",
                        "[{\"code\":\"COMMERCIAL\",\"label\":\"Commercial\",\"includes\":[\"bc.achats:ACHETEUR\"],\"permissions\":[\"ventes.devis.read\"]}]"),
                List.of(achats(), ventes()));

        assertThat(roles).containsOnlyKeys("ACHETEUR", "VENDEUR", "COMMERCIAL");
        assertThat(roles.get("ACHETEUR").label()).isEqualTo("Acheteur");
        assertThat(roles.get("VENDEUR").label()).isEqualTo("VENDEUR");
        assertThat(roles.get("COMMERCIAL").permissions())
                .containsExactlyInAnyOrder("achats.commande.read", "achats.commande.create", "ventes.devis.read");
        assertThat(roles.get("COMMERCIAL").owner()).isEqualTo("app.demo");
    }

    @Test
    void ignoresBusinessContextsTheApplicationDoesNotEmbed() throws Exception {
        Map<String, DeclaredRoles.Role> roles = DeclaredRoles.resolve(app("[\"bc.achats\"]", "[]"), List.of(achats(), ventes()));

        assertThat(roles).containsOnlyKeys("ACHETEUR");
    }

    @Test
    void rejectsReferencesAndPermissionsOutsideEmbeddedContexts() throws Exception {
        JsonNode application = app("[\"bc.achats\"]",
                "[{\"code\":\"X\",\"label\":\"X\",\"includes\":[\"bc.ventes:VENDEUR\"],\"permissions\":[\"ventes.devis.read\"]}]");

        assertThatThrownBy(() -> DeclaredRoles.resolve(application, List.of(achats(), ventes())))
                .hasMessageContaining("includes bc.ventes:VENDEUR")
                .hasMessageContaining("grants ventes.devis.read");
    }

    @Test
    void rejectsDuplicateCodesAndForeignPermissions() throws Exception {
        JsonNode clash = json.readTree("""
            {"metadata":{"id":"bc.ventes"},"spec":{
              "permissions":[{"id":"achats.commande.read"}],
              "defaultRoles":[{"code":"ACHETEUR","permissions":["achats.commande.read"]}]}}
            """);

        assertThatThrownBy(() -> DeclaredRoles.resolve(app("[\"bc.achats\",\"bc.ventes\"]", "[]"), List.of(achats(), clash)))
                .hasMessageContaining("outside ventes.")
                .hasMessageContaining("role code ACHETEUR declared by both bc.achats and bc.ventes");
    }

    @Test
    void rejectsAMissingBusinessContextManifest() throws Exception {
        assertThatThrownBy(() -> DeclaredRoles.resolve(app("[\"bc.achats\"]", "[]"), List.of()))
                .hasMessageContaining("bc.achats has no manifest");
    }

    @Test
    void platformRolesComeFirstAndNoOneElseMayReuseTheirCodes() throws Exception {
        JsonNode platform = json.readTree("""
            {"roles":[{"code":"ORG_ADMIN","label":"Administrateur","permissions":["tenant.*"]}]}
            """);

        Map<String, DeclaredRoles.Role> roles = DeclaredRoles.resolve(platform, app("[\"bc.achats\"]", "[]"), List.of(achats()));
        assertThat(roles.keySet()).containsExactly("ORG_ADMIN", "ACHETEUR");
        assertThat(roles.get("ORG_ADMIN").owner()).isEqualTo(DeclaredRoles.PLATFORM);
        assertThat(roles.get("ORG_ADMIN").permissions()).containsExactly("tenant.*");

        JsonNode clash = app("[]", "[{\"code\":\"ORG_ADMIN\",\"label\":\"X\"}]");
        assertThatThrownBy(() -> DeclaredRoles.resolve(platform, clash, List.of()))
                .hasMessageContaining("role code ORG_ADMIN declared by both platform and app.demo");
    }

    @Test
    void thePlatformRolesFileIsValid() throws Exception {
        JsonNode platform = json.readTree(getClass().getResourceAsStream("/META-INF/nafura/platform/roles.json"));

        assertThat(DeclaredRoles.resolve(platform, app("[]", "[]"), List.of())).containsOnlyKeys("OWNER", "ORG_ADMIN", "ORG_MEMBER");
        assertThat(DeclaredRoles.resolve(platform, app("[]", "[]"), List.of()).get("OWNER").permissions()).containsExactly("*");
    }
}
