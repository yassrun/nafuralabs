package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.dto.DossierAgentContextDto;
import ma.nafura.etudes.api.dto.completude.CompletudeEtude;
import ma.nafura.etudes.domain.dossier.DossierAgentSuggestion;
import ma.nafura.etudes.domain.dossier.DossierAgentSuggestionEtat;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.repository.DossierAgentSuggestionRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DossierAgentServiceTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID DOSSIER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private DossierEtudeRepository dossierRepository;
    @Mock
    private DossierDocumentRepository documentRepository;
    @Mock
    private DossierAgentSuggestionRepository suggestionRepository;
    @Mock
    private CompletudeEtudeService completudeEtudeService;
    @Mock
    private DossierEtudeService dossierEtudeService;
    @Mock
    private RattrapageComposantService rattrapageService;

    private DossierAgentService service;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new DossierAgentService(
                dossierRepository,
                documentRepository,
                suggestionRepository,
                completudeEtudeService,
                dossierEtudeService,
                rattrapageService,
                objectMapper);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void contexte_nomme_le_dossier_sans_chat_generique() {
        DossierEtude dossier = DossierEtude.builder()
                .id(DOSSIER_ID)
                .tenantId(TENANT)
                .numero("DE-0103")
                .objet("Ecole Al Amal")
                .build();
        when(dossierRepository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(documentRepository.findByTenantIdAndDossierEtudeIdOrderByOrdreAsc(TENANT, DOSSIER_ID))
                .thenReturn(List.of());
        when(completudeEtudeService.evaluer(dossier))
                .thenReturn(CompletudeEtude.builder()
                        .dossierId(DOSSIER_ID)
                        .controles(List.of())
                        .build());
        when(suggestionRepository.findByTenantIdAndDossierEtudeIdOrderByCreatedAtDesc(TENANT, DOSSIER_ID))
                .thenReturn(List.of());

        DossierAgentContextDto ctx = service.contexte(DOSSIER_ID);

        assertThat(ctx.getNumero()).isEqualTo("DE-0103");
        assertThat(ctx.getObjet()).isEqualTo("Ecole Al Amal");
        assertThat(ctx.isChatGenerique()).isFalse();
    }

    @Test
    void accepter_persiste_etat_acceptee() {
        UUID suggestionId = UUID.randomUUID();
        DossierEtude dossier = DossierEtude.builder()
                .id(DOSSIER_ID)
                .tenantId(TENANT)
                .numero("DE-TEST")
                .objet("Test")
                .build();
        DossierAgentSuggestion row = DossierAgentSuggestion.builder()
                .id(suggestionId)
                .tenantId(TENANT)
                .dossierEtudeId(DOSSIER_ID)
                .actionType(ma.nafura.etudes.domain.dossier.DossierAgentActionType.CHIFFRAGE)
                .libelle("Suggestion test")
                .fingerprint("abc")
                .etat(DossierAgentSuggestionEtat.EN_ATTENTE)
                .build();
        when(suggestionRepository.findByIdAndTenantIdAndDossierEtudeId(suggestionId, TENANT, DOSSIER_ID))
                .thenReturn(Optional.of(row));
        when(suggestionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var dto = service.accepter(DOSSIER_ID, suggestionId);

        assertThat(dto.getEtat()).isEqualTo("ACCEPTEE");
        assertThat(row.getEtat()).isEqualTo(DossierAgentSuggestionEtat.ACCEPTEE);
    }

    @Test
    void proposerChiffrage_retombe_sur_ok_si_aucun_controle() {
        DossierEtude dossier = DossierEtude.builder()
                .id(DOSSIER_ID)
                .tenantId(TENANT)
                .numero("DE-X")
                .objet("Obj")
                .build();
        when(dossierRepository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(completudeEtudeService.evaluer(dossier))
                .thenReturn(CompletudeEtude.builder()
                        .dossierId(DOSSIER_ID)
                        .controles(List.of())
                        .build());
        when(suggestionRepository.findByTenantIdAndDossierEtudeIdAndFingerprint(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(suggestionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var out = service.proposerChiffrage(DOSSIER_ID);

        assertThat(out).hasSize(1);
        assertThat(out.get(0).getLibelle()).contains("Aucun écart");
    }
}
