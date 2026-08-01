package com.blanner.repository;

import com.blanner.blan.Blan;
import com.blanner.model.entity.Comment;
import com.blanner.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    
    List<Comment> findByBlanIdOrderByCreatedAtAsc(UUID blanId);
    
    List<Comment> findByUserIdOrderByCreatedAtDesc(UUID userId);
    
    List<Comment> findByBlanOrderByCreatedAtAsc(Blan blan);
    
    List<Comment> findByUserOrderByCreatedAtDesc(User user);
    
    long countByBlanId(UUID blanId);
}
