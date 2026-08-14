package ma.nafura.venuecatalog.place.adapter.persistence;

import ma.nafura.venuecatalog.place.domain.CityCode;
import ma.nafura.venuecatalog.place.domain.PlaceStatus;
import ma.nafura.venuecatalog.place.domain.PrimaryCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CatalogPlaceRepository extends JpaRepository<CatalogPlaceEntity, UUID> {

    @Query(
            value = """
                    SELECT p.* FROM catalog_places p
                    LEFT JOIN catalog_place_geo_resolutions g ON g.catalog_place_id = p.id
                    LEFT JOIN catalog_place_ai_enrichments a ON a.catalog_place_id = p.id
                    LEFT JOIN catalog_place_app_scores layali
                           ON layali.catalog_place_id = p.id AND layali.app_id = 'LAYALI'
                    WHERE (:q IS NULL OR :q = '' OR LOWER(p.canonical_name) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%')))
                      AND (:cityCode IS NULL OR p.city_code = CAST(:cityCode AS text))
                      AND (:primaryCategory IS NULL OR p.primary_category = CAST(:primaryCategory AS text))
                      AND (:status IS NULL OR p.status = CAST(:status AS text))
                      AND (
                            CAST(:needsReview AS text) IS NULL
                            OR (p.quality->>'manualReviewRequired') = CAST(:needsReview AS text)
                          )
                      AND (:districtCode IS NULL OR g.district_code = CAST(:districtCode AS text))
                      AND (
                            CAST(:venueTypesCsv AS text) IS NULL
                            OR EXISTS (
                                SELECT 1
                                FROM jsonb_array_elements_text(a.venue_types) AS vt(value)
                                WHERE vt.value = ANY (string_to_array(CAST(:venueTypesCsv AS text), ','))
                              )
                          )
                      AND (
                            CAST(:activitiesCsv AS text) IS NULL
                            OR EXISTS (
                                SELECT 1
                                FROM jsonb_array_elements_text(a.activities) AS act(value)
                                WHERE act.value = ANY (string_to_array(CAST(:activitiesCsv AS text), ','))
                              )
                          )
                      AND (:aiDecision IS NULL OR a.verdict = CAST(:aiDecision AS text))
                      AND (
                            CAST(:minScore AS double precision) IS NULL
                            OR EXISTS (
                                SELECT 1 FROM catalog_place_app_scores s
                                WHERE s.catalog_place_id = p.id
                                  AND s.score >= CAST(:minScore AS double precision)
                                  AND (:scoreAppId IS NULL OR s.app_id = CAST(:scoreAppId AS text))
                            )
                          )
                      AND (
                            CAST(:enrichmentStatus AS text) IS NULL
                            OR (
                                CAST(:enrichmentStatus AS text) = 'NONE'
                                AND g.id IS NULL AND a.id IS NULL
                            )
                            OR (
                                CAST(:enrichmentStatus AS text) = 'GEO_ONLY'
                                AND g.id IS NOT NULL AND a.id IS NULL
                            )
                            OR (
                                CAST(:enrichmentStatus AS text) = 'ENRICHED'
                                AND a.id IS NOT NULL
                            )
                          )
                    ORDER BY
                      CASE WHEN CAST(:sortKey AS text) = 'canonicalName_asc' THEN p.canonical_name END ASC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'canonicalName_desc' THEN p.canonical_name END DESC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'status_asc' THEN p.status END ASC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'status_desc' THEN p.status END DESC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'cityCode_asc' THEN p.city_code END ASC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'cityCode_desc' THEN p.city_code END DESC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'primaryCategory_asc' THEN p.primary_category END ASC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'primaryCategory_desc' THEN p.primary_category END DESC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'venueType_asc' THEN a.venue_types ->> 0 END ASC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'venueType_desc' THEN a.venue_types ->> 0 END DESC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'aiDecision_asc' THEN a.verdict END ASC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'aiDecision_desc' THEN a.verdict END DESC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'layaliScore_asc' THEN layali.score END ASC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'layaliScore_desc' THEN layali.score END DESC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'updatedAt_asc' THEN p.updated_at END ASC NULLS LAST,
                      CASE WHEN CAST(:sortKey AS text) = 'updatedAt_desc' THEN p.updated_at END DESC NULLS LAST,
                      p.updated_at DESC
                    """,
            countQuery = """
                    SELECT COUNT(*) FROM catalog_places p
                    LEFT JOIN catalog_place_geo_resolutions g ON g.catalog_place_id = p.id
                    LEFT JOIN catalog_place_ai_enrichments a ON a.catalog_place_id = p.id
                    WHERE (:q IS NULL OR :q = '' OR LOWER(p.canonical_name) LIKE LOWER(CONCAT('%', CAST(:q AS text), '%')))
                      AND (:cityCode IS NULL OR p.city_code = CAST(:cityCode AS text))
                      AND (:primaryCategory IS NULL OR p.primary_category = CAST(:primaryCategory AS text))
                      AND (:status IS NULL OR p.status = CAST(:status AS text))
                      AND (
                            CAST(:needsReview AS text) IS NULL
                            OR (p.quality->>'manualReviewRequired') = CAST(:needsReview AS text)
                          )
                      AND (:districtCode IS NULL OR g.district_code = CAST(:districtCode AS text))
                      AND (
                            CAST(:venueTypesCsv AS text) IS NULL
                            OR EXISTS (
                                SELECT 1
                                FROM jsonb_array_elements_text(a.venue_types) AS vt(value)
                                WHERE vt.value = ANY (string_to_array(CAST(:venueTypesCsv AS text), ','))
                              )
                          )
                      AND (
                            CAST(:activitiesCsv AS text) IS NULL
                            OR EXISTS (
                                SELECT 1
                                FROM jsonb_array_elements_text(a.activities) AS act(value)
                                WHERE act.value = ANY (string_to_array(CAST(:activitiesCsv AS text), ','))
                              )
                          )
                      AND (:aiDecision IS NULL OR a.verdict = CAST(:aiDecision AS text))
                      AND (
                            CAST(:minScore AS double precision) IS NULL
                            OR EXISTS (
                                SELECT 1 FROM catalog_place_app_scores s
                                WHERE s.catalog_place_id = p.id
                                  AND s.score >= CAST(:minScore AS double precision)
                                  AND (:scoreAppId IS NULL OR s.app_id = CAST(:scoreAppId AS text))
                            )
                          )
                      AND (
                            CAST(:enrichmentStatus AS text) IS NULL
                            OR (
                                CAST(:enrichmentStatus AS text) = 'NONE'
                                AND g.id IS NULL AND a.id IS NULL
                            )
                            OR (
                                CAST(:enrichmentStatus AS text) = 'GEO_ONLY'
                                AND g.id IS NOT NULL AND a.id IS NULL
                            )
                            OR (
                                CAST(:enrichmentStatus AS text) = 'ENRICHED'
                                AND a.id IS NOT NULL
                            )
                          )
                    """,
            nativeQuery = true
    )
    Page<CatalogPlaceEntity> searchFiltered(
            @Param("q") String q,
            @Param("cityCode") String cityCode,
            @Param("primaryCategory") String primaryCategory,
            @Param("status") String status,
            @Param("needsReview") String needsReview,
            @Param("districtCode") String districtCode,
            @Param("venueTypesCsv") String venueTypesCsv,
            @Param("activitiesCsv") String activitiesCsv,
            @Param("aiDecision") String aiDecision,
            @Param("minScore") Double minScore,
            @Param("scoreAppId") String scoreAppId,
            @Param("enrichmentStatus") String enrichmentStatus,
            @Param("sortKey") String sortKey,
            Pageable pageable
    );

    List<CatalogPlaceEntity> findByCityCodeAndPrimaryCategory(CityCode cityCode, PrimaryCategory primaryCategory);

    List<CatalogPlaceEntity> findByCityCode(CityCode cityCode);
}
