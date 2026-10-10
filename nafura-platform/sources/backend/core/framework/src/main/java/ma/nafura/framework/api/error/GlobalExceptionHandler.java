package ma.nafura.platform.framework.api.error;

import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.framework.record.RecordRuleException;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import ma.nafura.platform.framework.service.crud.CrudOperationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
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

    /** A rule of a record: its field errors (422, same body as Bean Validation) or its reason (409). */
    @ExceptionHandler(RecordRuleException.class)
    public ResponseEntity<ApiError> handleRecordRule(
            RecordRuleException ex,
            HttpServletRequest request) {
        if (ex.errors().isEmpty()) {
            ApiError error = ApiError.simple("RECORD_REFUSED", "record.refused", ex.getMessage(), correlationId(request));
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }
        List<ApiFieldError> fields = ex.errors().entrySet().stream()
                .map(entry -> new ApiFieldError(entry.getKey(), "validation.rule", entry.getValue()))
                .toList();
        ApiError error = ApiError.withFields(
                "VALIDATION_ERROR",
                "validation.failed",
                "Validation failed",
                fields,
                correlationId(request));
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT).body(error);
    }

    /**
     * Stale {@code @Version} on a record update (client echo or concurrent flush). Stable code for the UI.
     */
    @ExceptionHandler({OptimisticLockingFailureException.class, ObjectOptimisticLockingFailureException.class})
    public ResponseEntity<ApiError> handleOptimisticLock(
            OptimisticLockingFailureException ex,
            HttpServletRequest request) {
        String message = ex.getMessage() != null && !ex.getMessage().isBlank()
                ? ex.getMessage()
                : "The record was modified by someone else. Reload before saving again.";
        ApiError error = ApiError.simple("OPTIMISTIC_LOCK", "record.optimisticLock", message, correlationId(request));
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
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

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiError> handleUnreadableRequest(
            Exception ex,
            HttpServletRequest request) {
        ApiError error = ApiError.simple(
                "BAD_REQUEST",
                "error.badRequest",
                "Malformed request",
                correlationId(request));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
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
        // Spring MVC request errors (missing parameter, type mismatch, unsupported method...) carry a 4xx status.
        if (ex instanceof ErrorResponse errorResponse && errorResponse.getStatusCode().is4xxClientError()) {
            return clientError(errorResponse.getStatusCode(), ex, request);
        }
        log.error("Unhandled error: {}", ex.getMessage(), ex);
        ApiError error = ApiError.simple(
                "INTERNAL_ERROR",
                "error.internal",
                "An unexpected error occurred",
                correlationId(request));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    private ResponseEntity<ApiError> clientError(HttpStatusCode status, Exception ex, HttpServletRequest request) {
        log.debug("Client request error {}: {}", status.value(), ex.getMessage());
        HttpStatus resolved = HttpStatus.resolve(status.value());
        String message = resolved != null ? resolved.getReasonPhrase() : "Bad request";
        if (ex instanceof ErrorResponse errorResponse && errorResponse.getBody().getDetail() != null) {
            message = errorResponse.getBody().getDetail();
        }
        ApiError error = ApiError.simple(
                status.value() == 400 ? "BAD_REQUEST" : "HTTP_" + status.value(),
                "error." + status.value(),
                message,
                correlationId(request));
        return ResponseEntity.status(status).body(error);
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


