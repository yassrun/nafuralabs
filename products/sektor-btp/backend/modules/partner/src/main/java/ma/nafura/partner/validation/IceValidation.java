package ma.nafura.partner.validation;

public final class IceValidation {

    private IceValidation() {}

    public static boolean isValid(String raw) {
        if (raw == null || raw.isBlank()) {
            return true;
        }
        String digits = raw.replaceAll("\\D", "");
        return digits.length() == 15 && digits.matches("\\d{15}");
    }

    public static void requireValid(String raw) {
        if (!isValid(raw)) {
            throw new IllegalArgumentException("ICE invalide — 15 chiffres requis");
        }
    }
}
