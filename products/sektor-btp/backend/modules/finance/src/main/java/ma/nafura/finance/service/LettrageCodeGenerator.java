package ma.nafura.finance.service;

public final class LettrageCodeGenerator {

    private LettrageCodeGenerator() {}

    public static String nextCode(String previous) {
        if (previous == null || previous.isBlank()) {
            return "AAA";
        }
        char[] chars = previous.trim().toUpperCase().toCharArray();
        if (chars.length != 3) {
            return "AAA";
        }
        for (int i = 2; i >= 0; i--) {
            if (chars[i] < 'Z') {
                chars[i]++;
                return new String(chars);
            }
            chars[i] = 'A';
        }
        return "AAA";
    }
}
