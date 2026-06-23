package ma.nafura.platform.authorization.apikey;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class ApiKeyGenerator {

    private static final String PREFIX = "nfk_";
    private static final String ALPHANUM = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private final SecureRandom random = new SecureRandom();

    public String generatePlainKey(int randomLength) {
        StringBuilder sb = new StringBuilder(PREFIX.length() + 8 + 1 + randomLength);
        sb.append(PREFIX);

        // 8-char prefix segment
        StringBuilder prefixBuilder = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            prefixBuilder.append(randomChar());
        }
        String prefixSegment = prefixBuilder.toString();
        sb.append(prefixSegment);
        sb.append('_');

        // random tail
        for (int i = 0; i < randomLength; i++) {
            sb.append(randomChar());
        }

        return sb.toString();
    }

    public String extractPrefix(String plainKey) {
        if (plainKey == null || !plainKey.startsWith(PREFIX)) {
            return null;
        }
        String[] parts = plainKey.split("_", 3);
        if (parts.length < 3) {
            return null;
        }
        return PREFIX + parts[1];
    }

    private char randomChar() {
        return ALPHANUM.charAt(random.nextInt(ALPHANUM.length()));
    }
}

