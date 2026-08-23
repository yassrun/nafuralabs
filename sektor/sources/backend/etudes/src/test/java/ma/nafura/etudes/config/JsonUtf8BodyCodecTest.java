package ma.nafura.etudes.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class JsonUtf8BodyCodecTest {

    @Test
    void utf8BodyIsLeftUntouched() {
        byte[] utf8 = "{\"libelle\":\"Béton\"}".getBytes(StandardCharsets.UTF_8);
        assertThat(JsonUtf8BodyCodec.ensureUtf8(utf8)).isEqualTo(utf8);
    }

    @Test
    void windows1252AccentedLibelleBecomesUtf8() {
        byte[] latin = "{\"libelle\":\"Béton\"}".getBytes(JsonUtf8BodyCodec.WINDOWS_1252);
        byte[] out = JsonUtf8BodyCodec.ensureUtf8(latin);
        assertThat(new String(out, StandardCharsets.UTF_8)).isEqualTo("{\"libelle\":\"Béton\"}");
    }

    @Test
    void windows1252FrenchLettersBecomeUtf8() {
        byte[] latin = "{\"libelle\":\"été déjà façadé à çà\"}".getBytes(JsonUtf8BodyCodec.WINDOWS_1252);
        byte[] out = JsonUtf8BodyCodec.ensureUtf8(latin);
        assertThat(new String(out, StandardCharsets.UTF_8)).isEqualTo("{\"libelle\":\"été déjà façadé à çà\"}");
    }
}
