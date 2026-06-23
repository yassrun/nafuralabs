package ma.nafura.platform.framework.api.error;

import java.util.List;
import java.util.Map;

public record ApiError(
        String code,
        String messageKey,
        String message,
        Map<String, Object> params,
        List<ApiFieldError> fieldErrors,
        String correlationId
) {
    public static ApiError simple(String code, String messageKey, String message, String correlationId) {
        return new ApiError(code, messageKey, message, Map.of(), List.of(), correlationId);
    }

    public static ApiError withFields(
            String code,
            String messageKey,
            String message,
            List<ApiFieldError> fieldErrors,
            String correlationId) {
        return new ApiError(code, messageKey, message, Map.of(), fieldErrors, correlationId);
    }
}


