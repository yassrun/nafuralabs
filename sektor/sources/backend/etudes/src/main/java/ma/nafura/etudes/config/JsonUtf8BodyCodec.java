package ma.nafura.etudes.config;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

/**
 * JSON bodies are UTF-8 (RFC 8259). Windows clients (curl/cmd, some proxies) still
 * send ISO-8859-1 / windows-1252, which Jackson rejects as {@code Invalid UTF-8}
 * and the global handler maps to 500 INTERNAL_ERROR.
 */
public final class JsonUtf8BodyCodec {

    static final Charset WINDOWS_1252 = Charset.forName("windows-1252");

    private JsonUtf8BodyCodec() {}

    public static byte[] ensureUtf8(byte[] raw) {
        if (raw == null || raw.length == 0) {
            return raw == null ? new byte[0] : raw;
        }
        CharsetDecoder utf8 = StandardCharsets.UTF_8
                .newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT);
        try {
            utf8.decode(ByteBuffer.wrap(raw));
            return raw;
        } catch (CharacterCodingException ex) {
            return new String(raw, WINDOWS_1252).getBytes(StandardCharsets.UTF_8);
        }
    }
}
