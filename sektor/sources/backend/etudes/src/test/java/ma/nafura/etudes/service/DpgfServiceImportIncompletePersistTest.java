package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.dpgf.Dpgf;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.repository.DpgfRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Repro : valider une extraction avec 2 articles incomplets ne doit pas les faire
 * disparaître de l’arbre (chemin perdu pour la correction manuelle).
 */
@ExtendWith(MockitoExtension.class)
class DpgfServiceImportIncompletePersistTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    @Mock
    private DpgfRepository repository;

    @Mock
    private DpgfNoeudRepository noeudRepository;

    private DpgfService service;
    private final List<DpgfNoeud> savedNoeuds = new ArrayList<>();
    private Dpgf storedDpgf;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new DpgfService(
                repository,
                noeudRepository,
                mock(DossierEtudeRepository.class),
                new DpgfAgregationService(),
                mock(ParametresEtudeService.class),
                new DpuCalculator(),
                mock(DossierIntervenantService.class));

        when(repository.countByTenantIdAndNumeroStartingWith(any(), any())).thenReturn(0L);
        when(repository.save(any(Dpgf.class))).thenAnswer(inv -> {
            Dpgf dpgf = inv.getArgument(0);
            if (dpgf.getId() == null) {
                dpgf.setId(UUID.randomUUID());
            }
            storedDpgf = dpgf;
            return dpgf;
        });
        when(repository.findByIdAndTenantId(any(), any()))
                .thenAnswer(inv -> Optional.ofNullable(storedDpgf));
        when(noeudRepository.save(any(DpgfNoeud.class))).thenAnswer(inv -> {
            DpgfNoeud noeud = inv.getArgument(0);
            if (noeud.getId() == null) {
                noeud.setId(UUID.randomUUID());
            }
            savedNoeuds.add(noeud);
            return noeud;
        });
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(any(), any()))
                .thenAnswer(inv -> List.copyOf(savedNoeuds));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void persisteLesArticlesIncompletsPourGarderLeCheminDeCorrection() {
        ImportNoeudDto lot = new ImportNoeudDto();
        lot.setType("LOT");
        lot.setCode("3");
        lot.setLibelle("Électricité");
        lot.setEnfants(List.of(
                article("3.9.2", "m2", new BigDecimal("12")),
                article("3.9.3", "u", BigDecimal.ZERO)));

        ImportTreeRequest request = new ImportTreeRequest();
        request.setArbre(List.of(lot));

        DpgfService.ImportResult result =
                service.createFromImport(request, "DE-0002", new BigDecimal("20"));

        List<DpgfNoeud> articles = savedNoeuds.stream()
                .filter(n -> DpgfNoeud.TYPE_ARTICLE.equals(n.getType()))
                .toList();
        assertThat(articles).extracting(DpgfNoeud::getCode).containsExactly("3.9.2", "3.9.3");
        assertThat(result.articlesAcceptes()).isEqualTo(1);
        assertThat(result.articlesIgnores()).isEqualTo(1);
    }

    private static ImportNoeudDto article(String code, String unite, BigDecimal quantite) {
        ImportNoeudDto dto = new ImportNoeudDto();
        dto.setType("ARTICLE");
        dto.setCode(code);
        dto.setLibelle(code);
        dto.setUnite(unite);
        dto.setQuantite(quantite);
        return dto;
    }
}
