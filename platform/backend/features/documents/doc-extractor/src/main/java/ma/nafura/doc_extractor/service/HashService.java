package ma.nafura.platform.documents.docextractor.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.security.MessageDigest;
import java.util.Formatter;

@Slf4j
@Service
public class HashService {

    /**
     * Compute SHA-256 hash of bytes.
     */
    public String sha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            return bytesToHex(hash);
        } catch (Exception e) {
            log.error("Failed to compute SHA-256", e);
            throw new RuntimeException("Hash computation failed", e);
        }
    }

    /**
     * Compute a simple dHash (difference hash) as a perceptual hash.
     * Best-effort: returns null if image cannot be decoded.
     */
    public Long phash(byte[] bytes) {
        try (ByteArrayInputStream bais = new ByteArrayInputStream(bytes)) {
            BufferedImage image = ImageIO.read(bais);
            if (image == null) {
                return null;
            }
            return computeDHash(image);
        } catch (Exception e) {
            log.debug("Could not compute pHash (maybe not an image or corrupt): {}", e.getMessage());
            return null;
        }
    }

    /**
     * Compute Hamming distance between two 64-bit hashes.
     */
    public int hammingDistance(long a, long b) {
        return Long.bitCount(a ^ b);
    }

    private String bytesToHex(byte[] bytes) {
        try (Formatter formatter = new Formatter()) {
            for (byte b : bytes) {
                formatter.format("%02x", b);
            }
            return formatter.toString();
        }
    }

    /**
     * dHash implementation:
     * 1. Resize to 9x8 gray scale.
     * 2. Compare adjacent pixels in each row (8 comparisons per row * 8 rows = 64 bits).
     */
    private long computeDHash(BufferedImage image) {
        int width = 9;
        int height = 8;
        
        BufferedImage resized = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = resized.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(image, 0, 0, width, height, null);
        g.dispose();

        long hash = 0;
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width - 1; x++) {
                int left = resized.getRaster().getSample(x, y, 0);
                int right = resized.getRaster().getSample(x + 1, y, 0);
                if (left > right) {
                    hash |= (1L << (y * 8 + x));
                }
            }
        }
        return hash;
    }
}

