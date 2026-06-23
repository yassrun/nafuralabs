package ma.nafura.platform.appsettings.api.response;

import java.util.List;

public record AppLocalizationSettingsResponse(
    String defaultLocale,
    List<String> supportedLocales,
    String defaultCurrency,
    String dateFormat,
    String numberFormat
) {}


