package ma.nafura.platform.framework.api.error;

public record ApiFieldError(
        String field,
        String messageKey,
        String message
) {}


