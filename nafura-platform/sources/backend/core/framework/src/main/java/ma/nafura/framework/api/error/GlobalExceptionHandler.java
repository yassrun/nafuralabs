package ma.nafura.platform.framework.api.error;

import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import ma.nafura.platform.framework.service.crud.CrudOperationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String HEADER_CORRELATION_ID = "X-Correlation-Id";
    private static final String HEADER_REQUEST_ID = "X-Request-Id";

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        List<ApiFieldError> fields = ex.getBindingResult().getFieldErrors().stream()
                .map(this::toFieldError)
                .toList();
        ApiError error = ApiError.withFields(
                "VALIDATION_ERROR",
                "validation.failed",
                "Validation failed",
                fields,
                correlationId(request));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request) {
        List<ApiFieldError> fields = ex.getConstraintViolations().stream()
                .map(violation -> new ApiFieldError(
                        violation.getPropertyPath() != null ? violation.getPropertyPath().toString() : "",
                        "validation.invalid",
                        violation.getMessage()))
                .toList();
        ApiError error = ApiError.withFields(
                "VALIDATION_ERROR",
                "validation.failed",
                "Validation failed",
                fields,
                correlationId(request));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(CrudNotFoundException.class)
    public ResponseEntity<ApiError> handleCrudNotFound(
            CrudNotFoundException ex,
            HttpServletRequest request) {
        ApiError error = ApiError.simple(
                "NOT_FOUND",
                "error.notFound",
                ex.getMessage(),
                correlationId(request));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(CrudOperationException.class)
    public ResponseEntity<ApiError> handleCrudOperation(
            CrudOperationException ex,
            HttpServletRequest request) {
        ApiError error = ApiError.simple(
                "OPERATION_NOT_ALLOWED",
                "error.operationNotAllowed",
                ex.getMessage(),
                correlationId(request));
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request) {
        ApiError error = ApiError.simple(
                "BAD_REQUEST",
                "error.badRequest",
                ex.getMessage(),
                correlationId(request));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> handleIllegalState(
            IllegalStateException ex,
            HttpServletRequest request) {
        ApiError error = ApiError.simple(
                "CONFLICT",
                "error.conflict",
                ex.getMessage(),
                correlationId(request));
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNoResourceFound(
            NoResourceFoundException ex,
            HttpServletRequest request) {
        ApiError error = ApiError.simple(
                "NOT_FOUND",
                "error.notFound",
                ex.getMessage(),
                correlationId(request));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Preserve explicit HTTP statuses (e.g. conversation 404/403). Without this,
     * {@link #handleUnhandled} would collapse them into a generic 500.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatus(
            ResponseStatusException ex,
            HttpServletRequest request) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        String code = switch (status) {
            case NOT_FOUND -> "NOT_FOUND";
            case FORBIDDEN -> "FORBIDDEN";
            case BAD_REQUEST -> "BAD_REQUEST";
            case CONFLICT -> "CONFLICT";
            case PRECONDITION_FAILED -> "PRECONDITION_FAILED";
            default -> "HTTP_" + status.value();
        };
        String message = ex.getReason() != null && !ex.getReason().isBlank()
                ? ex.getReason()
                : status.getReasonPhrase();
        ApiError error = ApiError.simple(
                code,
                "error." + status.value(),
                message,
                correlationId(request));
        return ResponseEntity.status(status).body(error);
    }

    @ExceptionHandler({PayloadTooLargeException.class, MaxUploadSizeExceededException.class})
    public ResponseEntity<ApiError> handlePayloadTooLarge(
            Exception ex,
            HttpServletRequest request) {
        log.warn("Payload too large: {}", ex.getMessage());
        ApiError error = ApiError.simple(
                "PAYLOAD_TOO_LARGE",
                "error.payloadTooLarge",
                ex.getMessage() != null && !ex.getMessage().isBlank()
                        ? ex.getMessage()
                        : "Uploaded file exceeds the maximum allowed size",
                correlationId(request));
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(error);
    }

    @ExceptionHandler(StorageQuotaExceededException.class)
    public ResponseEntity<ApiError> handleStorageQuotaExceeded(
            StorageQuotaExceededException ex,
            HttpServletRequest request) {
        log.warn("Storage quota exceeded: {}", ex.getMessage());
        ApiError error = ApiError.simple(
                "STORAGE_QUOTA_EXCEEDED",
                "error.storageQuotaExceeded",
                ex.getMessage() != null && !ex.getMessage().isBlank()
                        ? ex.getMessage()
                        : "Tenant storage quota exceeded",
                correlationId(request));
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnhandled(
            Exception ex,
            HttpServletRequest request) {
        log.error("Unhandled error: {}", ex.getMessage(), ex);
        ApiError error = ApiError.simple(
                "INTERNAL_ERROR",
                "error.internal",
                "An unexpected error occurred",
                correlationId(request));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    private ApiFieldError toFieldError(FieldError fieldError) {
        String message = fieldError.getDefaultMessage();
        return new ApiFieldError(fieldError.getField(), "validation.invalid", message);
    }

    private String correlationId(HttpServletRequest request) {
        String value = request.getHeader(HEADER_CORRELATION_ID);
        if (value == null || value.isBlank()) {
            value = request.getHeader(HEADER_REQUEST_ID);
        }
        return value != null && !value.isBlank() ? value : UUID.randomUUID().toString();
    }
}


