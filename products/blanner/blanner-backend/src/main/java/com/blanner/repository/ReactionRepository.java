package com.blanner.repository;

import com.blanner.blan.Blan;
import com.blanner.model.entity.Reaction;
import com.blanner.model.entity.User;
import com.blanner.model.enums.ReactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, UUID> {
    
    List<Reaction> findByBlanId(UUID blanId);
    
    List<Reaction> findByUserId(UUID userId);
    
    Optional<Reaction> findByUserAndBlan(User user, Blan blan);
    
    Optional<Reaction> findByUserAndBlanAndType(User user, Blan blan, ReactionType type);
    
    List<Reaction> findByBlanAndType(Blan blan, ReactionType type);
    
    long countByBlanId(UUID blanId);
    
    long countByBlanAndType(Blan blan, ReactionType type);
    
    boolean existsByUserAndBlan(User user, Blan blan);
}
