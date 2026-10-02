package ma.nafura.platform.framework.api.error;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
    private final MockHttpServletRequest request = new MockHttpServletRequest();

    @Test
    void missingRequestParameterIsABadRequest() {
        ResponseEntity<ApiError> response = handler.handleUnhandled(
                new MissingServletRequestParameterException("entityType", "String"), request);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().code()).isEqualTo("BAD_REQUEST");
        assertThat(response.getBody().message()).contains("entityType");
    }

    @Test
    void unsupportedMethodKeepsItsStatus() {
        ResponseEntity<ApiError> response = handler.handleUnhandled(
                new HttpRequestMethodNotSupportedException(HttpMethod.PATCH.name()), request);

        assertThat(response.getStatusCode().value()).isEqualTo(405);
    }

    @Test
    void unexpectedErrorsStayInternalAndHideTheirMessage() {
        ResponseEntity<ApiError> response = handler.handleUnhandled(new RuntimeException("db password=secret"), request);

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(response.getBody().message()).isEqualTo("An unexpected error occurred");
    }
}
