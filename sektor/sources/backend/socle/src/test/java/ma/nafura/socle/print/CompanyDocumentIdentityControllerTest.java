package ma.nafura.socle.print;

import java.util.Map;

import org.junit.jupiter.api.Test;

import ma.nafura.platform.organizationidentity.api.dto.OrganizationIdentityDto;
import ma.nafura.platform.organizationidentity.service.OrganizationIdentityService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CompanyDocumentIdentityControllerTest {

    @Test
    void delegatesSaveToPlatformIdentityService() {
        OrganizationIdentityService service = mock(OrganizationIdentityService.class);
        CompanyDocumentIdentityController controller = new CompanyDocumentIdentityController(service);
        OrganizationIdentityDto input = OrganizationIdentityDto.fromMap(Map.of("raisonSociale", "  Entreprise  "));
        OrganizationIdentityDto saved = OrganizationIdentityDto.fromMap(Map.of("raisonSociale", "Entreprise"));
        when(service.save(input)).thenReturn(saved);

        Map<String, String> result = controller.save(Map.of("raisonSociale", "  Entreprise  "));

        assertThat(result.get("raisonSociale")).isEqualTo("Entreprise");
        verify(service).save(input);
    }

    @Test
    void delegatesGetToPlatformIdentityService() {
        OrganizationIdentityService service = mock(OrganizationIdentityService.class);
        CompanyDocumentIdentityController controller = new CompanyDocumentIdentityController(service);
        when(service.get()).thenReturn(OrganizationIdentityDto.fromMap(Map.of("ice", "001234567000089")));

        assertThat(controller.get().get("ice")).isEqualTo("001234567000089");
        verify(service).get();
    }
}
