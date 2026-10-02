package ma.nafura.platform.collaboration.docmanager.template;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponse;

/** The template does not exist for the current tenant; also what another tenant's template looks like. */
public class TemplateNotFoundException extends TemplateRenderException implements ErrorResponse {

    private final ProblemDetail body;

    public TemplateNotFoundException(String message) {
        super(message);
        this.body = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "Template not found");
    }

    @Override
    public HttpStatusCode getStatusCode() {
        return HttpStatus.NOT_FOUND;
    }

    @Override
    public ProblemDetail getBody() {
        return body;
    }
}
