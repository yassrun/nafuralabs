package ma.nafura.platform.framework.autonumber;

import java.util.Optional;
import java.util.UUID;

/**
 * SPI for generating the next value of a numbering sequence by code and tenant.
 * Implemented by the sysconfig module when numbering sequences are available.
 */
public interface NumberSequenceGenerator {

    /**
     * Generate the next number for the given sequence code in the given tenant.
     *
     * @param sequenceCode sequence code (e.g. INV, PO)
     * @param tenantId     tenant id
     * @return the next formatted number, or empty if sequence not found / not configured
     */
    Optional<String> generateNextNumber(String sequenceCode, UUID tenantId);
}
