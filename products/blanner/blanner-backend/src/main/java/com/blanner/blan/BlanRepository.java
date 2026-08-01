package com.blanner.blan;

import com.blanner.model.enums.BlanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface BlanRepository extends JpaRepository<Blan, UUID> {
    List<Blan> findByStatus(BlanStatus status);
    List<Blan> findByCreatorId(UUID creatorId);
    
    @Query("SELECT b FROM Blan b JOIN b.blanTime bt WHERE b.status = :status AND bt.date >= :date ORDER BY bt.date ASC, bt.time ASC")
    List<Blan> findActiveBlansFromDate(@Param("status") BlanStatus status, @Param("date") LocalDate date);
    
    @Query("SELECT b FROM Blan b WHERE b.status = :status AND b.visibility = 'PUBLIC' ORDER BY b.createdAt DESC")
    List<Blan> findPublicActiveBlans(@Param("status") BlanStatus status);
    
    @Query(value = """
        SELECT 
            b.id,
            b.max_participants,
            COALESCE(c.name, '') as category_name,
            COALESCE(c.default_image, '') as cover_image_url,
            bt.start_datetime as date_time,
            COALESCE(bl.mode, 'FLEXIBLE') as location_mode,
            b.mood as mood,
            u.id as owner_id,
            COALESCE(u.name, '') as owner_name,
            COALESCE(u.avatar_url, '') as owner_avatar_url,
            COALESCE(COUNT(DISTINCT CASE WHEN r.type = 'LIKE' THEN r.id END), 0) as like_count,
            COALESCE(COUNT(DISTINCT CASE WHEN r.type = 'SAVE' THEN r.id END), 0) as save_count,
            COALESCE(COUNT(DISTINCT p.id), 0) as participants_count,
            CASE WHEN EXISTS (SELECT 1 FROM blan_reaction r2 WHERE r2.blan_id = b.id AND r2.user_id = :userId AND r2.type = 'LIKE') THEN true ELSE false END as user_liked,
            CASE WHEN EXISTS (SELECT 1 FROM blan_reaction r3 WHERE r3.blan_id = b.id AND r3.user_id = :userId AND r3.type = 'SAVE') THEN true ELSE false END as user_saved,
            CASE WHEN EXISTS (SELECT 1 FROM participations p2 WHERE p2.blan_id = b.id AND p2.user_id = :userId) THEN true ELSE false END as user_participating,
            COALESCE((SELECT p3.status FROM participations p3 WHERE p3.blan_id = b.id AND p3.user_id = :userId LIMIT 1), 'NOT_REQUESTED') as user_participation_status,
            CASE 
                WHEN :lat IS NOT NULL AND :lng IS NOT NULL AND bl.latitude IS NOT NULL AND bl.longitude IS NOT NULL 
                THEN (6371 * acos(
                    cos(radians(:lat)) *
                    cos(radians(bl.latitude)) *
                    cos(radians(bl.longitude) - radians(:lng)) +
                    sin(radians(:lat)) *
                    sin(radians(bl.latitude))
                ))
                ELSE NULL
            END as distance_km
        FROM blans b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN blan_locations bl ON b.blan_location_id = bl.id
        LEFT JOIN blan_times bt ON b.blan_time_id = bt.id
        LEFT JOIN users u ON b.creator_id = u.id
        LEFT JOIN blan_reaction r ON r.blan_id = b.id
        LEFT JOIN participations p ON p.blan_id = b.id
        WHERE b.status = 'ACTIVE' AND b.creator_id != :userId
        GROUP BY b.id, b.max_participants, c.name, c.default_image, bt.start_datetime, bl.mode, bl.latitude, bl.longitude, b.mood, u.id, u.name, u.avatar_url, b.created_at
        ORDER BY bt.start_datetime ASC NULLS LAST, b.created_at ASC
        """, nativeQuery = true)
    Page<Object[]> findFeedItems(@Param("userId") UUID userId, 
                                  @Param("lat") Double lat, 
                                  @Param("lng") Double lng, 
                                  Pageable pageable);
    
    @Query(value = """
        SELECT 
            b.id,
            b.max_participants,
            COALESCE(c.name, '') as category_name,
            COALESCE(c.default_image, '') as cover_image_url,
            bt.start_datetime as date_time,
            COALESCE(bl.mode, 'FLEXIBLE') as location_mode,
            b.mood as mood,
            u.id as owner_id,
            COALESCE(u.name, '') as owner_name,
            COALESCE(u.avatar_url, '') as owner_avatar_url,
            COALESCE(COUNT(DISTINCT CASE WHEN r.type = 'LIKE' THEN r.id END), 0) as like_count,
            COALESCE(COUNT(DISTINCT CASE WHEN r.type = 'SAVE' THEN r.id END), 0) as save_count,
            COALESCE(COUNT(DISTINCT p.id), 0) as participants_count,
            CASE WHEN EXISTS (SELECT 1 FROM blan_reaction r2 WHERE r2.blan_id = b.id AND r2.user_id = :userId AND r2.type = 'LIKE') THEN true ELSE false END as user_liked,
            CASE WHEN EXISTS (SELECT 1 FROM blan_reaction r3 WHERE r3.blan_id = b.id AND r3.user_id = :userId AND r3.type = 'SAVE') THEN true ELSE false END as user_saved,
            CASE WHEN EXISTS (SELECT 1 FROM participations p2 WHERE p2.blan_id = b.id AND p2.user_id = :userId) THEN true ELSE false END as user_participating,
            COALESCE((SELECT p3.status FROM participations p3 WHERE p3.blan_id = b.id AND p3.user_id = :userId LIMIT 1), 'NOT_REQUESTED') as user_participation_status,
            NULL as distance_km
        FROM blans b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN blan_locations bl ON b.blan_location_id = bl.id
        LEFT JOIN blan_times bt ON b.blan_time_id = bt.id
        LEFT JOIN users u ON b.creator_id = u.id
        LEFT JOIN blan_reaction r ON r.blan_id = b.id
        LEFT JOIN participations p ON p.blan_id = b.id
        WHERE b.status = 'ACTIVE' AND b.creator_id = :userId
        GROUP BY b.id, b.max_participants, c.name, c.default_image, bt.start_datetime, bl.mode, b.mood, u.id, u.name, u.avatar_url, b.created_at
        ORDER BY bt.start_datetime ASC NULLS LAST, b.created_at ASC
        """, nativeQuery = true)
    Page<Object[]> findCreatedBlans(@Param("userId") UUID userId, 
                                     Pageable pageable);
    
    @Query(value = """
        SELECT 
            b.id,
            b.max_participants,
            COALESCE(c.name, '') as category_name,
            COALESCE(c.default_image, '') as cover_image_url,
            bt.start_datetime as date_time,
            COALESCE(bl.mode, 'FLEXIBLE') as location_mode,
            b.mood as mood,
            u.id as owner_id,
            COALESCE(u.name, '') as owner_name,
            COALESCE(u.avatar_url, '') as owner_avatar_url,
            COALESCE(COUNT(DISTINCT CASE WHEN r.type = 'LIKE' THEN r.id END), 0) as like_count,
            COALESCE(COUNT(DISTINCT CASE WHEN r.type = 'SAVE' THEN r.id END), 0) as save_count,
            COALESCE(COUNT(DISTINCT p.id), 0) as participants_count,
            CASE WHEN EXISTS (SELECT 1 FROM blan_reaction r2 WHERE r2.blan_id = b.id AND r2.user_id = :userId AND r2.type = 'LIKE') THEN true ELSE false END as user_liked,
            CASE WHEN EXISTS (SELECT 1 FROM blan_reaction r3 WHERE r3.blan_id = b.id AND r3.user_id = :userId AND r3.type = 'SAVE') THEN true ELSE false END as user_saved,
            CASE WHEN EXISTS (SELECT 1 FROM participations p2 WHERE p2.blan_id = b.id AND p2.user_id = :userId) THEN true ELSE false END as user_participating,
            COALESCE((SELECT p3.status FROM participations p3 WHERE p3.blan_id = b.id AND p3.user_id = :userId LIMIT 1), 'NOT_REQUESTED') as user_participation_status,
            NULL as distance_km
        FROM blans b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN blan_locations bl ON b.blan_location_id = bl.id
        LEFT JOIN blan_times bt ON b.blan_time_id = bt.id
        LEFT JOIN users u ON b.creator_id = u.id
        LEFT JOIN blan_reaction r ON r.blan_id = b.id
        LEFT JOIN participations p ON p.blan_id = b.id
        WHERE b.status = 'ACTIVE' 
            AND EXISTS (SELECT 1 FROM participations p4 WHERE p4.blan_id = b.id AND p4.user_id = :userId AND p4.status = 'ACCEPTED')
        GROUP BY b.id, b.max_participants, c.name, c.default_image, bt.start_datetime, bl.mode, b.mood, u.id, u.name, u.avatar_url, b.created_at
        ORDER BY bt.start_datetime ASC NULLS LAST, b.created_at ASC
        """, nativeQuery = true)
    Page<Object[]> findParticipatingBlans(@Param("userId") UUID userId, 
                                           Pageable pageable);
    
    @Query(value = """
        SELECT 
            b.id,
            b.max_participants,
            COALESCE(c.name, '') as category_name,
            COALESCE(c.default_image, '') as cover_image_url,
            bt.start_datetime as date_time,
            COALESCE(bl.mode, 'FLEXIBLE') as location_mode,
            b.mood as mood,
            u.id as owner_id,
            COALESCE(u.name, '') as owner_name,
            COALESCE(u.avatar_url, '') as owner_avatar_url,
            COALESCE(COUNT(DISTINCT CASE WHEN r.type = 'LIKE' THEN r.id END), 0) as like_count,
            COALESCE(COUNT(DISTINCT CASE WHEN r.type = 'SAVE' THEN r.id END), 0) as save_count,
            COALESCE(COUNT(DISTINCT p.id), 0) as participants_count,
            CASE WHEN EXISTS (SELECT 1 FROM blan_reaction r2 WHERE r2.blan_id = b.id AND r2.user_id = :userId AND r2.type = 'LIKE') THEN true ELSE false END as user_liked,
            CASE WHEN EXISTS (SELECT 1 FROM blan_reaction r3 WHERE r3.blan_id = b.id AND r3.user_id = :userId AND r3.type = 'SAVE') THEN true ELSE false END as user_saved,
            CASE WHEN EXISTS (SELECT 1 FROM participations p2 WHERE p2.blan_id = b.id AND p2.user_id = :userId) THEN true ELSE false END as user_participating,
            COALESCE((SELECT p3.status FROM participations p3 WHERE p3.blan_id = b.id AND p3.user_id = :userId LIMIT 1), 'NOT_REQUESTED') as user_participation_status,
            NULL as distance_km
        FROM blans b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN blan_locations bl ON b.blan_location_id = bl.id
        LEFT JOIN blan_times bt ON b.blan_time_id = bt.id
        LEFT JOIN users u ON b.creator_id = u.id
        LEFT JOIN blan_reaction r ON r.blan_id = b.id
        LEFT JOIN participations p ON p.blan_id = b.id
        WHERE b.status = 'ACTIVE' 
            AND b.creator_id = :userId
            AND EXISTS (SELECT 1 FROM participations p4 WHERE p4.blan_id = b.id AND p4.status = 'REQUESTED')
        GROUP BY b.id, b.max_participants, c.name, c.default_image, bt.start_datetime, bl.mode, b.mood, u.id, u.name, u.avatar_url, b.created_at
        ORDER BY bt.start_datetime ASC NULLS LAST, b.created_at ASC
        """, nativeQuery = true)
    Page<Object[]> findRequestedBlans(@Param("userId") UUID userId, 
                                       Pageable pageable);
}

