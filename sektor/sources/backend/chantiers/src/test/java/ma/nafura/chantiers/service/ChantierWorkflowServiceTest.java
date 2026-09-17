package ma.nafura.chantiers.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.DocumentChantier;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.repository.*;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.*;
import org.springframework.web.server.ResponseStatusException;

class ChantierWorkflowServiceTest {
    private final UUID tenant = UUID.randomUUID();
    private final ObjectMapper json = new ObjectMapper().findAndRegisterModules();
    private final ChantierRepository repository = mock(ChantierRepository.class);
    private final ChantierService chantiers = mock(ChantierService.class);
    private final DocumentChantierRepository documents = mock(DocumentChantierRepository.class);
    private final ChantierBdpService bdpService = mock(ChantierBdpService.class);
    private final ChantierWorkflowService service =
            new ChantierWorkflowService(repository, chantiers, documents, bdpService, json);
    private Chantier chantier;
    private DocumentChantier pieceOs;
    @BeforeEach void setup() {
        TenantContext.setTenantId(tenant); UserContext.setUserRole("OWNER");
        chantier = Chantier.builder().id("ch-1").tenantId(tenant).label("Atlas").ville("Rabat")
                .marcheNumero("M-2026-01").status("EN_PREPARATION").active(true).build();
        when(repository.lockWorkflow("ch-1", tenant)).thenReturn(Optional.of(chantier));
        when(chantiers.getById("ch-1")).thenReturn(chantier);
        when(chantiers.bloqueursDePreparation(chantier)).thenReturn(List.of());
        when(documents.findByTenantIdAndChantierIdOrderByUploadedAtDescCreatedAtDesc(tenant, "ch-1")).thenReturn(List.of(
                DocumentChantier.builder().type("MARCHE").storageKey("cps.pdf").tags("[\"CPS\"]").build(),
                DocumentChantier.builder().type("MARCHE").storageKey("bdp.pdf").tags("[\"BDP\"]").build(),
                DocumentChantier.builder().type("MARCHE").storageKey("signed-market.pdf").tags("[\"MARCHE_SIGNE\"]").build()));
        when(bdpService.lire("ch-1")).thenReturn(bdpChiffre());
        pieceOs = new DocumentChantier();
        pieceOs.setId("os-1"); pieceOs.setChantierId("ch-1");
        when(documents.findByIdAndTenantId("os-1", tenant)).thenReturn(Optional.of(pieceOs));
    }
    @AfterEach void clear() { TenantContext.clear(); UserContext.clear(); }
    private ChantierWorkflowService.View act(String action, Map<String,Object> fields) {
        Map<String,Object> m = new HashMap<>(fields); m.put("action", action); m.put("revision", chantier.getWorkflowRevision());
        return service.execute("ch-1", json.convertValue(m, ChantierWorkflowService.Command.class));
    }
    /** Le BDP chiffré du chantier : une ligne vendue, chiffrée, sans origine d'étude. */
    private static ChantierBdpService.Bdp bdpChiffre() {
        return new ChantierBdpService.Bdp(List.of(new ChantierBdpService.Ligne(
                "poste-1", "lot-1", "01", "Béton armé", "m3", NatureLigne.VENDU,
                new BigDecimal("10"), new BigDecimal("100"), new BigDecimal("1000"))), List.of());
    }
    private static ChantierBdpService.Bdp bdpSansPrix() {
        return new ChantierBdpService.Bdp(List.of(new ChantierBdpService.Ligne(
                "poste-1", "lot-1", "01", "Béton armé", "m3", NatureLigne.VENDU,
                new BigDecimal("10"), null, null)), List.of(ChantierBdpService.MANQUE_PRIX));
    }
    private void validerBdpPuisPreparation() { act("VALIDATE_BDP", Map.of()); act("VALIDATE_PREPARATION", Map.of()); }
    private Map<String,Object> os(String reference, LocalDate effet) {
        return Map.of("reference", reference, "date", effet.toString(), "documentId", "os-1");
    }
    @Test void partialPreparationDoesNotRequireTeamOrDates() {
        when(chantiers.bloqueursDePreparation(chantier)).thenReturn(List.of("responsables", "dates_prevues"));
        var v = act("SAVE_PREPARATION", Map.of("label", "Nouveau nom"));
        assertEquals("EN_PREPARATION", v.chantier().getStatus()); assertEquals(1, v.revision());
        assertTrue(v.blockers().contains("responsables"));
    }
    @Test void cadrageRetainsDelayWithoutErasingOtherFields() {
        act("SAVE_PREPARATION", Map.of("label", "Atlas", "dureeMois", 8, "marcheNumero", "M-2026-09"));
        assertEquals(8, chantier.getDureeMois());
        assertEquals("M-2026-09", chantier.getMarcheNumero());
        assertEquals("Rabat", chantier.getVille());
        assertEquals("Atlas", chantier.getLabel());
        assertThrows(ResponseStatusException.class, () -> act("SAVE_PREPARATION", Map.of("label", "Atlas", "dureeMois", 0)));
    }
    @Test void cadragePersistsTypeDescriptionAndCoordinates() {
        act("SAVE_PREPARATION", Map.of(
                "label", "Atlas",
                "description", "Immeuble R+5",
                "chantierType", "tp",
                "adresse", "Avenue Mohammed V",
                "ville", "Rabat",
                "latitude", 34.0209,
                "longitude", -6.8416));
        assertEquals("Immeuble R+5", chantier.getDescription());
        assertEquals("TP", chantier.getChantierType());
        assertEquals("Avenue Mohammed V", chantier.getAdresse());
        assertEquals(0, chantier.getLatitude().compareTo(new BigDecimal("34.0209")));
        assertEquals(0, chantier.getLongitude().compareTo(new BigDecimal("-6.8416")));
    }
    @Test void bdpMustBeCompleteAndVerifiedBeforePreparation() {
        when(bdpService.lire("ch-1")).thenReturn(bdpSansPrix());
        assertTrue(service.get("ch-1").blockers().contains("bdp_chiffre"));
        var ex = assertThrows(ResponseStatusException.class, () -> act("VALIDATE_BDP", Map.of()));
        assertTrue(ex.getReason().contains(ChantierBdpService.MANQUE_PRIX));
        verify(repository, never()).save(any());
        when(bdpService.lire("ch-1")).thenReturn(bdpChiffre());
        act("VALIDATE_BDP", Map.of());
        assertFalse(service.get("ch-1").blockers().contains("bdp_chiffre"));
    }
    @Test void aChangedBdpMustBeVerifiedAgain() {
        act("VALIDATE_BDP", Map.of());
        when(bdpService.lire("ch-1")).thenReturn(new ChantierBdpService.Bdp(List.of(new ChantierBdpService.Ligne(
                "poste-1", "lot-1", "01", "Béton armé", "m3", NatureLigne.VENDU,
                new BigDecimal("12"), new BigDecimal("100"), new BigDecimal("1200"))), List.of()));
        assertTrue(service.get("ch-1").blockers().contains("bdp_chiffre"));
        act("VALIDATE_BDP", Map.of());
        assertFalse(service.get("ch-1").blockers().contains("bdp_chiffre"));
    }
    @Test void studyingAStudyNeverValidatesTheBdp() {
        var v = service.get("ch-1");
        assertNull(v.data().bdp);
        assertTrue(v.blockers().contains("bdp_chiffre"));
    }
    @Test void validationChecksReadiness() {
        when(chantiers.bloqueursDePreparation(chantier)).thenReturn(List.of("responsables"));
        assertThrows(ResponseStatusException.class, () -> act("VALIDATE_PREPARATION", Map.of()));
        verify(repository, never()).save(any());
    }
    @Test void missingSignedDocumentsBlockValidationButNotDraftSave() {
        when(documents.findByTenantIdAndChantierIdOrderByUploadedAtDescCreatedAtDesc(tenant, "ch-1")).thenReturn(List.of());
        var draft = act("SAVE_PREPARATION", Map.of("label", "Sans étude", "ville", "Rabat"));
        assertTrue(draft.blockers().containsAll(List.of("marche_signe", "cps", "bdp")));
        assertThrows(ResponseStatusException.class, () -> act("VALIDATE_PREPARATION", Map.of()));
        assertEquals("EN_PREPARATION", chantier.getStatus());
    }
    @Test void unsignedOrMissingFilesDoNotSatisfyDocumentSlots() {
        when(documents.findByTenantIdAndChantierIdOrderByUploadedAtDescCreatedAtDesc(tenant, "ch-1")).thenReturn(List.of(
                DocumentChantier.builder().type("MARCHE").storageKey("unsigned.pdf").tags("[]").build(),
                DocumentChantier.builder().type("MARCHE").tags("[\"CPS\"]").build()));
        assertTrue(service.get("ch-1").blockers().containsAll(List.of("marche_signe", "bdp", "cps")));
    }
    @Test void aMissingMarketReferenceBlocksValidation() {
        chantier.setMarcheNumero(null);
        assertTrue(service.get("ch-1").blockers().contains("marche_reference"));
    }
    @Test void studyIsNotRequiredForReadiness() {
        assertNull(chantier.getDossierEtudeId());
        validerBdpPuisPreparation();
        assertEquals("PRET_A_DEMARRER", chantier.getStatus());
    }
    @Test void manualPreparationCanDefineInitialCostWithoutStudy() {
        act("SAVE_PREPARATION", Map.of("label", "Sans étude", "montant", 25000));
        assertEquals(0, chantier.getDebourseInitialHt().compareTo(new BigDecimal("25000")));
        assertThrows(ResponseStatusException.class, () -> act("SAVE_PREPARATION", Map.of("label", "Sans étude", "montant", -1)));
    }
    @Test void convertedInitialCostRemainsImmutable() {
        chantier.setDossierEtudeId(UUID.randomUUID()); chantier.setDebourseInitialHt(new BigDecimal("100"));
        assertThrows(ResponseStatusException.class, () -> act("SAVE_PREPARATION", Map.of("label", "Atlas", "montant", 25000)));
        assertEquals(0, chantier.getDebourseInitialHt().compareTo(new BigDecimal("100")));
    }
    @Test void futureOsIsSavedWithoutStartingAndCannotStartEarly() {
        validerBdpPuisPreparation();
        act("SAVE_OS", os("OS-01", LocalDate.now().plusDays(2)));
        assertEquals("PRET_A_DEMARRER", chantier.getStatus());
        assertThrows(ResponseStatusException.class, () -> act("START", Map.of()));
        assertEquals("PRET_A_DEMARRER", chantier.getStatus());
    }
    @Test void osRequiresItsDocument() {
        validerBdpPuisPreparation();
        var ex = assertThrows(ResponseStatusException.class,
                () -> act("SAVE_OS", Map.of("reference", "OS-01", "date", LocalDate.now().toString())));
        assertEquals(422, ex.getStatusCode().value());
        assertNull(chantier.getOsReference());
    }
    @Test void startRechecksPreparationAndRecordsOs() {
        validerBdpPuisPreparation(); act("SAVE_OS", os("OS-01", LocalDate.now()));
        when(chantiers.bloqueursDePreparation(chantier)).thenReturn(List.of("responsables"));
        assertThrows(ResponseStatusException.class, () -> act("START", Map.of()));
        when(chantiers.bloqueursDePreparation(chantier)).thenReturn(List.of());
        var v = act("START", Map.of()); assertEquals("EN_COURS", chantier.getStatus());
        assertEquals("OS-01", v.data().history.getLast().reference());
    }
    @Test void staleRevisionCannotOverwrite() {
        chantier.setWorkflowRevision(2);
        var cmd = json.convertValue(Map.of("revision", 1, "action", "CANCEL", "motif", "Abandon"), ChantierWorkflowService.Command.class);
        var ex = assertThrows(ResponseStatusException.class, () -> service.execute("ch-1", cmd));
        assertEquals(409, ex.getStatusCode().value()); verify(repository, never()).save(any());
    }
    @Test void documentFromAnotherChantierCannotSupportReception() {
        chantier.setStatus("EN_ATTENTE_RECEPTION_PROVISOIRE");
        var doc = new DocumentChantier(); doc.setId("doc-1"); doc.setChantierId("autre");
        when(documents.findByIdAndTenantId("doc-1", tenant)).thenReturn(Optional.of(doc));
        assertThrows(ResponseStatusException.class, () -> act("PROVISIONAL_RECEPTION", Map.of("reference", "PV", "date", LocalDate.now().toString(), "documentId", "doc-1", "sansReserves", true)));
    }
    @Test void reservationsNeedVerificationAndDoNotTriggerFinalReception() {
        chantier.setStatus("RECEPTIONNE_PROVISOIRE");
        var v = act("ADD_RESERVE", Map.of("label", "Fissure", "responsable", "Chef", "echeance", LocalDate.now().plusDays(5).toString()));
        String id = v.data().reserves.getFirst().id();
        assertThrows(ResponseStatusException.class, () -> act("UPDATE_RESERVE", Map.of("itemId", id, "status", "LEVEE", "motif", "Corrigé")));
        act("UPDATE_RESERVE", Map.of("itemId", id, "status", "A_VERIFIER", "motif", "Correction réalisée"));
        act("UPDATE_RESERVE", Map.of("itemId", id, "status", "LEVEE", "motif", "Vérification sur site"));
        assertEquals("RECEPTIONNE_PROVISOIRE", chantier.getStatus());
    }
    @Test void closureKeepsGuaranteesEditable() {
        chantier.setStatus("RECEPTIONNE_DEFINITIF");
        act("ADD_GARANTIE", Map.of("label", "Caution", "kind", "CAUTION", "responsable", "Banque", "date", LocalDate.now().toString(), "echeance", LocalDate.now().plusYears(1).toString(), "motif", "Mainlevée sur justificatif"));
        var v = act("CLOSE", Map.of("motif", "Dossier administratif et financier finalisé"));
        assertEquals("CLOS", chantier.getStatus()); assertEquals(1, v.data().garanties.size());
        assertTrue(v.availableActions().contains("UPDATE_GARANTIE"));
    }
    /** Un brouillon reste au cadrage : rien ne se démarre depuis ce statut. */
    @Test void draftCannotStartNorValidate() {
        chantier.setStatus("BROUILLON");
        var v = service.get("ch-1");
        assertFalse(v.availableActions().contains("START"));
        assertFalse(v.availableActions().contains("SAVE_OS"));
        var ex = assertThrows(ResponseStatusException.class, () -> act("START", Map.of()));
        assertTrue(ex.getReason().contains("Action indisponible"));
    }
    @Test void readOnlyUserHasNoActionsAndCannotWrite() {
        UserContext.clear();
        assertTrue(service.get("ch-1").availableActions().isEmpty());
        assertThrows(ResponseStatusException.class, () -> act("CANCEL", Map.of("motif", "Abandon")));
    }
    @Test void fullReceptionFlowRequiresPvAndLeavesExplicitFinalDecision() {
        chantier.setStatus("EN_COURS");
        act("FINISH_WORK", Map.of("date", LocalDate.now().toString()));
        var doc = new DocumentChantier(); doc.setId("pv"); doc.setChantierId("ch-1");
        when(documents.findByIdAndTenantId("pv", tenant)).thenReturn(Optional.of(doc));
        act("PROVISIONAL_RECEPTION", Map.of("reference", "RP-1", "date", LocalDate.now().toString(), "documentId", "pv", "sansReserves", true));
        assertEquals("RECEPTIONNE_PROVISOIRE", chantier.getStatus());
        act("FINAL_RECEPTION", Map.of("reference", "RD-1", "date", LocalDate.now().toString(), "documentId", "pv"));
        assertEquals("RECEPTIONNE_DEFINITIF", chantier.getStatus());
    }
    @Test void finalReceptionRefusesAnOpenReserveEvenWithPv() {
        chantier.setStatus("RECEPTIONNE_PROVISOIRE");
        var doc = new DocumentChantier(); doc.setId("pv"); doc.setChantierId("ch-1");
        when(documents.findByIdAndTenantId("pv", tenant)).thenReturn(Optional.of(doc));
        act("ADD_RESERVE", Map.of("label", "Fissure", "responsable", "Chef", "echeance", LocalDate.now().toString()));
        var ex = assertThrows(ResponseStatusException.class, () -> act("FINAL_RECEPTION", Map.of("reference", "RD", "date", LocalDate.now().toString(), "documentId", "pv")));
        assertTrue(ex.getReason().contains("réserves")); assertEquals("RECEPTIONNE_PROVISOIRE", chantier.getStatus());
    }
    @Test void invalidGuaranteeKindReturnsValidationFailure() {
        var ex = assertThrows(ResponseStatusException.class, () -> act("ADD_GARANTIE", Map.of("label", "Garantie", "responsable", "Banque")));
        assertEquals(422, ex.getStatusCode().value());
    }
}
