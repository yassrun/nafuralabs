package com.blanner.service;

import com.blanner.blan.Blan;
import com.blanner.blan.BlanRepository;
import com.blanner.dto.CreateParticipationRequest;
import com.blanner.dto.ParticipationDto;
import com.blanner.model.entity.Participation;
import com.blanner.model.entity.User;
import com.blanner.model.enums.ParticipationStatus;
import com.blanner.repository.ParticipationRepository;
import com.blanner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ParticipationService {

    private final ParticipationRepository participationRepository;
    private final BlanRepository blanRepository;
    private final UserRepository userRepository;

    public ParticipationDto createParticipation(CreateParticipationRequest request) {
        log.info("[CREATE PARTICIPATION] Creating participation for blan: {}, user: {}", 
                request.getBlanId(), request.getUserId());
        
        // Check if participation already exists
        if (participationRepository.existsByBlanIdAndUserId(request.getBlanId(), request.getUserId())) {
            throw new IllegalArgumentException("Participation already exists for this blan and user");
        }
        
        // Validate blan exists
        Blan blan = blanRepository.findById(request.getBlanId())
                .orElseThrow(() -> new IllegalArgumentException("Blan not found with id: " + request.getBlanId()));
        
        // Validate user exists
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + request.getUserId()));
        
        // Create participation
        Participation participation = Participation.builder()
                .blan(blan)
                .user(user)
                .status(request.getStatus())
                .joinedAt(LocalDateTime.now())
                .build();
        
        Participation savedParticipation = participationRepository.save(participation);
        log.info("[CREATE PARTICIPATION] Successfully created participation with id: {}", savedParticipation.getId());
        
        return convertToDto(savedParticipation);
    }

    private ParticipationDto convertToDto(Participation participation) {
        return ParticipationDto.builder()
                .id(participation.getId())
                .blanId(participation.getBlan().getId())
                .userId(participation.getUser().getId())
                .status(participation.getStatus())
                .joinedAt(participation.getJoinedAt())
                .updatedAt(participation.getUpdatedAt())
                .build();
    }
}

