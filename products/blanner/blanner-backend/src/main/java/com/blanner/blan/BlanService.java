package com.blanner.blan;

import com.blanner.categories.Category;
import com.blanner.categories.CategoryRepository;
import com.blanner.dto.CreateBlanRequest;
import com.blanner.dto.ReactionResponse;
import com.blanner.model.entity.*;
import com.blanner.model.enums.*;
import com.blanner.repository.ReactionRepository;
import com.blanner.service.UserService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BlanService {
    
    private final BlanRepository blanRepository;
    private final UserService userService;
    private final CategoryRepository categoryRepository;
    private final ReactionRepository reactionRepository;
    private final EntityManager entityManager;
    private final BlanMapper blanMapper;
    
    public BlanDto createBlan(CreateBlanRequest request) {
        log.info("[CREATE BLAN] Creating new blan with request: {}", request);
        
        // Map CreateBlanRequest to Blan using MapStruct (with default values)
        Blan blan = blanMapper.toEntity(request);
        
        // Resolve relations following JPA best practices:
        // - Category (user input): validate existence with findById() for clear error messages
        // - Creator (authenticated user): use getReference() for performance (entity existence guaranteed)
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + request.getCategoryId()));
        blan.setCategory(category);
        
        User creator = entityManager.getReference(User.class, request.getCreatorId());
        blan.setCreator(creator);
        
        // Save and return
        Blan savedBlan = blanRepository.save(blan);
        log.info("[CREATE BLAN] Successfully created blan with id: {}", savedBlan.getId());
        
        return mapToDto(savedBlan);
    }
    
    @Transactional(readOnly = true)
    public Page<BlanFeedItemDto> getFeed(UUID userId, Double lat, Double lng, Pageable pageable) {
        log.info("[GET FEED] Retrieving feed for userId: {}, lat: {}, lng: {}, page: {}, size: {}", 
                userId, lat, lng, pageable.getPageNumber(), pageable.getPageSize());
        
        Page<Object[]> results = blanRepository.findFeedItems(userId, lat, lng, pageable);
        
        log.info("[GET FEED] Query returned {} total elements, {} items in current page", 
                results.getTotalElements(), results.getContent().size());
        
        List<BlanFeedItemDto> feedItems = results.getContent().stream()
                .map(this::mapFeedItemToDto)
                .collect(Collectors.toList());
        
        log.info("[GET FEED] Mapped {} feed items successfully", feedItems.size());
        
        return new PageImpl<>(feedItems, pageable, results.getTotalElements());
    }
    
    @Transactional(readOnly = true)
    public Page<BlanFeedItemDto> getCreatedBlans(UUID userId, Pageable pageable) {
        log.info("[GET CREATED BLANS] Retrieving created blans for userId: {}, page: {}, size: {}", 
                userId, pageable.getPageNumber(), pageable.getPageSize());
        
        Page<Object[]> results = blanRepository.findCreatedBlans(userId, pageable);
        
        log.info("[GET CREATED BLANS] Query returned {} total elements, {} items in current page", 
                results.getTotalElements(), results.getContent().size());
        
        List<BlanFeedItemDto> feedItems = results.getContent().stream()
                .map(this::mapFeedItemToDto)
                .collect(Collectors.toList());
        
        log.info("[GET CREATED BLANS] Mapped {} feed items successfully", feedItems.size());
        
        return new PageImpl<>(feedItems, pageable, results.getTotalElements());
    }
    
    @Transactional(readOnly = true)
    public Page<BlanFeedItemDto> getParticipatingBlans(UUID userId, Pageable pageable) {
        log.info("[GET PARTICIPATING BLANS] Retrieving participating blans for userId: {}, page: {}, size: {}", 
                userId, pageable.getPageNumber(), pageable.getPageSize());
        
        Page<Object[]> results = blanRepository.findParticipatingBlans(userId, pageable);
        
        log.info("[GET PARTICIPATING BLANS] Query returned {} total elements, {} items in current page", 
                results.getTotalElements(), results.getContent().size());
        
        List<BlanFeedItemDto> feedItems = results.getContent().stream()
                .map(this::mapFeedItemToDto)
                .collect(Collectors.toList());
        
        log.info("[GET PARTICIPATING BLANS] Mapped {} feed items successfully", feedItems.size());
        
        return new PageImpl<>(feedItems, pageable, results.getTotalElements());
    }
    
    @Transactional(readOnly = true)
    public Page<BlanFeedItemDto> getRequestedBlans(UUID userId, Pageable pageable) {
        log.info("[GET REQUESTED BLANS] Retrieving requested blans for userId: {}, page: {}, size: {}", 
                userId, pageable.getPageNumber(), pageable.getPageSize());
        
        Page<Object[]> results = blanRepository.findRequestedBlans(userId, pageable);
        
        log.info("[GET REQUESTED BLANS] Query returned {} total elements, {} items in current page", 
                results.getTotalElements(), results.getContent().size());
        
        List<BlanFeedItemDto> feedItems = results.getContent().stream()
                .map(this::mapFeedItemToDto)
                .collect(Collectors.toList());
        
        log.info("[GET REQUESTED BLANS] Mapped {} feed items successfully", feedItems.size());
        
        return new PageImpl<>(feedItems, pageable, results.getTotalElements());
    }
    
    private BlanFeedItemDto mapFeedItemToDto(Object[] row) {
        // Query result order:
        // 0: b.id (UUID)
        // 1: b.max_participants (Integer)
        // 2: category_name (String)
        // 3: cover_image_url (String)
        // 4: date_time (LocalDateTime)
        // 5: location_mode (String)
        // 6: mood (String)
        // 7: owner_id (UUID)
        // 8: owner_name (String)
        // 9: owner_avatar_url (String)
        // 10: like_count (Long)
        // 11: save_count (Long)
        // 12: participants_count (Long)
        // 13: user_liked (Boolean)
        // 14: user_saved (Boolean)
        // 15: user_participating (Boolean)
        // 16: user_participation_status (String)
        // 17: distance_km (Double)
        
        UUID id = (UUID) row[0];
        Integer maxParticipants = (Integer) row[1];
        String categoryName = (String) row[2];
        String coverImageUrl = (String) row[3];
        LocalDateTime dateTime = row[4] != null ? (LocalDateTime) row[4] : null;
        String locationMode = (String) row[5];
        String mood = (String) row[6];
        UUID ownerId = (UUID) row[7];
        String ownerName = (String) row[8];
        String ownerAvatarUrl = (String) row[9];
        Long likeCount = ((Number) row[10]).longValue();
        Long saveCount = ((Number) row[11]).longValue();
        Long participantsCount = ((Number) row[12]).longValue();
        
        // Handle boolean values - PostgreSQL may return them as Boolean or boolean
        Boolean userLiked = row[13] != null ? (Boolean) row[13] : false;
        Boolean userSaved = row[14] != null ? (Boolean) row[14] : false;
        Boolean userParticipating = row[15] != null ? (Boolean) row[15] : false;
        
        // Get participation status (defaults to NOT_REQUESTED if no participation exists)
        String userParticipationStatus = row[16] != null ? (String) row[16] : "NOT_REQUESTED";
        
        Double distanceKm = row[17] != null ? ((Number) row[17]).doubleValue() : null;
        
        // Generate title: "Category - Mood" format
        String title = categoryName;
        if (mood != null && !mood.isEmpty()) {
            title = categoryName.isEmpty() ? mood : categoryName + " - " + mood;
        }
        
        return BlanFeedItemDto.builder()
                .id(id)
                .title(title)
                .category(categoryName)
                .dateTime(dateTime)
                .locationMode(locationMode)
                .participantsCount(participantsCount.intValue())
                .maxParticipants(maxParticipants)
                .userParticipating(userParticipating)
                .userParticipationStatus(userParticipationStatus)
                .likeCount(likeCount.intValue())
                .saveCount(saveCount.intValue())
                .userLiked(userLiked)
                .userSaved(userSaved)
                .distanceKm(distanceKm)
                .ownerId(ownerId)
                .ownerName(ownerName != null && !ownerName.isEmpty() ? ownerName : null)
                .ownerAvatarUrl(ownerAvatarUrl != null && !ownerAvatarUrl.isEmpty() ? ownerAvatarUrl : null)
                .coverImageUrl(coverImageUrl != null && !coverImageUrl.isEmpty() ? coverImageUrl : null)
                .build();
    }
    
    private BlanDto mapToDto(Blan blan) {
        BlanDto.BlanDtoBuilder builder = BlanDto.builder()
                .id(blan.getId())
                .creatorId(blan.getCreator().getId())
                .creatorName(blan.getCreator().getName())
                .categoryId(blan.getCategory() != null ? blan.getCategory().getId() : null)
                .categoryName(blan.getCategory() != null ? blan.getCategory().getName() : null)
                .groupSize(blan.getGroupSize())
                .genderPref(blan.getGenderPref())
                .mood(blan.getMood())
                .billPolicy(blan.getBillPolicy())
                .visibility(blan.getVisibility())
                .approvalRequired(blan.getApprovalRequired())
                .maxParticipants(blan.getMaxParticipants())
                .customDescription(blan.getCustomDescription())
                .status(blan.getStatus())
                .likeCount(blan.getLikeCount())
                .commentCount(blan.getCommentCount())
                .joinCount(blan.getJoinCount())
                .createdAt(blan.getCreatedAt())
                .updatedAt(blan.getUpdatedAt());
        
        // Map location
        if (blan.getBlanLocation() != null) {
            BlanLocation loc = blan.getBlanLocation();
            BlanDto.LocationDto.LocationDtoBuilder locationBuilder = BlanDto.LocationDto.builder()
                    .mode(loc.getMode());
            
            if (loc.getMode() == LocationMode.EXACT_PLACE) {
                locationBuilder.placeId(loc.getPlaceId())
                              .placeName(loc.getPlaceName())
                              .address(loc.getAddress())
                              .latitude(loc.getLatitude())
                              .longitude(loc.getLongitude());
            } else if (loc.getMode() == LocationMode.AREA) {
                locationBuilder.areaName(loc.getAreaName())
                              .address(loc.getAddress());
                
                // Map BoundingBox from entity to DTO
                if (loc.getAreaBoundingBox() != null) {
                    BlanLocation.BoundingBox bbox = loc.getAreaBoundingBox();
                    BlanDto.BoundingBox boundingBoxDto = BlanDto.BoundingBox.builder()
                            .northeastLat(bbox.getNortheastLat())
                            .northeastLng(bbox.getNortheastLng())
                            .southwestLat(bbox.getSouthwestLat())
                            .southwestLng(bbox.getSouthwestLng())
                            .build();
                    locationBuilder.areaBoundingBox(boundingBoxDto);
                }
            }
            // FLEXIBLE mode requires no additional fields
            
            builder.location(locationBuilder.build());
        }
        
        // Map blanTime
        if (blan.getBlanTime() != null) {
            BlanTime blanTime = blan.getBlanTime();
            BlanDto.ScheduleDto scheduleDto = BlanDto.ScheduleDto.builder()
                    .date(blanTime.getDate())
                    .time(blanTime.getTime())
                    .timePhrase(blanTime.getTimePhrase())
                    .build();
            builder.schedule(scheduleDto);
        }
        
        return builder.build();
    }
    
    public ReactionResponse toggleLike(UUID blanId) {
        log.info("[TOGGLE LIKE] Toggling like for blan id: {}", blanId);
        
        Blan blan = blanRepository.findById(blanId)
                .orElseThrow(() -> new IllegalArgumentException("Blan not found with id: " + blanId));
        
        User user = userService.getCurrentUserOrCreate();
        
        Optional<Reaction> existingReaction = reactionRepository.findByUserAndBlanAndType(
                user, blan, ReactionType.LIKE);
        
        boolean userLiked;
        if (existingReaction.isPresent()) {
            // Remove like
            reactionRepository.delete(existingReaction.get());
            userLiked = false;
            log.info("[TOGGLE LIKE] Removed like from blan {}", blanId);
        } else {
            // Add like
            Reaction reaction = Reaction.builder()
                    .user(user)
                    .blan(blan)
                    .type(ReactionType.LIKE)
                    .build();
            reactionRepository.save(reaction);
            userLiked = true;
            log.info("[TOGGLE LIKE] Added like to blan {}", blanId);
        }
        
        long likeCount = reactionRepository.countByBlanAndType(blan, ReactionType.LIKE);
        boolean userSaved = reactionRepository.findByUserAndBlanAndType(user, blan, ReactionType.SAVE)
                .isPresent();
        long saveCount = reactionRepository.countByBlanAndType(blan, ReactionType.SAVE);
        
        return ReactionResponse.builder()
                .userLiked(userLiked)
                .userSaved(userSaved)
                .likeCount(likeCount)
                .saveCount(saveCount)
                .build();
    }
    
    public ReactionResponse toggleSave(UUID blanId) {
        log.info("[TOGGLE SAVE] Toggling save for blan id: {}", blanId);
        
        Blan blan = blanRepository.findById(blanId)
                .orElseThrow(() -> new IllegalArgumentException("Blan not found with id: " + blanId));
        
        User user = userService.getCurrentUserOrCreate();
        
        Optional<Reaction> existingReaction = reactionRepository.findByUserAndBlanAndType(
                user, blan, ReactionType.SAVE);
        
        boolean userSaved;
        if (existingReaction.isPresent()) {
            // Remove save
            reactionRepository.delete(existingReaction.get());
            userSaved = false;
            log.info("[TOGGLE SAVE] Removed save from blan {}", blanId);
        } else {
            // Add save
            Reaction reaction = Reaction.builder()
                    .user(user)
                    .blan(blan)
                    .type(ReactionType.SAVE)
                    .build();
            reactionRepository.save(reaction);
            userSaved = true;
            log.info("[TOGGLE SAVE] Added save to blan {}", blanId);
        }
        
        long saveCount = reactionRepository.countByBlanAndType(blan, ReactionType.SAVE);
        boolean userLiked = reactionRepository.findByUserAndBlanAndType(user, blan, ReactionType.LIKE)
                .isPresent();
        long likeCount = reactionRepository.countByBlanAndType(blan, ReactionType.LIKE);
        
        return ReactionResponse.builder()
                .userLiked(userLiked)
                .userSaved(userSaved)
                .likeCount(likeCount)
                .saveCount(saveCount)
                .build();
    }
}

