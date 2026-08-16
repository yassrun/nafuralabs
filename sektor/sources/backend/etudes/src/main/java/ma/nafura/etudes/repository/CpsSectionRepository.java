package ma.nafura.etudes.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.cps.CpsSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Toute requete est scopee par tenant — defaut trouve au lot 9, ne pas le reproduire. */
public interface CpsSectionRepository extends JpaRepository<CpsSection, UUID> {

    List<CpsSection> findByTenantIdAndCpsDocumentIdOrderByOrdreAsc(UUID tenantId, UUID cpsDocumentId);

    void deleteByCpsDocumentId(UUID cpsDocumentId);

    long countByTenantIdAndCpsDocumentId(UUID tenantId, UUID cpsDocumentId);

    /**
     * Recherche plein texte des sections pertinentes pour un article.
     *
     * <p>Aucun token LLM consomme ici : c'est du {@code tsvector} Postgres, local. Le modele
     * n'intervient qu'ensuite, sur les quelques sections retournees — c'est ce qui fait passer
     * le cout d'un CPS entier par article a quelques milliers de tokens.
     *
     * <p>{@code websearch_to_tsquery} tolere une requete en langage naturel (le libelle de
     * l'article) sans exiger d'operateurs booleens.
     *
     * <p>Le numero de section et le titre sont ponderes 'A', le corps 'B' : un article dont le
     * code correspond a une numerotation du CPS remonte en tete.
     */
    @Query(value = """
            SELECT s.* FROM cps_sections s
            WHERE s.tenant_id = :tenantId
              AND s.cps_document_id = :cpsDocumentId
              AND s.contenu_tsv @@ websearch_to_tsquery('french', :requete)
            ORDER BY ts_rank(s.contenu_tsv, websearch_to_tsquery('french', :requete)) DESC
            LIMIT :limite
            """, nativeQuery = true)
    List<CpsSection> rechercher(
            @Param("tenantId") UUID tenantId,
            @Param("cpsDocumentId") UUID cpsDocumentId,
            @Param("requete") String requete,
            @Param("limite") int limite);

    /**
     * Correspondance de numerotation bordereau ↔ CPS ({@code 6.1.3} / {@code 6-1-3}).
     * Les doublons de sommaire (contenu quasi vide) passent apres la prescription.
     */
    @Query(value = """
            SELECT s.* FROM cps_sections s
            WHERE s.tenant_id = :tenantId
              AND s.cps_document_id = :cpsDocumentId
              AND replace(lower(coalesce(s.numero, '')), '-', '.') = lower(:code)
            ORDER BY length(s.contenu) DESC
            LIMIT :limite
            """, nativeQuery = true)
    List<CpsSection> trouverParNumero(
            @Param("tenantId") UUID tenantId,
            @Param("cpsDocumentId") UUID cpsDocumentId,
            @Param("code") String code,
            @Param("limite") int limite);

    /**
     * FTS en OU ({@code to_tsquery} déjà construit, lexèmes sûrs). Un AND sur le libellé
     * BDP entier (dimensions, « y compris », « importation ») rate une section CPS qui
     * porte le même numéro et le même matériau.
     */
    @Query(value = """
            SELECT s.* FROM cps_sections s
            WHERE s.tenant_id = :tenantId
              AND s.cps_document_id = :cpsDocumentId
              AND s.contenu_tsv @@ to_tsquery('french', :tsquery)
            ORDER BY ts_rank(s.contenu_tsv, to_tsquery('french', :tsquery)) DESC
            LIMIT :limite
            """, nativeQuery = true)
    List<CpsSection> rechercherTsQuery(
            @Param("tenantId") UUID tenantId,
            @Param("cpsDocumentId") UUID cpsDocumentId,
            @Param("tsquery") String tsquery,
            @Param("limite") int limite);
}
