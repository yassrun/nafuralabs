package ma.nafura.venuecatalog.api.error;

import ma.nafura.platform.integrations.googleplaces.GooglePlacesException;
import ma.nafura.venuecatalog.api.dto.CatalogDtos;
import ma.nafura.venuecatalog.job.application.JobValidationException;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(JobValidationException.class)
    public ResponseEntity<CatalogDtos.ErrorResponse> handleValidation(JobValidationException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(new CatalogDtos.ErrorResponse("validation", ex.getMessage(), List.of(), traceId()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<CatalogDtos.ErrorResponse> handleBeanValidation(MethodArgumentNotValidException ex) {
        List<Map<String, String>> details = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> Map.of("field", error.getField(), "message", error.getDefaultMessage()))
                .toList();
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(new CatalogDtos.ErrorResponse("validation", "payload invalide", details, traceId()));
    }

    @ExceptionHandler(GooglePlacesException.class)
    public ResponseEntity<CatalogDtos.ErrorResponse> handleGoogle(GooglePlacesException ex) {
        if (ex.getStatusCode() == 429) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new CatalogDtos.ErrorResponse("provider_quota_exceeded", ex.getMessage(), List.of(), traceId()));
        }
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new CatalogDtos.ErrorResponse("provider_error", ex.getMessage(), List.of(), traceId()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<CatalogDtos.ErrorResponse> handleForbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new CatalogDtos.ErrorResponse("forbidden", "forbidden", List.of(), traceId()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<CatalogDtos.ErrorResponse> handleStatus(ResponseStatusException ex) {
        String error = ex.getStatusCode() == HttpStatus.NOT_FOUND ? "not_found" : "error";
        return ResponseEntity.status(ex.getStatusCode())
                .body(new CatalogDtos.ErrorResponse(error, ex.getReason(), List.of(), traceId()));
    }

    private static String traceId() {
        String traceId = MDC.get("traceId");
        return traceId != null ? traceId : "00000000-0000-0000-0000-000000000999";
    }
}
