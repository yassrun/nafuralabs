package ma.nafura.platform.appsettings.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UpdateLocalizationRequest(
    @NotBlank String defaultLocale,
    @NotEmpty List<String> supportedLocales,
    String defaultCurrency,
    String dateFormat,
    String numberFormat
) {}

