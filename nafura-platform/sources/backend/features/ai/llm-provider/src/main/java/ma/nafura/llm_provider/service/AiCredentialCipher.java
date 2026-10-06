package ma.nafura.platform.ai.llm.service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM encryption for tenant BYOK secrets. The master key comes from ops
 * ({@code AI_CREDENTIALS_MASTER_KEY}) and is never exposed. When absent, {@link #configured()}
 * is {@code false} and the BYOK UI/API must refuse to store secrets.
 *
 * <p>Wire format: {@code base64(iv).base64(ciphertext)} — a 12-byte random IV, 128-bit auth tag.
 */
public class AiCredentialCipher {

    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;

    private final SecretKeySpec key;

    public AiCredentialCipher(String masterKey) {
        this.key = (masterKey == null || masterKey.isBlank()) ? null : derive(masterKey);
    }

    public boolean configured() {
        return key != null;
    }

    public String encrypt(String plaintext) {
        requireConfigured();
        try {
            byte[] iv = new byte[IV_BYTES];
            new SecureRandom().nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(iv) + "." + Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt AI credential", e);
        }
    }

    public String decrypt(String encoded) {
        requireConfigured();
        try {
            int dot = encoded.indexOf('.');
            if (dot < 0) {
                throw new IllegalArgumentException("Invalid credential format");
            }
            byte[] iv = Base64.getDecoder().decode(encoded.substring(0, dot));
            byte[] ciphertext = Base64.getDecoder().decode(encoded.substring(dot + 1));
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt AI credential (master key rotated?)", e);
        }
    }

    private void requireConfigured() {
        if (!configured()) {
            throw new IllegalStateException("AI credentials master key is not configured");
        }
    }

    /** Derive a fixed 32-byte key from any ops-provided passphrase. */
    private static SecretKeySpec derive(String masterKey) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(masterKey.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(digest, "AES");
        } catch (Exception e) {
            throw new IllegalStateException("Failed to derive AI credentials master key", e);
        }
    }
}
