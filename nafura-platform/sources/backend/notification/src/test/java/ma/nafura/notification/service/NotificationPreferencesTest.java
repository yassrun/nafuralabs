package ma.nafura.platform.collaboration.notification.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ma.nafura.platform.framework.record.DeclaredNotifications.Event;

class NotificationPreferencesTest {

    private static final Event APPROVED = new Event("demo.request.approved", "Approuvée", "Approuvée : {subject}", Set.of("in_app", "email"), false);
    private static final Event TO_APPROVE = new Event("platform.approval.requested", "À approuver", "{title}", Set.of("in_app", "email"), true);

    @Test
    void theManifestGivesTheDefaults() {
        assertEquals(Set.of("in_app", "email"), NotificationPreferences.organisation(APPROVED, Map.of()));
    }

    @Test
    void theOrganisationSwitchesOffOrAddsAChannel() {
        Map<String, Boolean> org = Map.of("demo.request.approved|email", false, "demo.request.approved|sms", true);
        assertEquals(Set.of("in_app", "sms"), NotificationPreferences.organisation(APPROVED, org));
    }

    @Test
    void theUserOnlySwitchesOffWhatTheOrganisationKeeps() {
        Set<String> org = Set.of("in_app");
        Map<String, Boolean> mine = Map.of("demo.request.approved|email", true, "demo.request.approved|in_app", false);
        assertEquals(Set.of(), NotificationPreferences.user(APPROVED, org, mine));
        assertEquals(Set.of("in_app"), NotificationPreferences.user(APPROVED, org, Map.of("demo.request.approved|email", true)));
    }

    @Test
    void aMandatoryEventIgnoresTheUser() {
        Map<String, Boolean> mine = Map.of("platform.approval.requested|in_app", false, "platform.approval.requested|email", false);
        assertEquals(Set.of("in_app", "email"), NotificationPreferences.user(TO_APPROVE, Set.of("in_app", "email"), mine));
    }

    @Test
    void theTitleIsFilledFromARecordOrAMap() {
        assertEquals("Approuvée : Serveurs", NotificationRouter.fill("Approuvée : {subject}", Map.of("subject", "Serveurs")));
        assertEquals("Approuvée : Serveurs", NotificationRouter.fill("Approuvée : {subject}", new Row()));
        assertEquals("Approuvée : ", NotificationRouter.fill("Approuvée : {missing}", new Row()));
    }

    public static class Row {
        public String getSubject() { return "Serveurs"; }
    }
}
