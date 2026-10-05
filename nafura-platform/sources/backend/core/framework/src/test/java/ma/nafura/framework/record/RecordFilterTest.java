package ma.nafura.platform.framework.record;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import ma.nafura.platform.framework.domain.TenantEntity;

class RecordFilterTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    static class Group extends TenantEntity {
        private String code;
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
    }

    static class Line extends TenantEntity {
        private String code;
        private UUID groupId;
        private BigDecimal amount;
        private LocalDate due;
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public UUID getGroupId() { return groupId; }
        public void setGroupId(UUID groupId) { this.groupId = groupId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public LocalDate getDue() { return due; }
        public void setDue(LocalDate due) { this.due = due; }
    }

    private static final RecordDescriptor GROUP = descriptor("""
            { "entity": "t.group", "search": ["code", "lines.code"], "properties": {
              "code": { "label": "Code", "filterable": true },
              "lines": { "label": "Lignes", "type": "relations", "target": "t.line", "via": "groupId", "filterable": true } } }""", Group.class);

    private static final RecordDescriptor LINE = descriptor("""
            { "entity": "t.line", "properties": {
              "code": { "label": "Code", "filterable": true },
              "groupId": { "label": "Groupe", "type": "relation", "target": "t.group", "filterable": true },
              "amount": { "label": "Montant", "type": "money", "currency": "MAD", "filterable": true },
              "due": { "label": "Échéance", "filterable": true } } }""", Line.class);

    @Test
    void theDescriptorInfersTypesAndKeepsRelations() {
        assertEquals("date", LINE.property("due").type());
        assertEquals("MAD", LINE.property("amount").currency());
        assertEquals("groupId", GROUP.property("lines").via());
        assertEquals(java.util.List.of("code", "lines.code"), GROUP.search());
    }

    @Test
    void aWrongDeclarationFailsAtStartup() {
        assertStartup("{ \"entity\": \"t\", \"properties\": { \"nope\": { \"label\": \"X\" } } }", Line.class, "no such field");
        assertStartup("{ \"entity\": \"t\", \"properties\": { \"lines\": { \"label\": \"X\", \"type\": \"relations\", \"target\": \"t.line\" } } }", Group.class, "via");
        assertStartup("{ \"entity\": \"t\", \"properties\": { \"code\": { \"label\": \"X\", \"currency\": \"MAD\" } } }", Line.class, "currency");
        assertStartup("{ \"entity\": \"t\", \"search\": [\"amount\"], \"properties\": {} }", Line.class, "search amount");
    }

    @Test
    void operatorsFollowTheType() {
        assertNotNull(compile(LINE, "{\"amount\":{\"between\":[10,20]}}", Set.of("t.group")));
        assertNotNull(compile(LINE, "{\"due\":{\"before\":\"today+7d\"}}", Set.of("t.group")));
        assertBad(LINE, "{\"amount\":{\"contains\":\"1\"}}");
        assertBad(LINE, "{\"code\":{\"gt\":\"1\"}}");
        assertBad(LINE, "{\"unknown\":{\"is\":\"1\"}}");
        assertBad(LINE, "{\"and\":[{\"or\":[{\"and\":[{\"code\":{\"is\":\"1\"}}]}]}]}");
    }

    @Test
    void aRelationIsCrossedOnceAndNeedsTheTargetsReadPermission() {
        assertNotNull(compile(GROUP, "{\"lines\":{\"any\":{\"amount\":{\"gt\":100}}}}", Set.of("t.line")));
        assertNotNull(compile(GROUP, "{\"lines\":{\"empty\":true}}", Set.of("t.line")));
        assertNotNull(compile(LINE, "{\"groupId\":{\"where\":{\"code\":{\"is\":\"G1\"}}}}", Set.of("t.group")));
        assertBad(GROUP, "{\"lines\":{\"any\":{\"groupId\":{\"where\":{\"code\":{\"is\":\"G1\"}}}}}}");
        assertBad(GROUP, "{\"lines\":{\"is\":\"x\"}}");

        ResponseStatusException forbidden = assertThrows(ResponseStatusException.class,
                () -> compile(GROUP, "{\"lines\":{\"any\":{\"amount\":{\"gt\":100}}}}", Set.of()));
        assertEquals(HttpStatus.FORBIDDEN, forbidden.getStatusCode());
    }

    @Test
    void relativeDatesAreResolvedFromTheOrganisationsDay() {
        LocalDate today = LocalDate.of(2026, 10, 4);
        assertEquals(LocalDate.of(2026, 10, 11), RecordFilter.resolveDate("today+7d", today));
        assertEquals(LocalDate.of(2026, 9, 4), RecordFilter.resolveDate("today-30d", today));
        assertEquals(LocalDate.of(2026, 10, 1), RecordFilter.resolveDate("startOfMonth", today));
    }

    private static Object compile(RecordDescriptor descriptor, String filter, Set<String> readable) {
        Map<String, RecordCatalog.Target> targets = Map.of(
                "t.group", new RecordCatalog.Target(GROUP, "/groups", "t.group.read"),
                "t.line", new RecordCatalog.Target(LINE, "/lines", "t.line.read"));
        RecordFilter.Context context = new RecordFilter.Context(UUID.randomUUID(), UUID.randomUUID(), LocalDate.of(2026, 10, 4),
                ZoneId.of("Africa/Casablanca"), false, targets::get, readable::contains);
        return RecordFilter.compile(filter, descriptor.properties(), context);
    }

    private static void assertBad(RecordDescriptor descriptor, String filter) {
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> compile(descriptor, filter, Set.of("t.group", "t.line")));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode(), filter);
    }

    private static void assertStartup(String json, Class<?> type, String message) {
        IllegalStateException error = assertThrows(IllegalStateException.class, () -> descriptor(json, type));
        assertTrue(error.getMessage().contains(message), error.getMessage());
    }

    private static RecordDescriptor descriptor(String json, Class<?> type) {
        try {
            return RecordDescriptor.parse("test.json", JSON.readTree(json), type);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalArgumentException(e);
        }
    }
}
