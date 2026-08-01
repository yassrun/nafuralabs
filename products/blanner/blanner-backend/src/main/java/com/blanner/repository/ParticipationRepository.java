package com.blanner.repository;

import com.blanner.model.entity.Participation;
import com.blanner.model.enums.ParticipationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParticipationRepository extends JpaRepository<Participation, UUID> {
    List<Participation> findByBlanId(UUID blanId);
    List<Participation> findByUserId(UUID userId);
    List<Participation> findByBlanIdAndStatus(UUID blanId, ParticipationStatus status);
    Optional<Participation> findByBlanIdAndUserId(UUID blanId, UUID userId);
    boolean existsByBlanIdAndUserId(UUID blanId, UUID userId);
}
