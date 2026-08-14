package ma.nafura.rh.service;

import java.util.regex.Pattern;

public final class CnssValidation {

    private static final Pattern CNSS = Pattern.compile("^\\d{7,8}$");
    private static final Pattern CIN = Pattern.compile("^[A-Za-z]{1,2}\\d{5,8}$");

    private CnssValidation() {}

    public static boolean isValidCnss(String cnss) {
        return cnss != null && CNSS.matcher(cnss.trim()).matches();
    }

    public static boolean isValidCin(String cin) {
        return cin != null && CIN.matcher(cin.trim()).matches();
    }

    public static void validateCnss(String cnss) {
        if (cnss == null || cnss.isBlank()) {
            return;
        }
        if (!isValidCnss(cnss)) {
            throw new IllegalArgumentException("Invalid CNSS number: must be 7-8 digits");
        }
    }

    public static void validateCin(String cin) {
        if (cin == null || cin.isBlank()) {
            throw new IllegalArgumentException("CIN is required");
        }
        if (!isValidCin(cin)) {
            throw new IllegalArgumentException("Invalid CIN: expected 1-2 letters followed by 5-8 digits");
        }
    }
}
