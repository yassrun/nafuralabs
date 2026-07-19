package ma.nafura.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.consultation.api.request.ConsultationCreateDto;
import ma.nafura.consultation.api.request.ImportComposantDto;
import ma.nafura.consultation.api.request.ImportNoeudDto;
import ma.nafura.consultation.api.request.ImportTreeRequest;
import ma.nafura.consultation.domain.model.Consultation;
import ma.nafura.consultation.domain.model.ConsultationComposant;
import ma.nafura.consultation.domain.model.ConsultationNoeud;
import ma.nafura.consultation.repository.ConsultationComposantRepository;
import ma.nafura.consultation.repository.ConsultationNoeudRepository;
import ma.nafura.consultation.repository.ConsultationRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ConsultationServiceTest {

    @Mock
    private ConsultationRepository consultationRepository;

    @Mock
    private ConsultationNoeudRepository noeudRepository;

    @Mock
    private ConsultationComposantRepository composantRepository;

    private ConsultationService service;

    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new ConsultationService(consultationRepository, noeudRepository, composantRepository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void create_generatesNumero_whenBlank() {
        when(consultationRepository.countByTenantId(tenantId)).thenReturn(2L);
        when(consultationRepository.existsByTenantIdAndNumero(tenantId, "CONS-0003")).thenReturn(false);
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultationCreateDto dto = new ConsultationCreateDto();
        dto.setObjet("Gros oeuvre");

        Consultation created = service.create(dto);

        assertThat(created.getNumero()).isEqualTo("CONS-0003");
        assertThat(created.getStatus()).isEqualTo(Consultation.STATUS_BROUILLON);
        assertThat(created.getObjet()).isEqualTo("Gros oeuvre");
    }

    @Test
    void importTree_persistsNodesAndComposants_andMovesToAValider() {
        UUID consultationId = UUID.randomUUID();
        Consultation consultation = Consultation.builder()
                .id(consultationId)
                .tenantId(tenantId)
                .numero("CONS-0001")
                .objet("Test")
                .status(Consultation.STATUS_BROUILLON)
                .build();
        when(consultationRepository.findByIdAndTenantId(consultationId, tenantId))
                .thenReturn(java.util.Optional.of(consultation));
        when(consultationRepository.save(any(Consultation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(noeudRepository.save(any(ConsultationNoeud.class))).thenAnswer(inv -> {
            ConsultationNoeud n = inv.getArgument(0);
            if (n.getId() == null) {
                n.setId(UUID.randomUUID());
            }
            return n;
        });
        when(composantRepository.save(any(ConsultationComposant.class))).thenAnswer(inv -> inv.getArgument(0));
        when(noeudRepository.findByTenantIdAndConsultationIdOrderByOrdreAsc(tenantId, consultationId))
                .thenReturn(new ArrayList<>());

        service.importTree(consultationId, buildTree());

        assertThat(consultation.getStatus()).isEqualTo(Consultation.STATUS_A_VALIDER);
        // 1 LOT + 1 POSTE persisted
        org.mockito.Mockito.verify(noeudRepository, org.mockito.Mockito.times(2)).save(any());
        // 1 composant on the DECOMPOSE poste
        org.mockito.Mockito.verify(composantRepository, org.mockito.Mockito.times(1)).save(any());
    }

    private ImportTreeRequest buildTree() {
        ImportComposantDto composant = new ImportComposantDto();
        composant.setType("MATERIAU");
        composant.setDesignation("Ciment CPJ 45");

        ImportNoeudDto poste = new ImportNoeudDto();
        poste.setType("POSTE");
        poste.setLibelle("Beton dose 350");
        poste.setMode("DECOMPOSE");
        poste.setComposants(List.of(composant));

        ImportNoeudDto lot = new ImportNoeudDto();
        lot.setType("LOT");
        lot.setLibelle("Gros oeuvre");
        lot.setEnfants(new ArrayList<>(List.of(poste)));

        ImportTreeRequest request = new ImportTreeRequest();
        request.setArbre(new ArrayList<>(List.of(lot)));
        return request;
    }
}
