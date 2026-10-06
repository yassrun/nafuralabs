package ma.nafura.platform.collaboration.audit;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class AuditPayloadBuilderTest {

    @Test
    void changesSkipsUnchangedFields() {
        Sample before = new Sample("INV-1", "DRAFT", 10);
        Sample after = new Sample("INV-1", "ISSUED", 10);

        Map<String, Object> payload = AuditPayloadBuilder.changes(before, after, "numero", "status", "amount");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changes = (List<Map<String, Object>>) payload.get("changes");
        assertThat(changes).hasSize(1);
        assertThat(changes.get(0)).containsEntry("field", "status")
                .containsEntry("from", "DRAFT")
                .containsEntry("to", "ISSUED");
    }

    @Test
    void createdSnapshotsTrackedFields() {
        Sample entity = new Sample("INV-1", "DRAFT", 10);
        Map<String, Object> payload = AuditPayloadBuilder.created(entity, "numero", "status");

        @SuppressWarnings("unchecked")
        Map<String, Object> snapshot = (Map<String, Object>) payload.get("snapshot");
        assertThat(snapshot).containsEntry("numero", "INV-1").containsEntry("status", "DRAFT");
    }

    @Test
    void emptyChangesIsDetected() {
        Map<String, Object> payload = AuditPayloadBuilder.changes(
                new Sample("A", "X", 1), new Sample("A", "X", 1), "numero", "status");
        assertThat(AuditableCapture.isEmptyChanges(payload)).isTrue();
    }

    @Test
    void detailsPreferFirstChangedField() {
        Sample entity = new Sample("INV-1", "ISSUED", 10);
        Map<String, Object> payload = AuditPayloadBuilder.changes(
                new Sample("INV-1", "DRAFT", 10), entity, "numero", "status");
        String details = AuditDetails.updated("facture-client", entity, Map.of(), payload);
        assertThat(details).isEqualTo("Updated facture-client status from DRAFT to ISSUED");
    }

    @Test
    void statusOnlyChangeIsDetected() {
        Map<String, Object> payload = AuditPayloadBuilder.changes(
                new Sample("INV-1", "DRAFT", 10), new Sample("INV-1", "ISSUED", 10), "numero", "status", "amount");
        assertThat(AuditableCapture.isStatusOnlyChange(payload)).isTrue();
        assertThat(AuditDetails.statusChanged("demo.purchase-request", payload))
                .isEqualTo("Status of demo.purchase-request from DRAFT to ISSUED");
    }

    @Test
    void multiFieldChangeIsNotStatusOnly() {
        Map<String, Object> payload = AuditPayloadBuilder.changes(
                new Sample("INV-1", "DRAFT", 10), new Sample("INV-2", "ISSUED", 10), "numero", "status");
        assertThat(AuditableCapture.isStatusOnlyChange(payload)).isFalse();
    }

    @Test
    void idsAcceptUuidAndString() {
        assertThat(AuditableIds.of(new Sample("INV-1", "DRAFT", 1)))
                .isEqualTo("11111111-1111-1111-1111-111111111111");
        UUID uuid = UUID.fromString("11111111-1111-1111-1111-111111111111");
        assertThat(AuditableIds.ofUuid(uuid)).isEqualTo(uuid.toString());
        assertThat(AuditableIds.ofUuid(null)).isNull();
    }

    @Test
    void jsonSafeConvertsTemporalAndUuid() {
        assertThat(AuditPayloadBuilder.jsonSafe(UUID.fromString("11111111-1111-1111-1111-111111111111")))
                .isEqualTo("11111111-1111-1111-1111-111111111111");
        assertThat(AuditPayloadBuilder.jsonSafe(java.time.LocalDate.of(2026, 11, 1)))
                .isEqualTo("2026-11-01");
    }

    static final class Sample {
        private final UUID id = UUID.fromString("11111111-1111-1111-1111-111111111111");
        private final String numero;
        private final String status;
        private final int amount;

        Sample(String numero, String status, int amount) {
            this.numero = numero;
            this.status = status;
            this.amount = amount;
        }

        public UUID getId() {
            return id;
        }

        public String getNumero() {
            return numero;
        }

        public String getStatus() {
            return status;
        }

        public int getAmount() {
            return amount;
        }
    }
}
