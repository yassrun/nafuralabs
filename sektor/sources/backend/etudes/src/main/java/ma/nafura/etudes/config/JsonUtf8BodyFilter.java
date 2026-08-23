package ma.nafura.etudes.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Rewrites DPGF JSON bodies to UTF-8 when the client sent windows-1252 / ISO-8859-1.
 * SEKTOR-116 — POST {@code /api/v1/etudes/dpgf/{id}/noeuds} libellé {@code Béton}.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class JsonUtf8BodyFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null || !path.startsWith("/api/v1/etudes/dpgf")) {
            return true;
        }
        String contentType = request.getContentType();
        if (contentType == null) {
            return true;
        }
        return !contentType.toLowerCase().contains(MediaType.APPLICATION_JSON_VALUE);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        byte[] raw = request.getInputStream().readAllBytes();
        byte[] utf8 = JsonUtf8BodyCodec.ensureUtf8(raw);
        filterChain.doFilter(new Utf8BodyRequest(request, utf8), response);
    }

    static final class Utf8BodyRequest extends HttpServletRequestWrapper {
        private final byte[] body;

        Utf8BodyRequest(HttpServletRequest request, byte[] body) {
            super(request);
            this.body = body;
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream in = new ByteArrayInputStream(body);
            return new ServletInputStream() {
                @Override
                public int read() {
                    return in.read();
                }

                @Override
                public boolean isFinished() {
                    return in.available() == 0;
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setReadListener(ReadListener listener) {
                    // no-op: body is fully buffered
                }
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
        }

        @Override
        public int getContentLength() {
            return body.length;
        }

        @Override
        public long getContentLengthLong() {
            return body.length;
        }

        @Override
        public String getCharacterEncoding() {
            return StandardCharsets.UTF_8.name();
        }

        @Override
        public String getContentType() {
            String ct = super.getContentType();
            if (ct == null || ct.isBlank()) {
                return MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8";
            }
            String lower = ct.toLowerCase();
            if (lower.contains("charset=")) {
                return ct.replaceAll("(?i)charset=[^;]+", "charset=UTF-8");
            }
            return ct + ";charset=UTF-8";
        }
    }
}
